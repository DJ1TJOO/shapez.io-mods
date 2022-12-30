import { generateMatrixRotations } from "shapez/core/utils";
import { Vector } from "shapez/core/vector";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { EnergyConnectorComponent } from "../components/energy_connector";

const overlayMatrix = generateMatrixRotations([1, 1, 1, 1, 0, 1, 1, 1, 1]);

export class MetaFluxStorageBuilding extends ModMetaBuilding {
    constructor() {
        super("flux_storage");
    }

    getSilhouetteColor() {
        return "#CFCBC9";
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Flux Storage",
                description: "Stores 500f (flux)",
            },
        ];
    }

    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant) {
        return overlayMatrix[rotation];
    }

    getDimensions() {
        return new Vector(2, 2);
    }

    /**
     * Creates the entity at the given location
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     */
    setupEntityComponents(entity) {
        entity.addComponent(
            new EnergyConnectorComponent({
                maxEnergyVolume: 500,
            })
        );
    }
}
