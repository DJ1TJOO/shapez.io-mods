import { Vector, enumDirection } from "shapez/core/vector";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { FluidEjectorComponent } from "../components/fluid_ejector";
import { PumpComponent } from "../components/pump";

export class MetaPumpBuilding extends ModMetaBuilding {
    constructor() {
        super("pump");
    }

    getSilhouetteColor() {
        return "#000000"; //"#b37dcd";
    }

    isPlaceableToFluids() {
        return true;
    }

    isPlaceableToGround() {
        return false;
    }

    /**
     * @param {import("shapez/savegame/savegame_serializer").GameRoot} root
     * @param {string} variant
     * @returns {number}
     */
    getPumpSpeed(root, variant) {
        return 5; //globalConfig.pumpSpeedLPerSecond * HubGoals.upgradeImprovements.fluids;
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
        entity.addComponent(new PumpComponent());
        entity.addComponent(
            new FluidEjectorComponent({
                slots: [
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.right,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.bottom,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.left,
                    },
                ],
            })
        );
    }
}
