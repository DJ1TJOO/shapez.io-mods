import { globalConfig } from "shapez/core/config";
import { formatItemsPerSecond } from "shapez/core/utils";
import { Vector, enumDirection } from "shapez/core/vector";
import { enumColors } from "shapez/game/colors";
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
    ItemProcessorSystem,
    MODS_CAN_PROCESS,
    MODS_PROCESSING_REQUIREMENTS,
    MOD_ITEM_PROCESSOR_HANDLERS,
} from "shapez/game/systems/item_processor";
import { Mod } from "shapez/mods/mod";
import { MODS } from "shapez/mods/modloader";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { T } from "shapez/translations";
import { enumMagmaTypes } from "../fluids/magma";
import { enumSandType, SAND_ITEM_SINGLETONS } from "../items/sand";
import { STONE_ITEM_SINGLETONS, enumStoneType, StoneItem } from "../items/stone";

export class MetaWaterSprayerBuilding extends ModMetaBuilding {
    constructor() {
        super("water_sprayer");
    }

    static getAllVariantCombinations() {
        return [
            {
                name: "Water sprayer",
                description: "Sprays stones with water and shapez",
                variant: defaultBuildingVariant,
            },
        ];
    }

    getSilhouetteColor() {
        return "#DBF1FD";
    }

    getAdditionalStatistics(root) {
        const speed = root.hubGoals.getProcessorBaseSpeed(enumItemProcessorTypes["water_sprayer"]);
        return /** @type {[[string, string]]}*/ ([
            [T.ingame.buildingPlacement.infoTexts.speed, formatItemsPerSecond(speed)],
        ]);
    }

    getIsUnlocked(root) {
        return true;
    }

    getDimensions() {
        return new Vector(2, 1);
    }

    setupEntityComponents(entity) {
        // @ts-ignore
        const { PipedPinsComponent, enumPinSlotType } = MODS.mods.find(
            x => x.metadata.id === "dj1tjoo_pipes"
        );
        entity.addComponent(
            new ItemAcceptorComponent({
                slots: [
                    {
                        pos: new Vector(1, 0),
                        direction: enumDirection.bottom,
                        filter: "shape",
                    },
                    {
                        pos: new Vector(1, 0),
                        direction: enumDirection.right,
                        filter: "stone",
                    },
                ],
            })
        );
        entity.addComponent(
            new PipedPinsComponent({
                slots: [
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.bottom,
                        type: enumPinSlotType.logicalAcceptor,
                        pressure: 10,
                    },
                ],
            })
        );

