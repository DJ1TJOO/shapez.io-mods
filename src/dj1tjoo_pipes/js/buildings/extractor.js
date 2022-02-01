import { Vector, enumDirection } from "shapez/core/vector";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { ExtractorComponent } from "../components/extractor";
import { enumPinSlotType, PipedPinsComponent } from "../components/pipe_pins";

export class MetaExtractorBuilding extends ModMetaBuilding {
    constructor() {
        super("extractor");
    }

    getSilhouetteColor() {
        return "#b37dcd";
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
                name: "Extractor",
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
                        type: enumPinSlotType.logicalAcceptor,
                    },
                ],
            })
        );

        entity.addComponent(new ExtractorComponent({ pressure: 20 }));
    }
}
