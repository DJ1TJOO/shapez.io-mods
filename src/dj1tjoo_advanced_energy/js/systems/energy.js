import { globalConfig } from "shapez/core/config";
import { BUILD_OPTIONS } from "shapez/core/globals";
import { Rectangle } from "shapez/core/rectangle";
import { StaleAreaDetector } from "shapez/core/stale_area_detector";
import { round1Digit } from "shapez/core/utils";
import {
    arrayAllDirections,
    enumDirection,
    enumDirectionToVector,
    enumInvertedDirections,
    Vector,
} from "shapez/core/vector";
import { gBuildingVariants, getCodeFromBuildingData } from "shapez/game/building_codes";
import { GameSystem } from "shapez/game/game_system";
import { MapChunkView } from "shapez/game/map_chunk_view";
import { EnergyConnectorComponent } from "../components/energy_connector";
import { EnergyPinComponent, enumPinSlotType } from "../components/energy_pin";
import { balanceEnergyNetwork } from "../energy/energy_balancer";
import { EnergyNetwork } from "../energy/energy_network";

export class EnergySystem extends GameSystem {
    /**
     * @param {import("shapez/game/root").GameRoot} root
     */
    constructor(root) {
        super(root);

        this.root.signals.entityDestroyed.add(this.queuePlacementUpdate, this);
        this.root.signals.entityAdded.add(this.queuePlacementUpdate, this);

        this.root.signals.entityDestroyed.add(this.queueRecompute, this);
        this.root.signals.entityChanged.add(this.queueRecompute, this);
        this.root.signals.entityAdded.add(this.queueRecompute, this);

        this.needsRecompute = true;
        this.recomputeAreas = [];
        this.isFirstRecompute = true;

        this.staleArea = new StaleAreaDetector({
            root: this.root,
            name: "energy",
            recomputeMethod: this.updateSurroundingPlacement.bind(this),
        });

        /**
         * @type {Array<EnergyNetwork>}
         */
        this.networks = [];
    }

