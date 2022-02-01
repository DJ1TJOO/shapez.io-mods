import { Vector, enumDirection } from "shapez/core/vector";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { enumPinSlotType, PipedPinsComponent } from "../components/pipe_pins";
import { PumpComponent } from "../components/pump";
import { OIL_SINGLETONS } from "../fluids/oil";
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

        const fluids = [WATER_SINGLETON, ...Object.values(OIL_SINGLETONS), null];
        const fluid = fluids[Math.floor(Math.random() * fluids.length)];

        entity.addComponent(new PumpComponent({ pressure: 50, fluid: fluid }));
    }
}
