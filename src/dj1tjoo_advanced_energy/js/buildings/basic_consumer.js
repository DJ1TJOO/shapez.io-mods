import { generateMatrixRotations } from "shapez/core/utils";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { enumDirection, Vector } from "shapez/core/vector";
import {
    enumItemProcessorRequirements,
    enumItemProcessorTypes,
    ItemProcessorComponent,
} from "shapez/game/components/item_processor";
import { globalConfig } from "shapez/core/config";
import { MOD_ITEM_PROCESSOR_SPEEDS } from "shapez/game/hub_goals";
import {
    MODS_CAN_PROCESS,
    MODS_PROCESSING_REQUIREMENTS,
    MOD_ITEM_PROCESSOR_HANDLERS,
} from "shapez/game/systems/item_processor";
import { EnergyPinComponent } from "../components/energy_pin";

const overlayMatrix = generateMatrixRotations([1, 1, 1, 1, 0, 1, 1, 1, 1]);

const processLabelBasicConsumer = "dj1tjoo@basic_consumer";

export class MetaBasicConsumerBuilding extends ModMetaBuilding {
    constructor() {
        super("basic_consumer");
    }

    getSilhouetteColor() {
        return "#CFCBC9";
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Basic Consumer",
                description: "Uses 50f (flux)",
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
            new ItemProcessorComponent({
                inputsPerCharge: 0,
                processorType: enumItemProcessorTypes[processLabelBasicConsumer],
                processingRequirement: enumItemProcessorRequirements[processLabelBasicConsumer],
            })
        );

        entity.addComponent(
            new EnergyPinComponent({
                slots: [
                    {
                        direction: enumDirection.left,
                        pos: new Vector(0, 0),
                        type: "acceptor",
                        consumption: 50,
                    },
                ],
            })
        );
    }
}

export function setupBasicConsumer() {
    enumItemProcessorTypes[processLabelBasicConsumer] = processLabelBasicConsumer;
    enumItemProcessorRequirements[processLabelBasicConsumer] = processLabelBasicConsumer;

    const volumeRemoved = 50;

    MODS_CAN_PROCESS[enumItemProcessorRequirements[processLabelBasicConsumer]] = function ({ entity }) {
        /** @type {EnergyPinComponent} */
        const pinComp = entity.components["EnergyPin"];
        if (!pinComp.slots[0].linkedNetwork || !pinComp.slots[0].linkedNetwork.canRemove(volumeRemoved)) {
            return false;
        }

        return true;
    };

    MODS_PROCESSING_REQUIREMENTS[enumItemProcessorRequirements[processLabelBasicConsumer]] = function ({
        _,
        item,
    }) {
        return true;
    };

    /**
     * @this {ItemProcessorSystem}
     */
    MOD_ITEM_PROCESSOR_HANDLERS[enumItemProcessorTypes[processLabelBasicConsumer]] = function ({
        items,
        entity,
    }) {
        /** @type {EnergyPinComponent} */
        const pinComp = entity.components["EnergyPin"];

        if (!pinComp.slots[0].linkedNetwork) return;

        pinComp.slots[0].buffer -= volumeRemoved;
    };

    /**
     * @param {import("shapez/core/draw_parameters").GameRoot} root
     */
    MOD_ITEM_PROCESSOR_SPEEDS[enumItemProcessorTypes[processLabelBasicConsumer]] = function (root) {
        // TODO: remove upgrade later
        return globalConfig.beltSpeedItemsPerSecond * root.hubGoals.upgradeImprovements.processors * (1 / 8);
    };
}
