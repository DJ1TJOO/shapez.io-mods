import { AdvancedEnergy } from "@dj1tjoo/shapez-advanced-energy";
import { globalConfig } from "shapez/core/config";
import { formatItemsPerSecond } from "shapez/core/utils";
import { Vector, enumDirection } from "shapez/core/vector";
import { ItemAcceptorComponent } from "shapez/game/components/item_acceptor";
import { ItemEjectorComponent } from "shapez/game/components/item_ejector";
import {
    enumItemProcessorRequirements,
    enumItemProcessorTypes,
    ItemProcessorComponent,
} from "shapez/game/components/item_processor";
import { MOD_ITEM_PROCESSOR_SPEEDS } from "shapez/game/hub_goals";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import {
    ShapeDefinition,
    enumSubShape,
    BOTTOM_LEFT,
    BOTTOM_RIGHT,
    TOP_LEFT,
    TOP_RIGHT,
} from "shapez/game/shape_definition";
import {
    MODS_CAN_PROCESS,
    MODS_PROCESSING_REQUIREMENTS,
    MOD_ITEM_PROCESSOR_HANDLERS,
} from "shapez/game/systems/item_processor";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { T } from "shapez/translations";
import { amountPerCharge } from "../amountPerCharge";
import { config, materialsEnum } from "../config";
import { getComponentShared } from "../../../shared/getShared";
import { createId } from "../createId";

const processLabelBlastFurnace = createId("blast_furnace");

export class MetaBlastFurnaceBuilding extends ModMetaBuilding {
    constructor() {
        super(createId("blast_furnace"));
    }

    static getAllVariantCombinations() {
        return [
            {
                name: "Blast Furnace",
                description: "Bakes shapez and materials",
                variant: defaultBuildingVariant,
            },
        ];
    }

    getSilhouetteColor() {
        return "#dd4124";
    }

    getAdditionalStatistics(root) {
        const speed = root.hubGoals.getProcessorBaseSpeed(enumItemProcessorTypes[processLabelBlastFurnace]);
        return /** @type {[[string, string]]}*/ ([
            [T.ingame.buildingPlacement.infoTexts.speed, formatItemsPerSecond(speed)],
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
                        filter: "shape",
                    },
                ],
            })
        );

        entity.addComponent(
            new ItemProcessorComponent({
                inputsPerCharge: 1,
                processorType: enumItemProcessorTypes[processLabelBlastFurnace],
                processingRequirement: enumItemProcessorRequirements[processLabelBlastFurnace],
            })
        );

        entity.addComponent(getComponentShared("EnergyPinRenderer"));
        entity.addComponent(
            new AdvancedEnergy.EnergyPinComponent({
                slots: [
                    {
                        direction: enumDirection.left,
                        pos: new Vector(0, 1),
                        type: "acceptor",
                        consumptionPerTick: config().blast_furnace.energy,
                        maxBuffer: root
                            ? amountPerCharge(root, config().blast_furnace.energy, processLabelBlastFurnace) *
                              3
                            : config().blast_furnace.energy * 3,
                    },
                ],
            })
        );

        entity.addComponent(
            new ItemEjectorComponent({
                slots: [{ pos: new Vector(0, 0), direction: enumDirection.top }],
            })
        );
    }
}

/**
 * @this { import("../main").ModImpl }
 */
export function setupBlastFurnace() {
    const blastFurnaceRecipes = [
        {
            item: this.materialSingletons[materialsEnum().stone],
            shape:
                /**
                 * @param {ShapeDefinition} shapeDefinition
                 */
                shapeDefinition => {
                    const newLayers = shapeDefinition.getClonedLayers();
                    for (let i = 0; i < newLayers.length; i++) {
                        const layer = newLayers[i];

                        const tr = layer[TOP_RIGHT];
                        const br = layer[BOTTOM_RIGHT];
                        const bl = layer[BOTTOM_LEFT];
                        const tl = layer[TOP_LEFT];

                        if (
                            tr.subShape !== enumSubShape.rect ||
                            br.subShape !== enumSubShape.rect ||
                            tl.subShape !== enumSubShape.rect ||
                            bl.subShape !== enumSubShape.rect
                        ) {
                            return false;
                        }
                    }

                    return true;
                },
        },
    ];
    enumItemProcessorTypes[processLabelBlastFurnace] = processLabelBlastFurnace;
    enumItemProcessorRequirements[processLabelBlastFurnace] = processLabelBlastFurnace;

    /**
     * @this {import("shapez/game/systems/item_processor").ItemProcessorSystem}
     */
    MODS_CAN_PROCESS[enumItemProcessorRequirements[processLabelBlastFurnace]] = function ({ entity }) {
        const localConfig = config().blast_furnace;

        /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent} */
        const energyPinComp = entity.components["EnergyPin"];
        if (
            !energyPinComp.slots[0].linkedNetwork ||
            energyPinComp.slots[0].buffer <
                amountPerCharge(this.root, localConfig.energy, processLabelBlastFurnace)
        ) {
            return false;
        }

        const processorComp = entity.components.ItemProcessor;
        return processorComp.inputCount >= processorComp.inputsPerCharge;
    };

    MODS_PROCESSING_REQUIREMENTS[enumItemProcessorRequirements[processLabelBlastFurnace]] = function ({
        entity,
        item,
        slotIndex,
    }) {
        if (!item || !item.definition) return false;
        const recipe = blastFurnaceRecipes.find(x => x.shape(item.definition));
        return !!recipe;
    };

    /**
     * @this {import("shapez/game/systems/item_processor").ItemProcessorSystem}
     */
    MOD_ITEM_PROCESSOR_HANDLERS[enumItemProcessorTypes[processLabelBlastFurnace]] = function ({
        entity,
        items,
        outItems,
    }) {
        const localConfig = config().blast_furnace;

        /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent} */
        const pinComp = entity.components["EnergyPin"];

        if (!pinComp.slots[0].linkedNetwork) return;

        entity.components["EnergyPin"].slots[0].buffer -= amountPerCharge(
            this.root,
            localConfig.energy,
            processLabelBlastFurnace
        );

        const recipe = blastFurnaceRecipes.find(x => x.shape(items.get(0).definition));

        // Output
        outItems.push({
            item: recipe.item,
        });
    };

    /**
     * @param {GameRoot} root
     */
    MOD_ITEM_PROCESSOR_SPEEDS[enumItemProcessorTypes[processLabelBlastFurnace]] = function (root) {
        return globalConfig.beltSpeedItemsPerSecond * root.hubGoals.upgradeImprovements.processors * (1 / 8);
    };
}
