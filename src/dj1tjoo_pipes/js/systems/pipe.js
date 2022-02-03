import { globalConfig } from "shapez/core/config";
import { BUILD_OPTIONS } from "shapez/core/globals";
import { createLogger } from "shapez/core/logging";
import { StaleAreaDetector } from "shapez/core/stale_area_detector";
import { round1Digit } from "shapez/core/utils";
import {
    arrayAllDirections,
    Vector,
    enumDirection,
    enumDirectionToVector,
    enumInvertedDirections,
} from "shapez/core/vector";
import { gBuildingVariants, getCodeFromBuildingData } from "shapez/game/building_codes";
import { GameSystem } from "shapez/game/game_system";
import { MapChunkView } from "shapez/game/map_chunk_view";
import { BaseFluid } from "../base_fluid";
import { enumPipeType, PipeComponent } from "../components/pipe";
import { PipedPinsComponent, enumPinSlotType } from "../components/pipe_pins";

export const arrayPipeRotationVariantToType = [
    enumPipeType.forward,
    enumPipeType.turn,
    enumPipeType.split,
    enumPipeType.cross,
];

const renderPipesInfo = BUILD_OPTIONS.IS_DEV && true;

const logger = createLogger("pipes");
let networkUidCounter = 0;

const VERBOSE_PIPES = BUILD_OPTIONS.IS_DEV && false;

export class PipeNetwork {
    constructor() {
        /**
         * Who contributes to this network
         * @type {{ entity: import("shapez/savegame/savegame_typedefs").Entity, slot: import("../components/pipe_pins").PipePinSlot }} */
        this.provider = null;

        /**
         * Who takes values from this network
         * @type {Array<{ entity: import("shapez/savegame/savegame_typedefs").Entity, slot: import("../components/pipe_pins").PipePinSlot }>} */
        this.receivers = [];

        /**
         * All connected slots
         * @type {Array<{ entity: import("shapez/savegame/savegame_typedefs").Entity, slot: import("../components/pipe_pins").PipePinSlot }>}
         */
        this.allSlots = [];

        /**
         * Which pipes are in this network
         * @type {Array<import("shapez/savegame/savegame_typedefs").Entity>}
         */
        this.pipes = [];

        /**
         * The current value of this network
         * @type {Number}
         */
        this.currentPressure = 0;

        /**
         * The current value of this network
         * @type {BaseFluid}
         */
        this.currentFluid = null;

        /**
         * The current volume of this network
         * @type {Number}
         */
        this.currentVolume = 0;

        /**
         * Unique network identifier
         * @type {number}
         */
        this.uid = ++networkUidCounter;
    }

    /**
     * Returns whether this network currently has a value
     * @returns {boolean}
     */
    hasValue() {
        return !!this.currentPressure && !!this.currentFluid;
    }
}

export class PipeSystem extends GameSystem {
    constructor(root) {
        super(root);

        this.root.signals.entityDestroyed.add(this.queuePlacementUpdate, this);
        this.root.signals.entityAdded.add(this.queuePlacementUpdate, this);

        this.root.signals.entityDestroyed.add(this.queueRecomputeIfPipe, this);
        this.root.signals.entityChanged.add(this.queueRecomputeIfPipe, this);
        this.root.signals.entityAdded.add(this.queueRecomputeIfPipe, this);

        this.needsRecompute = true;
        this.isFirstRecompute = true;

        this.staleArea = new StaleAreaDetector({
            root: this.root,
            name: "pipes",
            recomputeMethod: this.updateSurroundingPipePlacement.bind(this),
        });

        /**
         * @type {Array<PipeNetwork>}
         */
        this.networks = [];
        this.oldNetworks = [];
    }

    /**
     * Invalidates the pipes network if the given entity is relevant for it
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     */
    queueRecomputeIfPipe(entity) {
        if (!this.root.gameInitialized) {
            return;
        }

        if (this.isEntityRelevantForPipes(entity)) {
            this.needsRecompute = true;
            this.oldNetworks = [...this.networks];
            this.networks = [];
        }
    }

