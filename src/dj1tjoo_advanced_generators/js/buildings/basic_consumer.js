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
import { AdvancedEnergy } from "@dj1tjoo/shapez-advanced-energy";
import { formatAePerTick } from "../ui/formatter";
import { T } from "shapez/translations";
import { amountPerCharge } from "../amountPerCharge";
import { config } from "../config";

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
                description: "",
            },
        ];
    }

    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant) {
        return overlayMatrix[rotation];
    }

    getAdditionalStatistics() {
        return /** @type {[[string, string]]}*/ ([
            [T.advanced_generators.consumes, formatAePerTick(config().basic_consumer.energy)],
        ]);
    }

    /**
     * Creates the entity at the given location
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     * @param {import("shapez/game/root").GameRoot} root
     */
    setupEntityComponents(entity, root) {
        entity.addComponent(
            new ItemProcessorComponent({
                inputsPerCharge: 0,
                processorType: enumItemProcessorTypes[processLabelBasicConsumer],
                processingRequirement: enumItemProcessorRequirements[processLabelBasicConsumer],
            })
        );

        entity.addComponent(new AdvancedEnergy.EnergyTickerComponent());

        const localConfig = config().basic_consumer;
        entity.addComponent(
            new AdvancedEnergy.EnergyPinComponent({
                slots: [
                    {
                        direction: enumDirection.left,
                        pos: new Vector(0, 0),
                        type: "acceptor",
                        consumptionPerTick: localConfig.energy,
                        maxBuffer: root
                            ? amountPerCharge(root, localConfig.energy, processLabelBasicConsumer) * 3
                            : localConfig.energy * 3,
                    },
                ],
            })
        );
    }
}

export function setupBasicConsumer() {
    enumItemProcessorTypes[processLabelBasicConsumer] = processLabelBasicConsumer;
    enumItemProcessorRequirements[processLabelBasicConsumer] = processLabelBasicConsumer;

    /**
     * @this {import("shapez/game/systems/item_processor").ItemProcessorSystem}
     */
    MODS_CAN_PROCESS[enumItemProcessorRequirements[processLabelBasicConsumer]] = function ({ entity }) {
        const localConfig = config().basic_consumer;

        /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent} */
        const pinComp = entity.components["EnergyPin"];
        if (
            !pinComp.slots[0].linkedNetwork ||
            pinComp.slots[0].buffer <
                amountPerCharge(this.root, localConfig.energy, processLabelBasicConsumer) -
                    entity.components["EnergyTicker"].getBuffer(0)
        ) {
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
     * @this {import("shapez/game/systems/item_processor").ItemProcessorSystem}
     */
    MOD_ITEM_PROCESSOR_HANDLERS[enumItemProcessorTypes[processLabelBasicConsumer]] = function ({
        items,
        entity,
    }) {
        const localConfig = config().basic_consumer;

        /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent} */
        const pinComp = entity.components["EnergyPin"];

        if (!pinComp.slots[0].linkedNetwork) return;

        entity.components["EnergyTicker"].addToBuffer(
            0,
            -amountPerCharge(this.root, localConfig.energy, processLabelBasicConsumer)
        );
    };

    /**
     * @param {import("shapez/core/draw_parameters").GameRoot} root
     */
    MOD_ITEM_PROCESSOR_SPEEDS[enumItemProcessorTypes[processLabelBasicConsumer]] = function (root) {
        // TODO: remove upgrade later
        return globalConfig.beltSpeedItemsPerSecond * (1 / 8);
    };
}
