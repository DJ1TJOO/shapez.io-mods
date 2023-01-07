import { globalConfig } from "shapez/core/config";
import { Loader } from "shapez/core/loader";
import { StaleAreaDetector } from "shapez/core/stale_area_detector";
import { Vector } from "shapez/core/vector";
import { gBuildingVariants, getCodeFromBuildingData } from "shapez/game/building_codes";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { turbineComponents } from "../buildings/turbine";
import { TurbineComponent } from "../components/turbine";
import { computeTurbineNetworks } from "../turbine/compute/turbine_network_compute";
import { TurbineNetwork } from "../turbine/turbine_network";

export class TurbineSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [TurbineComponent]);

        this.sprites = [defaultBuildingVariant, ...Object.values(turbineComponents)]
            .map(x => ({ x, sprite: Loader.getSprite("sprites/turbine/" + x + ".png") }))
            .reduce((sprites, { x, sprite }) => ({ ...sprites, [x]: sprite }), {});

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
            name: "turbine",
            recomputeMethod: this.updateSurroundingPlacement.bind(this),
        });

        /**
         * @type {Array<TurbineNetwork>}
         */
        this.networks = [];
    }

    recomputeNetworks() {
        this.needsRecompute = false;

        // Recompute networks
        this.networks = computeTurbineNetworks(this.root, this.allEntities);

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
            this.recomputeNetworks();
        }

        for (const network of this.networks) {
            network.process(this.root);
        }
    }

    /**
     * Draws a given chunk
     * @param {import("shapez/core/draw_utils").DrawParameters} parameters
     * @param {import("shapez/game/map_chunk_view").MapChunkView} chunk
     */
    drawChunk(parameters, chunk) {
        const contents = chunk.containedEntitiesByLayer.regular;

        for (let i = 0; i < contents.length; ++i) {
            const entity = contents[i];

            /** @type {TurbineComponent} */
            const turbineComp = entity.components["Turbine"];
            if (!turbineComp) continue;

            const staticComp = entity.components.StaticMapEntity;
            const sprite = this.sprites[staticComp.getVariant()];
            if (!sprite) continue;

            sprite.drawCached(
                parameters,
                staticComp.origin.x * globalConfig.tileSize,
                staticComp.origin.y * globalConfig.tileSize,
                globalConfig.tileSize,
                globalConfig.tileSize
            );
        }
    }

    /**
     * Invalidates the turbine network if the given entity is relevant for it
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     */
    queueRecompute(entity) {
        if (!this.root.gameInitialized) return;
        if (!this.isEntityRelevantForTurbine(entity)) return;

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

        if (!this.isEntityRelevantForTurbine(entity)) {
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
     * Returns whether this entity is relevant for the turbine network
     * @param {import("shapez/game/entity").Entity} entity
     * @returns {boolean} valid
     */
    isEntityRelevantForTurbine(entity) {
        return entity.components["Turbine"];
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

                    const targetTurbineComp = targetEntity.components["Turbine"];
                    const targetStaticComp = targetEntity.components.StaticMapEntity;

                    const metaConnector = gBuildingVariants[targetStaticComp.code].metaInstance;

                    if (!targetTurbineComp) {
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
