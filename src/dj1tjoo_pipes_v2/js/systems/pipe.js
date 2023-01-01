import { globalConfig } from "shapez/core/config";
import { BUILD_OPTIONS } from "shapez/core/globals";
import { StaleAreaDetector } from "shapez/core/stale_area_detector";
import { round1Digit } from "shapez/core/utils";
import { Vector } from "shapez/core/vector";
import { gBuildingVariants, getCodeFromBuildingData } from "shapez/game/building_codes";
import { GameSystem } from "shapez/game/game_system";
import { MapChunkView } from "shapez/game/map_chunk_view";
import { MODS } from "shapez/mods/modloader";
import { PipeConnectorComponent } from "../components/pipe_connector";
import { PipePinComponent } from "../components/pipe_pin";
import { computePipeNetworks } from "../pipe/compute/pipe_network_compute";
import { balancePipeNetwork } from "../pipe/pipe_balancer";
import { PipeNetwork } from "../pipe/pipe_network";

export class PipeSystem extends GameSystem {
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
            name: "pipe",
            recomputeMethod: this.updateSurroundingPlacement.bind(this),
        });

        /**
         * @type {Array<PipeNetwork>}
         */
        this.networks = [];
    }

    recomputePipeNetwork() {
        this.needsRecompute = false;

        // Recompute networks
        const pinEntities = this.root.entityMgr.getAllWithComponent(PipePinComponent);
        const connectors = this.root.entityMgr.getAllWithComponent(PipeConnectorComponent);
        this.networks = computePipeNetworks(this.root, pinEntities, connectors);

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
            this.recomputePipeNetwork();
        }

        for (const network of this.networks) {
            balancePipeNetwork(network);
        }
    }

    /**
     * Draws a given chunk
     * @param {import("shapez/core/draw_utils").DrawParameters} parameters
     * @param {MapChunkView} chunk
     */
    drawChunk(parameters, chunk) {
        if (BUILD_OPTIONS.IS_DEV && MODS.mods.find(x => x.metadata.id === "dj1tjoo_pipes")["debug"]) {
            const contents = chunk.contents;
            for (let y = 0; y < globalConfig.mapChunkSize; ++y) {
                for (let x = 0; x < globalConfig.mapChunkSize; ++x) {
                    const entity = contents[x][y];
                    // DEBUG Rendering
                    if (entity) {
                        const staticComp = entity.components.StaticMapEntity;
                        /** @type {PipeConnectorComponent} */
                        const connectorComp = entity.components["PipeConnector"];
                        /** @type {PipePinComponent} */
                        const pinComp = entity.components["PipePin"];
                        // Draw network info for connectors
                        if (connectorComp && connectorComp.linkedNetwork) {
                            parameters.context.fillStyle = "red";
                            parameters.context.font = "5px Tahoma";
                            parameters.context.fillText(
                                "V:" + round1Digit(connectorComp.pipeVolume),
                                (staticComp.origin.x + 0) * globalConfig.tileSize,
                                (staticComp.origin.y + 0.2) * globalConfig.tileSize
                            );
                            parameters.context.fillText(
                                "NV:" + round1Digit(connectorComp.linkedNetwork.currentVolume),
                                (staticComp.origin.x + 0) * globalConfig.tileSize,
                                (staticComp.origin.y + 0.4) * globalConfig.tileSize
                            );
                            parameters.context.fillText(
                                "MV:" + connectorComp.maxPipeVolume,
                                (staticComp.origin.x + 0) * globalConfig.tileSize,
                                (staticComp.origin.y + 0.6) * globalConfig.tileSize
                            );
                            parameters.context.fillText(
                                "NMV" + connectorComp.linkedNetwork.maxVolume,
                                (staticComp.origin.x + 0) * globalConfig.tileSize,
                                (staticComp.origin.y + 0.8) * globalConfig.tileSize
                            );
                        }
                        // Draw network info for pins
                        if (pinComp) {
                            const connectedSlots = pinComp.slots.filter(x => x.linkedNetwork);
                            parameters.context.fillStyle = "red";
                            parameters.context.font = "5px Tahoma";

                            for (let i = 0; i < connectedSlots.length; i++) {
                                const slot = connectedSlots[i];

                                parameters.context.fillText(
                                    "V:" + round1Digit(slot.buffer),
                                    (staticComp.origin.x + slot.pos.x + 0) * globalConfig.tileSize,
                                    (staticComp.origin.y + slot.pos.y + 0.2) * globalConfig.tileSize
                                );
                                parameters.context.fillText(
                                    "MV:" + round1Digit(slot.maxBuffer),
                                    (staticComp.origin.x + slot.pos.x + 0) * globalConfig.tileSize,
                                    (staticComp.origin.y + slot.pos.y + 0.4) * globalConfig.tileSize
                                );
                                parameters.context.fillText(
                                    "MC:" + slot.maxConsumption,
                                    (staticComp.origin.x + slot.pos.x + 0) * globalConfig.tileSize,
                                    (staticComp.origin.y + slot.pos.y + 0.6) * globalConfig.tileSize
                                );
                                parameters.context.fillText(
                                    "MP" + slot.maxProduction,
                                    (staticComp.origin.x + slot.pos.x + 0) * globalConfig.tileSize,
                                    (staticComp.origin.y + slot.pos.y + 0.8) * globalConfig.tileSize
                                );
                            }
                        }
                    }
                }
            }
            parameters.context.globalAlpha = 1;
        }
    }

    /**
     * Invalidates the pipe network if the given entity is relevant for it
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     */
    queueRecompute(entity) {
        if (!this.root.gameInitialized) return;
        if (!this.isEntityRelevantForPipe(entity)) return;

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

        if (!this.isEntityRelevantForPipe(entity)) {
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
     * Returns whether this entity is relevant for the pipe network
     * @param {import("shapez/game/entity").Entity} entity
     * @returns {boolean} valid
     */
    isEntityRelevantForPipe(entity) {
        return entity.components["PipeConnector"] || entity.components["PipePin"];
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

                    const targetConnectorComp = targetEntity.components["PipeConnector"];
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

                    if (
                        targetStaticComp.rotation !== rotation ||
                        targetStaticComp.getRotationVariant() !== rotationVariant
                    ) {
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
}
