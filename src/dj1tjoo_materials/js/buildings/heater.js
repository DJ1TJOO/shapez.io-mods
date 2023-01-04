import { Pipes } from "@dj1tjoo/shapez-pipes";
import { globalConfig } from "shapez/core/config";
import { formatItemsPerSecond } from "shapez/core/utils";
import { Vector, enumDirection } from "shapez/core/vector";
import { ItemAcceptorComponent } from "shapez/game/components/item_acceptor";
import {
    enumItemProcessorRequirements,
    enumItemProcessorTypes,
    ItemProcessorComponent,
} from "shapez/game/components/item_processor";
import { MOD_ITEM_PROCESSOR_SPEEDS } from "shapez/game/hub_goals";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import {
    MODS_CAN_PROCESS,
    MODS_PROCESSING_REQUIREMENTS,
    MOD_ITEM_PROCESSOR_HANDLERS,
} from "shapez/game/systems/item_processor";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { T } from "shapez/translations";
import { amountPerCharge } from "../amountPerCharge";
import { config, materialsEnum } from "../config";
import { createId } from "../createId";
import { StoneMagma, BasaltMagma } from "../../../shared/fluids/magma";
import { MaterialItem } from "../fluids/items/materials";

const processLabelHeater = createId("heater");

export class MetaHeaterBuilding extends ModMetaBuilding {
    constructor() {
        super(createId("heater"));
    }

    static getAllVariantCombinations() {
        return [
            {
                name: "Heater",
                description: "Makes fluids from stones",
                variant: defaultBuildingVariant,
            },
        ];
    }

    getSilhouetteColor() {
        return "#f04900";
    }

    getAdditionalStatistics(root) {
        const speed = root.hubGoals.getProcessorBaseSpeed(enumItemProcessorTypes[processLabelHeater]);
        return /** @type {[string, string][]}*/ ([
            [T.ingame.buildingPlacement.infoTexts.speed, formatItemsPerSecond(speed)],
            [T.ingame.buildingPlacement.infoTexts.speed, formatItemsPerSecond(config().heater.magma)],
        ]);
    }

    getIsUnlocked(root) {
        return true;
    }

    getDimensions() {
        return new Vector(1, 2);
    }

    setupEntityComponents(entity, root) {
        entity.addComponent(
            new ItemAcceptorComponent({
                slots: [
                    {
                        pos: new Vector(0, 1),
                        direction: enumDirection.bottom,
                        filter: "material",
                    },
                ],
            })
        );

        entity.addComponent(
            new ItemProcessorComponent({
                inputsPerCharge: 1,
                processorType: enumItemProcessorTypes[processLabelHeater],
                processingRequirement: enumItemProcessorRequirements[processLabelHeater],
            })
        );

        const localConfig = config().heater;
        entity.addComponent(
            new Pipes.PipePinComponent({
                slots: [
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                        type: "ejector",
                        fluid: StoneMagma.SINGLETON,
                        productionPerTick: localConfig.magma,
                        maxBuffer: root
                            ? amountPerCharge(root, localConfig.magma, processLabelHeater) * 3
                            : localConfig.magma * 3,
                    },
                ],
            })
        );
    }
}

/**
 * @this { import("../main").ModImpl }
 */
export function setupHeater() {
    enumItemProcessorTypes[processLabelHeater] = "heater";
    enumItemProcessorRequirements[processLabelHeater] = "heater";

    const heaterRecipes = [
        {
            item: materialsEnum().stone,
            fluid: StoneMagma,
        },
        {
            item: materialsEnum().basalt,
            fluid: BasaltMagma,
        },
    ];

    /**
     * @this {import("shapez/game/systems/item_processor").ItemProcessorSystem}
     * @param {{entity: import("shapez/game/entity").Entity}} param0
     * @returns
     */
    MODS_CAN_PROCESS[enumItemProcessorRequirements[processLabelHeater]] = function ({ entity }) {
        /** @type {import("@dj1tjoo/shapez-pipes/lib/js/components/pipe_pin").PipePinComponent} */
        const pipePinComp = entity.components["PipePin"];

        if (
            !pipePinComp.slots[0].linkedNetwork ||
            pipePinComp.slots[0].buffer +
                amountPerCharge(this.root, config().heater.magma, processLabelHeater) >
                pipePinComp.slots[0].maxBuffer
        ) {
            return false;
        }

        const processorComp = entity.components.ItemProcessor;
        return processorComp.inputCount >= processorComp.inputsPerCharge;
    };

    /** @param {{item:MaterialItem}} param0 */
    MODS_PROCESSING_REQUIREMENTS[enumItemProcessorRequirements[processLabelHeater]] = function ({ item }) {
        const recipe = heaterRecipes.find(x => x.item === item.type);
        return !!recipe;
    };
    /**
     * @this {import("shapez/game/systems/item_processor").ItemProcessorSystem}
     */
    MOD_ITEM_PROCESSOR_HANDLERS[enumItemProcessorTypes[processLabelHeater]] = function ({ items, entity }) {
        /** @type {import("@dj1tjoo/shapez-pipes/lib/js/components/pipe_pin").PipePinComponent} */
        const pipePinComp = entity.components["PipePin"];

        /** @type {MaterialItem} */
        const item = items.get(0);

        const recipe = heaterRecipes.find(x => x.item === item.type);

        if (
            !pipePinComp.slots[0].linkedNetwork.currentFluid ||
            !pipePinComp.slots[0].linkedNetwork.currentFluid.equals(recipe.fluid.SINGLETON)
        ) {
            pipePinComp.slots[0].fluid = recipe.fluid.SINGLETON;
            this.root.signals.entityChanged.dispatch(entity);
        }

        entity.components["PipePin"].slots[0].buffer += amountPerCharge(
            this.root,
            config().heater.magma,
            processLabelHeater
        );
    };

    /**
     * @param {GameRoot} root
     */
    MOD_ITEM_PROCESSOR_SPEEDS[enumItemProcessorTypes[processLabelHeater]] = function (root) {
        return globalConfig.beltSpeedItemsPerSecond * root.hubGoals.upgradeImprovements.processors * (1 / 8);
    };
}