    recomputeEnergyNetwork() {
        this.needsRecompute = false;

        this.networks = [];

        const pinEntities = this.root.entityMgr.getAllWithComponent(EnergyPinComponent);
        const connectors = this.root.entityMgr.getAllWithComponent(EnergyConnectorComponent);
        const energyEntities = [...pinEntities, ...connectors];

        for (const entity of energyEntities) {
            if (entity.components["EnergyPin"]) {
                /** @type {EnergyPinComponent}*/
                const pinComp = entity.components["EnergyPin"];
                for (let i = 0; i < pinComp.slots.length; i++) {
                    const slot = pinComp.slots[i];
                    slot.oldNetwork = slot.linkedNetwork;
                    slot.linkedNetwork = null;
                }
            }

            if (entity.components["EnergyConnector"]) {
                /** @type {EnergyConnectorComponent}*/
                const energyComp = entity.components["EnergyConnector"];
                energyComp.oldNetwork = energyComp.linkedNetwork;
                energyComp.linkedNetwork = null;
            }
        }

        for (const connector of connectors) {
            /** @type {EnergyConnectorComponent}*/
            const energyComp = connector.components["EnergyConnector"];
            if (energyComp.linkedNetwork !== null) {
                continue;
            }

            // This is a grossly simplified version of WireNetwork.prototype.recomputeWiresNetwork()
            // https://github.com/tobspr-games/shapez.io/blob/master/src/js/game/systems/wire.js#L155

            const currentNetwork = new EnergyNetwork();
            this.networks.push(currentNetwork);

            /**
             * Once we occur a connector, we store its variant so we don't connect to
             * mismatching ones
             * @type {string}
             */
            let typeMask = null;

            /**
             * @type {{
             *  entity: import("shapez/game/entity").Entity,
             *  slot: import("../components/energy_pin").EnergyPinSlot | null
             * }[]}
             */
            const entitiesToProcess = [{ entity: connector, slot: null }];
            while (entitiesToProcess.length > 0) {
                const current = entitiesToProcess.shift();
                const currentEntity = current.entity;
                const currentSlot = current.slot;

                let newSearchDirections = [];
                let newSearchTile = null;

                if (currentEntity.components["EnergyPin"]) {
                    if (currentSlot.type === enumPinSlotType.ejector) {
                        currentNetwork.providers.push({ entity: currentEntity, slot: currentSlot });
                    } else if (currentSlot.type === enumPinSlotType.acceptor) {
                        currentNetwork.consumers.push({ entity: currentEntity, slot: currentSlot });
                    } else {
                        assertAlways(false, "unknown slot type:" + currentSlot.type);
                    }

                    // Register on the network
                    currentNetwork.allSlots.push({ entity: currentEntity, slot: currentSlot });
                    currentSlot.linkedNetwork = currentNetwork;

                    // Specify where to search next
                    newSearchDirections = [
                        currentEntity.components.StaticMapEntity.localDirectionToWorld(currentSlot.direction),
                    ];
                    newSearchTile = currentEntity.components.StaticMapEntity.localTileToWorld(
                        currentSlot.pos
                    );

                    delete currentSlot.oldNetwork;
                }

                if (currentEntity.components["EnergyConnector"]) {
                    /** @type {EnergyConnectorComponent}*/
                    const energyComp = currentEntity.components["EnergyConnector"];

                    if (!typeMask || energyComp.type === typeMask) {
                        currentNetwork.connectors.push(currentEntity);

                        if (energyComp.oldNetwork) {
                            const oldNetworkCharge =
                                energyComp.oldNetwork.currentVolume / energyComp.oldNetwork.maxVolume;
                            const localCharge = energyComp.maxEnergyVolume * oldNetworkCharge;

                            currentNetwork.currentVolume += localCharge;
                            delete energyComp.oldNetwork;
                        }

                        energyComp.linkedNetwork = currentNetwork;

                        if (energyComp.direction) {
                            newSearchDirections = [
                                currentEntity.components.StaticMapEntity.localDirectionToWorld(
                                    energyComp.direction.from
                                ),
                                currentEntity.components.StaticMapEntity.localDirectionToWorld(
                                    energyComp.direction.to
                                ),
                            ];
                        } else {
                            newSearchDirections = arrayAllDirections;
                        }
                        typeMask = energyComp.type;
                    }
                }

                entitiesToProcess.push(
                    ...this.findSurroundingTargets(
                        currentEntity.components.StaticMapEntity.getTileSpaceBounds(),
                        newSearchTile,
                        newSearchDirections,
                        typeMask
                    )
                );
            }
        }

        // Update all sprites around pins
        for (let i = 0; i < pinEntities.length; ++i) {
            const entity = pinEntities[i];

            this.updateSurroundingPlacement(
                entity.components.StaticMapEntity.getTileSpaceBounds().expandedInAllDirections(1)
            );
        }

        if (this.recomputeAreas.length > 0) {
            for (let i = 0; i < this.recomputeAreas.length; i++) {
                this.updateSurroundingPlacement(this.recomputeAreas[i]);
            }
            this.recomputeArea = [];
        }
    }

    update() {
        this.staleArea.update();

        if (this.needsRecompute) {
            this.recomputeEnergyNetwork();
        }

        for (const network of this.networks) {
            balanceEnergyNetwork(network);
        }
    }