    /**
     * Recomputes the whole pipes network
     */
    recomputePipesNetwork() {
        this.needsRecompute = false;
        logger.log("Recomputing pipes network");

        if (this.networks.length > 0) {
            this.oldNetworks = [...this.networks];
        }
        this.networks = [];

        const pipeEntities = this.root.entityMgr.getAllWithComponent(PipeComponent);
        const pinEntities = this.root.entityMgr.getAllWithComponent(PipedPinsComponent);

        // Clear all network references, but not on the first update since that's the deserializing one
        if (!this.isFirstRecompute) {
            for (let i = 0; i < pipeEntities.length; ++i) {
                // @ts-ignore
                pipeEntities[i].components.Pipe.linkedNetwork = null;
            }

            for (let i = 0; i < pinEntities.length; ++i) {
                // @ts-ignore
                const slots = pinEntities[i].components.PipedPins.slots;
                for (let k = 0; k < slots.length; ++k) {
                    slots[k].linkedNetwork = null;
                }
            }
        } else {
            logger.log("Recomputing pipes first time");
            this.isFirstRecompute = false;
        }

        VERBOSE_PIPES && logger.log("Recomputing slots");

        // Iterate over all ejector slots
        for (let i = 0; i < pinEntities.length; ++i) {
            const entity = pinEntities[i];
            // @ts-ignore
            const slots = entity.components.PipedPins.slots;
            for (let k = 0; k < slots.length; ++k) {
                const slot = slots[k];

                // Ejectors are computed directly, acceptors are just set
                if (slot.type === enumPinSlotType.logicalEjector && !slot.linkedNetwork) {
                    this.findNetworkForEjector(entity, slot);
                }
            }
        }

        // Update all sprites around pins
        for (let i = 0; i < pinEntities.length; ++i) {
            const entity = pinEntities[i];

            this.updateSurroundingPipePlacement(
                entity.components.StaticMapEntity.getTileSpaceBounds().expandedInAllDirections(1)
            );
        }

        for (let i = 0; i < this.oldNetworks.length; i++) {
            const oldNetwork = this.oldNetworks[i];
            const provider = oldNetwork.provider.entity.components.StaticMapEntity.origin;
            const currentNetwork = this.networks.find(x =>
                provider.equals(x.provider.entity.components.StaticMapEntity.origin)
            );

            if (currentNetwork) {
                currentNetwork.currentVolume = oldNetwork.currentVolume;
                currentNetwork.currentPressure = oldNetwork.currentPressure;
                currentNetwork.currentFluid = oldNetwork.currentFluid;
            }
        }
    }