        entity.addComponent(
            new ItemProcessorComponent({
                inputsPerCharge: 2,
                processorType: enumItemProcessorTypes["water_sprayer"],
                processingRequirement: enumItemProcessorRequirements["water_sprayer"],
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
    }
}

/**
 * @this { Mod }
 */
export function setupWaterSprayer() {
    // @ts-ignore
    const { WATER_SINGLETON } = MODS.mods.find(x => x.metadata.id === "dj1tjoo_pipes");
    const waterSprayerRecipes = [
        {
            item: STONE_ITEM_SINGLETONS[enumStoneType.onyx],
            fluidCost: 10,
            minPressure: 50,
            stone: enumStoneType.basalt,
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
                            tr.subShape !== enumSubShape.windmill ||
                            br.subShape !== enumSubShape.windmill ||
                            tl.subShape !== enumSubShape.windmill ||
                            bl.subShape !== enumSubShape.windmill
                        ) {
                            return false;
                        }
                    }

                    return true;
                },
        },
        {
            item: STONE_ITEM_SINGLETONS[enumStoneType.marble],
            fluidCost: 10,
            minPressure: 50,
            stone: enumStoneType.stone,
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
                            tr.color !== enumColors.white ||
                            br.color !== enumColors.white ||
                            tl.color !== enumColors.white ||
                            bl.color !== enumColors.white
                        ) {
                            return false;
                        }
                    }

                    return true;
                },
        },
        {
            item: STONE_ITEM_SINGLETONS[enumStoneType.clean_marble],
            fluidCost: 10,
            minPressure: 50,
            stone: enumStoneType.marble,
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
                            tr.color !== enumColors.cyan ||
                            br.color !== enumColors.cyan ||
                            tl.color !== enumColors.cyan ||
                            bl.color !== enumColors.cyan
                        ) {
                            return false;
                        }
                    }

                    return true;
                },
        },
        {
            item: SAND_ITEM_SINGLETONS[enumSandType.sand],
            fluidCost: 10,
            minPressure: 50,
            stone: enumStoneType.stone,
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
                            tr.color !== enumColors.yellow ||
                            br.color !== enumColors.yellow ||
                            tl.color !== enumColors.yellow ||
                            bl.color !== enumColors.yellow
                        ) {
                            return false;
                        }
                    }

                    return true;
                },
        },
    ];
    enumItemProcessorTypes["water_sprayer"] = "water_sprayer";
    enumItemProcessorRequirements["water_sprayer"] = "water_sprayer";
    MODS_CAN_PROCESS[enumItemProcessorRequirements["water_sprayer"]] = function ({ entity }) {
        // @ts-ignore
        const pinsComp = entity.components.PipedPins;

        if (!pinsComp) return false;
        if (!pinsComp.slots[0].linkedNetwork) return false;
        if (!pinsComp.slots[0].linkedNetwork.currentFluid) return false;
        if (pinsComp.slots[0].linkedNetwork.currentFluid !== WATER_SINGLETON) return false;

        const processorComp = entity.components.ItemProcessor;
        return processorComp.inputCount >= processorComp.inputsPerCharge;
    };

    MODS_PROCESSING_REQUIREMENTS[enumItemProcessorRequirements["water_sprayer"]] = function ({
        entity,
        item,
        slotIndex,
    }) {
        if (!item) return false;

        // @ts-ignore
        const pinsComp = entity.components.PipedPins;

        if (!pinsComp) return false;
        if (!pinsComp.slots[0].linkedNetwork) return false;
        if (!pinsComp.slots[0].linkedNetwork.currentFluid) return false;
        if (pinsComp.slots[0].linkedNetwork.currentFluid !== WATER_SINGLETON) return false;

        if (item.definition) {
            const recipe = waterSprayerRecipes.find(x => x.shape(item.definition));
            return !!recipe;
        } else {
            const recipe = waterSprayerRecipes.find(x => item.stoneType === x.stone);
            return !!recipe;
        }
    };

    /**
     * @this {ItemProcessorSystem}
     */
    MOD_ITEM_PROCESSOR_HANDLERS[enumItemProcessorTypes["water_sprayer"]] = function ({
        outItems,
        items,
        entity,
    }) {
        // @ts-ignore
        const pinsComp = entity.components.PipedPins;

        if (pinsComp.slots[0].linkedNetwork) {
            const recipe = waterSprayerRecipes.find(
                x => x.shape(items.get(0).definition) && items.get(1).stoneType === x.stone
            );

            // Output
            if (
                pinsComp.getLocalVolume(this.root, entity, pinsComp.slots[0]) > recipe.fluidCost &&
                pinsComp.getLocalPressure(this.root, entity, pinsComp.slots[0]) > recipe.minPressure
            ) {
                outItems.push({
                    item: recipe.item,
                });

                pinsComp.slots[0].linkedNetwork.currentVolume -= recipe.fluidCost;
            }
        }
    };

    /**
     * @param {GameRoot} root
     */
    MOD_ITEM_PROCESSOR_SPEEDS[enumItemProcessorTypes["water_sprayer"]] = function (root) {
        return globalConfig.beltSpeedItemsPerSecond * root.hubGoals.upgradeImprovements.processors * (1 / 8);
    };
}
