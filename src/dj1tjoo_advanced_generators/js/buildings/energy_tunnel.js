import { AdvancedEnergy } from "@dj1tjoo/shapez-advanced-energy";
import { globalConfig } from "shapez/core/config";
import {
    enumAngleToDirection,
    enumDirection,
    enumDirectionToVector,
    enumInvertedDirections,
    Vector,
} from "shapez/core/vector";
import { enumUndergroundBeltVariantToTier } from "shapez/game/buildings/underground_belt";
import { enumUndergroundBeltMode } from "shapez/game/components/underground_belt";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { T } from "shapez/translations";
import { config } from "../config";
import { formatAe, formatAePerTick } from "../ui/formatter";

export class MetaEnergyTunnelBuilding extends ModMetaBuilding {
    constructor() {
        super("energy_tunnel");
    }

    getSilhouetteColor() {
        return "#04FC84";
    }

    getIsReplaceable() {
        return true;
    }

    getStayInPlacementMode() {
        return true;
    }

    getFlipOrientationAfterPlacement() {
        return true;
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Basic Energy Tunnel",
                description: "Connects buildings that produce and consume energy together",
            },
        ];
    }

    getAdditionalStatistics() {
        const localConfig = config().energy;

        return /** @type {[string, string][]}*/ ([
            [T.advanced_generators.throughput, formatAePerTick(localConfig.maxThroughputPerTick)],
            [T.advanced_generators.stores, formatAe(localConfig.volume)],
        ]);
    }

    /**
     * Creates the entity at the given location
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     */
    setupEntityComponents(entity) {
        const localConfig = config().energy;

        entity.addComponent(
            new AdvancedEnergy.EnergyTunnelComponent({
                slots: [
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.bottom,
                        tunnelDirection: enumDirection.top,
                        maxEnergyVolume: localConfig.volume,
                        maxThroughputPerTick: localConfig.maxThroughputPerTick,
                    },
                ],
            })
        );
    }

    /**
     * Should compute the optimal rotation variant on the given tile
     * @param {object} param0
     * @param {import("shapez/game/root").GameRoot} param0.root
     * @param {Vector} param0.tile
     * @param {number} param0.rotation
     * @param {string} param0.variant
     * @param {Layer} param0.layer
     * @return {{ rotation: number, rotationVariant: number, connectedEntities?: Array<import("shapez/game/entity").Entity> }}
     */
    computeOptimalDirectionAndRotationVariantAtTile({ root, tile, rotation, variant, layer }) {
        const searchDirection = enumAngleToDirection[rotation];
        const searchVector = enumDirectionToVector[searchDirection];

        for (let searchOffset = 1; searchOffset <= 6; ++searchOffset) {
            tile = tile.addScalars(searchVector.x, searchVector.y);

            const contents = root.map.getTileContent(tile, "regular");
            if (contents) {
                const staticComp = contents.components.StaticMapEntity;

                /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_tunnel").EnergyTunnelComponent} */
                const tunnelComp = contents.components["EnergyTunnel"];
                if (tunnelComp) {
                    // Go over all slots and see if they are connected
                    const tunnelSlots = tunnelComp.slots;
                    for (let j = 0; j < tunnelSlots.length; ++j) {
                        const tunnelSlot = tunnelSlots[j];

                        // Check if the position matches
                        const tunnelPos = staticComp.localTileToWorld(tunnelSlot.pos);
                        if (!tunnelPos.equals(tile)) {
                            continue;
                        }

                        // Check if the direction (inverted) matches
                        const pinDirection = staticComp.localDirectionToWorld(tunnelSlot.tunnelDirection);
                        if (pinDirection !== enumInvertedDirections[searchDirection]) {
                            continue;
                        }

                        if (tunnelSlot.type === "default") {
                            return {
                                rotation,
                                rotationVariant: 0,
                                connectedEntities: [contents],
                            };
                        }
                    }
                }
            }
        }

        return {
            rotation,
            rotationVariant: 0,
        };
    }
}