    /**
     * Finds the network for the given slot
     * @param {import("shapez/savegame/savegame_typedefs").Entity} initialEntity
     * @param {import("../components/pipe_pins").PipePinSlot} slot
     */
    findNetworkForEjector(initialEntity, slot) {
        let currentNetwork = new PipeNetwork();
        VERBOSE_PIPES &&
            logger.log(
                "Finding network for entity",
                initialEntity.uid,
                initialEntity.components.StaticMapEntity.origin.toString(),
                "(nw-id:",
                currentNetwork.uid,
                ")"
            );
        const entitiesToVisit = [
            {
                entity: initialEntity,
                slot,
                distance: [],
            },
        ];

        /**
         * Once we occur a pipe, we store its variant so we don't connect to
         * mismatching ones
         * @type {string}
         */
        let variantMask = null;

        while (entitiesToVisit.length > 0) {
            const nextData = entitiesToVisit.shift();
            const nextEntity = nextData.entity;
            const distance = [...nextData.distance];

            // @ts-ignore
            const pipeComp = nextEntity.components.Pipe;
            const staticComp = nextEntity.components.StaticMapEntity;

            VERBOSE_PIPES && logger.log("Visiting", staticComp.origin.toString(), "(", nextEntity.uid, ")");

            // Where to search for neighbours
            let newSearchDirections = [];
            let newSearchTile = null;

            //// WIRE
            if (pipeComp) {
                // Sanity check
                assert(
                    !pipeComp.linkedNetwork || pipeComp.linkedNetwork === currentNetwork,
                    "Mismatching pipe network on pipe entity " +
                        (pipeComp.linkedNetwork ? pipeComp.linkedNetwork.uid : "<empty>") +
                        " vs " +
                        currentNetwork.uid +
                        " @ " +
                        staticComp.origin.toString()
                );

                if (!pipeComp.linkedNetwork) {
                    if (variantMask && pipeComp.variant !== variantMask) {
                        // Mismatching variant
                    } else {
                        // This one is new! :D
                        VERBOSE_PIPES && logger.log("  Visited new pipe:", staticComp.origin.toString());
                        pipeComp.linkedNetwork = currentNetwork;

                        distance.push(pipeComp.pressureFriction);
                        pipeComp.distance = distance;

                        currentNetwork.pipes.push(nextEntity);

                        newSearchDirections = arrayAllDirections;
                        newSearchTile = nextEntity.components.StaticMapEntity.origin;
                        variantMask = pipeComp.variant;
                    }
                }
            }

            //// PINS
            // @ts-ignore
            const pinsComp = nextEntity.components.PipedPins;
            if (pinsComp) {
                const slot = nextData.slot;
                assert(slot, "No slot set for next entity");

                if (slot.type === enumPinSlotType.logicalEjector) {
                    VERBOSE_PIPES &&
                        logger.log("  Visiting ejector slot", staticComp.origin.toString(), "->", slot.type);
                } else if (slot.type === enumPinSlotType.logicalAcceptor) {
                    VERBOSE_PIPES &&
                        logger.log("  Visiting acceptor slot", staticComp.origin.toString(), "->", slot.type);
                } else {
                    assertAlways(false, "Bad slot type: " + slot.type);
                }

                // Sanity check
                assert(
                    !slot.linkedNetwork || slot.linkedNetwork === currentNetwork,
                    "Mismatching pipe network on pin slot entity " +
                        (slot.linkedNetwork ? slot.linkedNetwork.uid : "<empty>") +
                        " vs " +
                        currentNetwork.uid
                );
                if (!slot.linkedNetwork) {
                    // This one is new
                    VERBOSE_PIPES && logger.log("  Visited new slot:", staticComp.origin.toString());

                    // Add to the right list
                    if (slot.type === enumPinSlotType.logicalEjector) {
                        // Only one logicalEjector
                        if (currentNetwork.provider !== null) {
                            continue;
                        }
                        currentNetwork.provider = { entity: nextEntity, slot };
                    } else if (slot.type === enumPinSlotType.logicalAcceptor) {
                        currentNetwork.receivers.push({ entity: nextEntity, slot });
                    } else {
                        assertAlways(false, "unknown slot type:" + slot.type);
                    }

                    // Register on the network
                    currentNetwork.allSlots.push({ entity: nextEntity, slot });
                    slot.linkedNetwork = currentNetwork;

                    // Specify where to search next
                    newSearchDirections = [staticComp.localDirectionToWorld(slot.direction)];
                    newSearchTile = staticComp.localTileToWorld(slot.pos);
                }
            }

            if (newSearchTile) {
                // Find new surrounding pipe targets
                const newTargets = this.findSurroundingPipeTargets(
                    newSearchTile,
                    newSearchDirections,
                    currentNetwork,
                    variantMask,
                    distance
                );

                VERBOSE_PIPES && logger.log("   Found", newTargets, "new targets to visit!");
                for (let i = 0; i < newTargets.length; ++i) {
                    entitiesToVisit.push(newTargets[i]);
                }
            }
        }

        if (
            currentNetwork.provider !== null &&
            (currentNetwork.pipes.length > 0 || currentNetwork.receivers.length > 0)
        ) {
            this.networks.push(currentNetwork);
            VERBOSE_PIPES && logger.log("Attached new network with uid", currentNetwork);
        } else {
            // Unregister network again
            for (let i = 0; i < currentNetwork.pipes.length; ++i) {
                // @ts-ignore
                currentNetwork.pipes[i].components.Pipe.linkedNetwork = null;
            }

            for (let i = 0; i < currentNetwork.allSlots.length; ++i) {
                currentNetwork.allSlots[i].slot.linkedNetwork = null;
            }
        }
    }

