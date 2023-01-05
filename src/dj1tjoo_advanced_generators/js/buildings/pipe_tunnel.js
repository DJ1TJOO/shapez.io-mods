import { Pipes } from "@dj1tjoo/shapez-pipes";
import { enumDirection, Vector } from "shapez/core/vector";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { T } from "shapez/translations";
import { config } from "../config";
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
}
