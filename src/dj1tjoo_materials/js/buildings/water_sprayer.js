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
import { Water } from "../../../shared/fluids/water";
import { MaterialItem } from "../items/materials";
import { AdvancedEnergy } from "@dj1tjoo/shapez-advanced-energy";
import { getComponentShared } from "../../../shared/getShared";
import { ItemEjectorComponent } from "shapez/game/components/item_ejector";

const processLabelWaterSprayer = createId("water_sprayer");

export class MetaWaterSprayerBuilding extends ModMetaBuilding {
    constructor() {
        super(processLabelWaterSprayer);
    }

    static getAllVariantCombinations() {
        return [
            {
                name: "Water Sprayer",
                description: "Cleans materials with sand",
                variant: defaultBuildingVariant,
            },
        ];
    }

    getSilhouetteColor() {
        return "#f04900";
    }

    getAdditionalStatistics(root) {
        const speed = root.hubGoals.getProcessorBaseSpeed(enumItemProcessorTypes[processLabelWaterSprayer]);
        return /** @type {[string, string][]}*/ ([
            [T.ingame.buildingPlacement.infoTexts.speed, formatItemsPerSecond(speed)],
            [T.ingame.buildingPlacement.infoTexts.speed, formatItemsPerSecond(config().water_sprayer.water)],
        ]);
    }

    getIsUnlocked(root) {
        return true;
    }

    getDimensions() {
        return new Vector(2, 1);
    }

    setupEntityComponents(entity, root) {
        entity.addComponent(
            new ItemAcceptorComponent({
                slots: [
                    {
                        pos: new Vector(1, 0),
                        direction: enumDirection.right,
                        filter: "material",
                    },
                    {
                        pos: new Vector(1, 0),
                        direction: enumDirection.bottom,
                        filter: "material",
                    },
                ],
            })
        );
        entity.addComponent(
            new ItemEjectorComponent({
                slots: [
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                    },
                ],
            })
        );

        entity.addComponent(
            new ItemProcessorComponent({
                inputsPerCharge: 1,
                processorType: enumItemProcessorTypes[processLabelWaterSprayer],
                processingRequirement: enumItemProcessorRequirements[processLabelWaterSprayer],
            })
        );

        const localConfig = config().water_sprayer;
        entity.addComponent(
            new Pipes.PipePinComponent({
                slots: [
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.bottom,
                        type: "acceptor",
                        fluid: Water.SINGLETON,
                        consumptionPerTick: localConfig.water,
                        maxBuffer: root
                            ? amountPerCharge(root, localConfig.water, processLabelWaterSprayer) * 3
                            : localConfig.water * 3,
                    },
                ],
            })
        );

        if (AdvancedEnergy.isInstalled()) {
            entity.addComponent(getComponentShared("EnergyPinRenderer"));
            entity.addComponent(
                new AdvancedEnergy.EnergyPinComponent({
                    slots: [
                        {
                            direction: enumDirection.top,
                            pos: new Vector(1, 0),
                            type: "acceptor",
                            consumptionPerTick: localConfig.energy,
                            maxBuffer: root
                                ? amountPerCharge(root, localConfig.energy, processLabelWaterSprayer) * 3
                                : localConfig.energy * 3,
                        },
                    ],
                })
            );
        }
    }
}

/**
 * @this { import("../main").ModImpl }
 */
export function setupWaterSprayer() {
    enumItemProcessorTypes[processLabelWaterSprayer] = "heater";
    enumItemProcessorRequirements[processLabelWaterSprayer] = "heater";

    const waterSprayerRecipes = [
        {
            item: materialsEnum().stone,
            output: this.materialSingletons.steel,
        },
    ];

    /**
     * @this {import("shapez/game/systems/item_processor").ItemProcessorSystem}
     * @param {{entity: import("shapez/game/entity").Entity}} param0
     * @returns
     */
    MODS_CAN_PROCESS[enumItemProcessorRequirements[processLabelWaterSprayer]] = function ({ entity }) {
        const localConfig = config().water_sprayer;

        /** @type {import("@dj1tjoo/shapez-pipes/lib/js/components/pipe_pin").PipePinComponent} */
        const pipePinComp = entity.components["PipePin"];

        if (
            !pipePinComp.slots[0].linkedNetwork ||
            pipePinComp.slots[0].buffer <
                amountPerCharge(this.root, localConfig.water, processLabelWaterSprayer)
        ) {
            return false;
        }

        if (AdvancedEnergy.isInstalled()) {
            /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent} */
            const energyPinComp = entity.components["EnergyPin"];
            if (
                !energyPinComp.slots[0].linkedNetwork ||
                energyPinComp.slots[0].buffer <
                    amountPerCharge(this.root, localConfig.energy, processLabelWaterSprayer)
            ) {
                return false;
            }
        }

        const processorComp = entity.components.ItemProcessor;
        return processorComp.inputCount >= processorComp.inputsPerCharge;
    };

    /** @param {{item:MaterialItem, slotIndex: number}} param0 */
    MODS_PROCESSING_REQUIREMENTS[enumItemProcessorRequirements[processLabelWaterSprayer]] = function ({
        item,
        slotIndex,
    }) {
        if (slotIndex === 1) {
            const recipe = waterSprayerRecipes.find(x => x.item === item.type);
            return !!recipe;
        } else {
            return item.type === materialsEnum().sand;
        }
    };
    /**
     * @this {import("shapez/game/systems/item_processor").ItemProcessorSystem}
     */
    MOD_ITEM_PROCESSOR_HANDLERS[enumItemProcessorTypes[processLabelWaterSprayer]] = function ({
        items,
        entity,
        outItems,
    }) {
        const recipe = waterSprayerRecipes.find(x => x.item === items.get(1).type);
        const localConfig = config().water_sprayer;

        if (AdvancedEnergy.isInstalled()) {
            /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent} */
            const pinComp = entity.components["EnergyPin"];

            if (!pinComp.slots[0].linkedNetwork) return;

            entity.components["EnergyPin"].slots[0].buffer -= amountPerCharge(
                this.root,
                localConfig.energy,
                processLabelWaterSprayer
            );
        }

        entity.components["PipePin"].slots[0].buffer -= amountPerCharge(
            this.root,
            localConfig.water,
            processLabelWaterSprayer
        );

        outItems.push({
            item: recipe.output,
        });
    };

    /**
     * @param {GameRoot} root
     */
    MOD_ITEM_PROCESSOR_SPEEDS[enumItemProcessorTypes[processLabelWaterSprayer]] = function (root) {
        return globalConfig.beltSpeedItemsPerSecond * root.hubGoals.upgradeImprovements.processors * (1 / 8);
    };
}