    /**
     * Finds surrounding entities which are not yet assigned to a network
     * @param {Vector} initialTile
     * @param {Array<enumDirection>} directions
     * @param {PipeNetwork} network
     * @param {string=} variantMask Only accept connections to this mask
     * @param {Array<number>=} distance
     * @returns {Array<any>}
     */
    findSurroundingPipeTargets(initialTile, directions, network, variantMask = null, distance = []) {
        let result = [];

        VERBOSE_PIPES &&
            logger.log(
                "    Searching for new targets at",
                initialTile.toString(),
                "and d=",
                directions,
                "with mask=",
                variantMask
            );

        // Go over all directions we should search for
        for (let i = 0; i < directions.length; ++i) {
            const direction = directions[i];
            const offset = enumDirectionToVector[direction];
            const initialSearchTile = initialTile.add(offset);

            // First, find the initial connected entities
            const initialContents = this.root.map.getLayersContentsMultipleXY(
                initialSearchTile.x,
                initialSearchTile.y
            );

            // Link the initial tile to the initial entities, since it may change
            /** @type {Array<{entity: import("shapez/savegame/savegame_typedefs").Entity, tile: Vector}>} */
            const contents = [];
            for (let j = 0; j < initialContents.length; ++j) {
                contents.push({
                    entity: initialContents[j],
                    tile: initialSearchTile,
                });
            }

            for (let k = 0; k < contents.length; ++k) {
                const { entity, tile } = contents[k];
                // @ts-ignore
                const pipeComp = entity.components.Pipe;

                // Check for pipe
                if (
                    pipeComp &&
                    !pipeComp.linkedNetwork &&
                    (!variantMask || pipeComp.variant === variantMask)
                ) {
                    // Pipes accept connections from everywhere
                    result.push({
                        entity,
                        distance,
                    });
                }

                // Check for connected slots
                // @ts-ignore
                const pinComp = entity.components.PipedPins;
                if (pinComp) {
                    const staticComp = entity.components.StaticMapEntity;

                    // Go over all slots and see if they are connected
                    const pinSlots = pinComp.slots;
                    for (let j = 0; j < pinSlots.length; ++j) {
                        const slot = pinSlots[j];

                        // Check if the position matches
                        const pinPos = staticComp.localTileToWorld(slot.pos);
                        if (!pinPos.equals(tile)) {
                            continue;
                        }

                        // Check if the direction (inverted) matches
                        const pinDirection = staticComp.localDirectionToWorld(slot.direction);
                        if (pinDirection !== enumInvertedDirections[direction]) {
                            continue;
                        }

                        if (!slot.linkedNetwork) {
                            result.push({
                                entity,
                                slot,
                                distance: [],
                            });
                        }
                    }

                    // Pin slots mean it can be nothing else
                    continue;
                }
            }
        }

        VERBOSE_PIPES && logger.log("     -> Found", result.length);

        return result;
    }

    /**
     * Updates the pipes network
     */
    update() {
        this.staleArea.update();

        if (this.needsRecompute) {
            this.recomputePipesNetwork();
        }

        // Re-compute values of all networks
        for (let i = 0; i < this.networks.length; ++i) {
            const network = this.networks[i];

            // Aggregate values of sender
            const sender = network.provider;
            let pressure = sender.slot.pressure;
            const fluid = sender.slot.fluid;

            // Remove pressure from network
            for (let j = 0; j < network.receivers.length; j++) {
                const receiverSlot = network.receivers[j];
                const slotPressure = receiverSlot.slot.pressure;
                receiverSlot.slot.fluid = fluid;

                // The first sender can just put in his value
                if (!pressure) {
                    pressure = -slotPressure;
                    continue;
                }

                // If the slot is empty itself, just skip it
                if (typeof slotPressure !== "number") {
                    continue;
                }

                pressure -= slotPressure;
            }

            // Assign value
            network.currentFluid = fluid;
            if (network.currentVolume <= 0) {
                network.currentPressure = 0;
            } else {
                network.currentPressure = pressure;
            }

            let maxVolume = network.pipes
                //@ts-ignore
                .map(x => x.components.Pipe.volume)
                .reduce((volume, currentVolume) => (volume += currentVolume), 0);

            if (network.currentVolume > maxVolume) {
                network.currentVolume = maxVolume;
            }
        }
    }

