import { Vector, enumDirection } from "shapez/core/vector";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { BaseFluid } from "../base_fluid";
import { enumPinSlotType, PipedPinsComponent } from "../components/pipe_pins";
import { PumpComponent } from "../components/pump";
import { WATER_SINGLETON } from "../fluids/water";

export class MetaPumpBuilding extends ModMetaBuilding {
    constructor() {
        super("pump");
    }

    getSilhouetteColor() {
        return "#000000"; //"#b37dcd";
    }

    isPlaceableToGround() {
        return false;
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

    /**
     * Creates the entity at the given location
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     */
    setupEntityComponents(entity) {
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

        // @ts-ignore
        let fluid = null;

        if (entity.root) {
            // @ts-ignore
            const layerFluid = /** @type {BaseFluid} */ (
                entity.root.map.getLowerLayerContentXY(
                    entity.components.StaticMapEntity.origin.x,
                    entity.components.StaticMapEntity.origin.y
                )
            );

            if (layerFluid && layerFluid.getItemType() === "fluid") {
                fluid = layerFluid;
            }
        }

        entity.addComponent(new PumpComponent({ pressure: 50, fluid: fluid }));
    }
}
