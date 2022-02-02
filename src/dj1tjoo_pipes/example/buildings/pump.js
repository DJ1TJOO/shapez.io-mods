import { generateMatrixRotations } from "shapez/core/utils";
import { Vector, enumDirection } from "shapez/core/vector";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { PumpComponent } from "../components/pump";

const overlayMatrix = generateMatrixRotations([1, 0, 1, 0, 1, 0, 1, 0, 1]);

export class MetaPumpBuilding extends ModMetaBuilding {
    constructor() {
        super("pump");
    }

    getSilhouetteColor() {
        return "#B2B4BB";
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Pump",
                description: "",
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
        // @ts-ignore
        const { enumPinSlotType, PipedPinsComponent } = MODS.mods.find(
            x => x.metadata.id === "dj1tjoo_pipes"
        );

        entity.addComponent(
            new PipedPinsComponent({
                slots: [
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalEjector,
                    },
                ],
            })
        );

        let fluid = null;

        if (entity.root) {
            const layerFluid = entity.root.map.getLowerLayerContentXY(
                entity.components.StaticMapEntity.origin.x,
                entity.components.StaticMapEntity.origin.y
            );

            if (layerFluid && layerFluid.getItemType() === "fluid") {
                fluid = layerFluid;
            }
        }

        entity.addComponent(new PumpComponent({ pressure: 100, fluid: fluid }));
    }
}