    /**
     * Draws a given chunk
     * @param {import("shapez/core/draw_utils").DrawParameters} parameters
     * @param {MapChunkView} chunk
     */
    drawChunk(parameters, chunk) {
        if (BUILD_OPTIONS.IS_DEV) {
            const contents = chunk.contents;
            for (let y = 0; y < globalConfig.mapChunkSize; ++y) {
                for (let x = 0; x < globalConfig.mapChunkSize; ++x) {
                    const entity = contents[x][y];
                    // DEBUG Rendering
                    if (entity) {
                        const staticComp = entity.components.StaticMapEntity;
                        /** @type {EnergyConnectorComponent} */
                        const connectorComp = entity.components["EnergyConnector"];
                        // Draw network info for pipes
                        if (connectorComp && connectorComp.linkedNetwork) {
                            parameters.context.fillStyle = "red";
                            parameters.context.font = "5px Tahoma";
                            parameters.context.fillText(
                                "MV" + connectorComp.linkedNetwork.maxVolume,
                                (staticComp.origin.x + 0.5) * globalConfig.tileSize,
                                (staticComp.origin.y + 0.8) * globalConfig.tileSize
                            );
                            parameters.context.fillText(
                                "TV:" + round1Digit(connectorComp.linkedNetwork.currentVolume),
                                (staticComp.origin.x + 0.5) * globalConfig.tileSize,
                                (staticComp.origin.y + 0.2) * globalConfig.tileSize
                            );
                            parameters.context.fillText(
                                "V:" + round1Digit(connectorComp.energyVolume),
                                (staticComp.origin.x + 0) * globalConfig.tileSize,
                                (staticComp.origin.y + 0.2) * globalConfig.tileSize
                            );
                            parameters.context.fillText(
                                "MV:" + connectorComp.maxEnergyVolume,
                                (staticComp.origin.x + 0) * globalConfig.tileSize,
                                (staticComp.origin.y + 0.8) * globalConfig.tileSize
                            );
                            // parameters.context.fillText(
                            //     "v:" + round1Digit(connectorComp.volume),
                            //     (staticComp.origin.x + 0.5) * globalConfig.tileSize,
                            //     (staticComp.origin.y + 0.8) * globalConfig.tileSize
                            // );
                        }
                    }
                }
            }
            parameters.context.globalAlpha = 1;
        }
    }

    /**
     * Invalidates the energy network if the given entity is relevant for it
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     */
    queueRecompute(entity) {
        if (!this.root.gameInitialized) return;
        if (!this.isEntityRelevantForEnergy(entity)) return;

        this.needsRecompute = true;
        this.recomputeAreas.push(
            entity.components.StaticMapEntity.getTileSpaceBounds().expandedInAllDirections(1)
        );
        this.networks = [];
    }

