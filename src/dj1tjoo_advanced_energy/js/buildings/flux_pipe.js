import { generateMatrixRotations } from "shapez/core/utils";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { EnergyConnectorComponent } from "../components/energy_connector";

const overlayMatrix = generateMatrixRotations([1, 1, 1, 1, 0, 1, 1, 1, 1]);

export class MetaFluxPipeBuilding extends ModMetaBuilding {
    constructor() {
        super("flux_pipe");
    }

    getSilhouetteColor() {
        return "#CFCBC9";
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Flux Pipe",
                description: "Stores 200f (flux)",
            },
        ];
    }

    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant) {
        return overlayMatrix[rotation];
    }

    /**
     * Creates the entity at the given location
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     */
    setupEntityComponents(entity) {
        entity.addComponent(
            new EnergyConnectorComponent({
                maxEnergyVolume: 200,
            })
        );
    }
}