    /**
     * Draws a given chunk
     * @param {import("shapez/core/draw_utils").DrawParameters} parameters
     * @param {MapChunkView} chunk
     */
    drawChunk(parameters, chunk) {
        // @ts-ignore
        const contents = chunk.contents;
        for (let y = 0; y < globalConfig.mapChunkSize; ++y) {
            for (let x = 0; x < globalConfig.mapChunkSize; ++x) {
                const entity = contents[x][y];
                // @ts-ignore
                if (entity && entity.components.Pipe) {
                    // @ts-ignore
                    const pipeComp = entity.components.Pipe;
                    const staticComp = entity.components.StaticMapEntity;

                    // DEBUG Rendering
                    if (BUILD_OPTIONS.IS_DEV && renderPipesInfo) {
                        parameters.context.globalAlpha = 1;
                        parameters.context.fillStyle = "red";
                        parameters.context.font = "5px Tahoma";
                        // parameters.context.fillText(
                        //     "" + staticComp.originalRotation,
                        //     staticComp.origin.x * globalConfig.tileSize,
                        //     staticComp.origin.y * globalConfig.tileSize + 5
                        // );

                        parameters.context.fillStyle = "rgba(255, 0, 0, 0.2)";
                        if (staticComp.originalRotation % 180 === 0) {
                            parameters.context.fillRect(
                                (staticComp.origin.x + 0.5) * globalConfig.tileSize,
                                staticComp.origin.y * globalConfig.tileSize,
                                3,
                                globalConfig.tileSize
                            );
                        } else {
                            parameters.context.fillRect(
                                staticComp.origin.x * globalConfig.tileSize,
                                (staticComp.origin.y + 0.5) * globalConfig.tileSize,
                                globalConfig.tileSize,
                                3
                            );
                        }
                    }
                }

                // DEBUG Rendering
                if (BUILD_OPTIONS.IS_DEV && renderPipesInfo) {
                    if (entity) {
                        const staticComp = entity.components.StaticMapEntity;
                        // @ts-ignore
                        const pipeComp = entity.components.Pipe;

                        // Draw network info for pipes
                        if (pipeComp && pipeComp.linkedNetwork) {
                            parameters.context.fillStyle = "red";
                            parameters.context.font = "5px Tahoma";
                            // parameters.context.fillText(
                            //     "P" + pipeComp.linkedNetwork.uid,
                            //     (staticComp.origin.x + 0) * globalConfig.tileSize,
                            //     (staticComp.origin.y + 0.2) * globalConfig.tileSize
                            // );

                            // parameters.context.fillText(
                            //     "Pr:" + round1Digit(pipeComp.linkedNetwork.currentPressure),
                            //     (staticComp.origin.x + 0.5) * globalConfig.tileSize,
                            //     (staticComp.origin.y + 0.2) * globalConfig.tileSize
                            // );

                            parameters.context.fillText(
                                "LPr:" + round1Digit(pipeComp.localPressure),
                                (staticComp.origin.x + 0) * globalConfig.tileSize,
                                (staticComp.origin.y + 0.2) * globalConfig.tileSize
                            );

                            parameters.context.fillText(
                                "D:" + pipeComp.distance.length,
                                (staticComp.origin.x + 0) * globalConfig.tileSize,
                                (staticComp.origin.y + 0.8) * globalConfig.tileSize
                            );
                        }
                    }
                }
            }
        }

        parameters.context.globalAlpha = 1;
    }

    /**
     * Returns whether this entity is relevant for the pipes network
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     */
    isEntityRelevantForPipes(entity) {
        // @ts-ignore
        return entity.components.Pipe || entity.components.PipedPins;
    }

    /**
     *
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     */
    queuePlacementUpdate(entity) {
        if (!this.root.gameInitialized) {
            return;
        }

        if (!this.isEntityRelevantForPipes(entity)) {
            return;
        }

        const staticComp = entity.components.StaticMapEntity;
        if (!staticComp) {
            return;
        }

        // Invalidate affected area
        const originalRect = staticComp.getTileSpaceBounds();
        const affectedArea = originalRect.expandedInAllDirections(1);
        this.staleArea.invalidate(affectedArea);
    }

    /**
     * Updates the pipe placement after an entity has been added / deleted
     * @param {import("shapez/core/draw_parameters").Rectangle} affectedArea
     */
    updateSurroundingPipePlacement(affectedArea) {
        for (let x = affectedArea.x; x < affectedArea.right(); ++x) {
            for (let y = affectedArea.y; y < affectedArea.bottom(); ++y) {
                const targetEntities = this.root.map.getLayersContentsMultipleXY(x, y);
                for (let i = 0; i < targetEntities.length; ++i) {
                    const targetEntity = targetEntities[i];

                    // @ts-ignore
                    const targetPipeComp = targetEntity.components.Pipe;
                    const targetStaticComp = targetEntity.components.StaticMapEntity;

                    const metaPipe = gBuildingVariants[targetStaticComp.code].metaInstance;

                    if (!targetPipeComp) {
                        // Not a pipe
                        continue;
                    }

                    const variant = targetStaticComp.getVariant();

                    const { rotation, rotationVariant } =
                        metaPipe.computeOptimalDirectionAndRotationVariantAtTile({
                            root: this.root,
                            tile: new Vector(x, y),
                            rotation: targetStaticComp.originalRotation,
                            variant,
                            layer: targetEntity.layer,
                        });

                    // Compute delta to see if anything changed
                    const newType = arrayPipeRotationVariantToType[rotationVariant];

                    if (targetStaticComp.rotation !== rotation || newType !== targetPipeComp.type) {
                        // Change stuff
                        targetStaticComp.rotation = rotation;
                        metaPipe.updateVariants(targetEntity, rotationVariant, variant);

                        // Update code as well
                        targetStaticComp.code = getCodeFromBuildingData(metaPipe, variant, rotationVariant);

                        // Make sure the chunks know about the update
                        this.root.signals.entityChanged.dispatch(targetEntity);
                    }
                }
            }
        }
    }
}