    /**
     * Check validation of area with new placement
     * @param {import("shapez/game/entity").Entity} entity
     */
    queuePlacementUpdate(entity) {
        if (!this.root.gameInitialized) {
            return;
        }

        if (!this.isEntityRelevantForEnergy(entity)) {
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
     * Returns whether this entity is relevant for the energy network
     * @param {import("shapez/game/entity").Entity} entity
     * @returns {boolean} valid
     */
    isEntityRelevantForEnergy(entity) {
        return entity.components["EnergyConnector"] || entity.components["EnergyPin"];
    }

    /**
     * Updates the pipe placement after an entity has been added / deleted
     * @param {import("shapez/core/draw_parameters").Rectangle} affectedArea
     */
    updateSurroundingPlacement(affectedArea) {
        for (let x = affectedArea.x; x < affectedArea.right(); ++x) {
            for (let y = affectedArea.y; y < affectedArea.bottom(); ++y) {
                const targetEntities = this.root.map.getLayersContentsMultipleXY(x, y);
                for (let i = 0; i < targetEntities.length; ++i) {
                    const targetEntity = targetEntities[i];

                    const targetConnectorComp = targetEntity.components["EnergyConnector"];
                    const targetStaticComp = targetEntity.components.StaticMapEntity;

                    const metaConnector = gBuildingVariants[targetStaticComp.code].metaInstance;

                    if (!targetConnectorComp) {
                        // Not a connector
                        continue;
                    }

                    const variant = targetStaticComp.getVariant();

                    const { rotation, rotationVariant } =
                        metaConnector.computeOptimalDirectionAndRotationVariantAtTile({
                            root: this.root,
                            tile: new Vector(x, y),
                            rotation: targetStaticComp.originalRotation,
                            variant,
                            layer: targetEntity.layer,
                        });

                    if (targetStaticComp.rotation !== rotation) {
                        // Change stuff
                        targetStaticComp.rotation = rotation;
                        metaConnector.updateVariants(targetEntity, rotationVariant, variant);

                        // Update code as well
                        targetStaticComp.code = getCodeFromBuildingData(
                            metaConnector,
                            variant,
                            rotationVariant
                        );

                        // Make sure the chunks know about the update
                        this.root.signals.entityChanged.dispatch(targetEntity);
                    }
                }
            }
        }
    }

    /**
     * Finds surrounding entities which are not yet assigned to a network
     * @param {Rectangle} tileSpaceBounds
     * @param {Vector} initialTile
     * @param {Array<enumDirection>} directions
     * @param {string} typeMask
     * @returns {Array<{
     *  entity: import("shapez/game/entity").Entity,
     *  slot: import("../components/energy_pin").EnergyPinSlot
     * }>}
     */
    findSurroundingTargets(tileSpaceBounds, initialTile, directions, typeMask) {
        let result = [];

        const allOffsets = [];

        if (!initialTile) {
            for (let x = 0; x < tileSpaceBounds.w; ++x) {
                allOffsets.push({
                    initialSearchTile: new Vector(x + tileSpaceBounds.x, -1 + tileSpaceBounds.y),
                    direction: enumDirection.top,
                });
                allOffsets.push({
                    initialSearchTile: new Vector(
                        x + tileSpaceBounds.x,
                        tileSpaceBounds.h + tileSpaceBounds.y
                    ),
                    direction: enumDirection.bottom,
                });
            }
            for (let y = 0; y < tileSpaceBounds.h; ++y) {
                allOffsets.push({
                    initialSearchTile: new Vector(-1 + tileSpaceBounds.x, y + tileSpaceBounds.y),
                    direction: enumDirection.left,
                });
                allOffsets.push({
                    initialSearchTile: new Vector(
                        tileSpaceBounds.w + tileSpaceBounds.x,
                        y + tileSpaceBounds.y
                    ),
                    direction: enumDirection.right,
                });
            }
        } else {
            for (let i = 0; i < directions.length; i++) {
                const direction = directions[i];
                const offset = enumDirectionToVector[direction];
                const initialSearchTile = initialTile.add(offset);
                allOffsets.push({ direction: directions[i], initialSearchTile });
            }
        }

        const offsets = allOffsets.filter(x => directions.includes(x.direction));

        // Go over all directions we should search for
        for (let i = 0; i < offsets.length; ++i) {
            const { direction, initialSearchTile } = offsets[i];

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

                const staticComp = entity.components.StaticMapEntity;

                /** @type {EnergyConnectorComponent} */
                const connectorComp = entity.components["EnergyConnector"];

                if (connectorComp) {
                    let validDirection = true;
                    if (connectorComp.direction) {
                        const connectorDirections = [
                            connectorComp.direction.from,
                            connectorComp.direction.to,
                        ].map(x => staticComp.localDirectionToWorld(x));
                        console.log(enumInvertedDirections[direction], connectorDirections);

                        if (!connectorDirections.includes(enumInvertedDirections[direction])) {
                            validDirection = false;
                        }
                    }

                    if (
                        !connectorComp.linkedNetwork &&
                        (!typeMask || connectorComp.type === typeMask) &&
                        validDirection
                    ) {
                        result.push({
                            entity,
                            slot: null,
                        });
                    }
                }

                // Check for connected slots
                /** @type {EnergyPinComponent} */
                const pinComp = entity.components["EnergyPin"];
                if (pinComp) {
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
                            });
                        }
                    }

                    // Pin slots mean it can be nothing else
                    continue;
                }
            }
        }

        return result;
    }
}
