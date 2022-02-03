import { generateMatrixRotations } from "shapez/core/utils";
import { Vector, enumDirection } from "shapez/core/vector";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { BaseFluid } from "../base_fluid";
import { enumPinSlotType, PipedPinsComponent } from "../components/pipe_pins";
import { PumpComponent } from "../components/pump";
import { TankComponent } from "../components/tank";

const overlayMatrix = generateMatrixRotations([1, 0, 1, 0, 1, 0, 1, 0, 1]);

export class MetaTankBuilding extends ModMetaBuilding {
    constructor() {
        super("tank");
    }

    getSilhouetteColor() {
        return "#B2B4BB";
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Tank",
                description: "Store fluid and combine pressure",
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
            new PipedPinsComponent({
                slots: [
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalEjector,
                        volume: 50,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.left,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.bottom,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.right,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                ],
            })
        );

        entity.addComponent(new TankComponent({ maxVolume: 500 }));
    }
}
