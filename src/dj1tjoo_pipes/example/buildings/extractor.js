import { Vector, enumDirection } from "shapez/core/vector";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { ExtractorComponent } from "../components/extractor";

export class MetaExtractorBuilding extends ModMetaBuilding {
    constructor() {
        super("extractor");
    }

    getSilhouetteColor() {
        return "#b37dcd";
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
                        type: enumPinSlotType.logicalAcceptor,
                    },
                ],
            })
        );

        entity.addComponent(new ExtractorComponent({ pressure: 20 }));
    }
}
