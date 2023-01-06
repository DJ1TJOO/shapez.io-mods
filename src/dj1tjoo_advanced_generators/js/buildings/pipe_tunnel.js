import { Pipes } from "@dj1tjoo/shapez-pipes";
import {
    enumAngleToDirection,
    enumDirection,
    enumDirectionToVector,
    enumInvertedDirections,
    Vector,
} from "shapez/core/vector";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { T } from "shapez/translations";
import { config } from "../config";
import { rewards } from "../reward";
import { formatAe, formatAePerTick } from "../ui/formatter";

export class MetaPipeTunnelBuilding extends ModMetaBuilding {
    constructor() {
        super("pipe_tunnel");
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

    /**
     * @param {import("shapez/game/root").GameRoot} root
     * @returns {boolean}
     */
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(rewards.advanced_energy_tunnels);
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Basic Pipe Tunnel",
                description: "Connects buildings that produce and consume pipe together",
            },
        ];
    }

    getAdditionalStatistics() {
        const localConfig = config().pipe;

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
        const localConfig = config().pipe;

        entity.addComponent(
            new Pipes.PipeTunnelComponent({
                slots: [
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.bottom,
                        tunnelDirection: enumDirection.top,
                        maxPipeVolume: localConfig.volume,
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

                /** @type {import("@dj1tjoo/shapez-pipes/lib/js/components/pipe_tunnel").PipeTunnelComponent} */
                const tunnelComp = contents.components["PipeTunnel"];
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
