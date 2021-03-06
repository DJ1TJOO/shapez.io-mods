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
    ItemProcessorSystem,
    MODS_CAN_PROCESS,
    MODS_PROCESSING_REQUIREMENTS,
    MOD_ITEM_PROCESSOR_HANDLERS,
} from "shapez/game/systems/item_processor";
import { Mod } from "shapez/mods/mod";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { T } from "shapez/translations";
import { STONE_ITEM_SINGLETONS, enumStoneType } from "../items/stone";

export class MetaBlastFurnaceBuilding extends ModMetaBuilding {
    constructor() {
        super("blast_furnace");
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
        const speed = root.hubGoals.getProcessorBaseSpeed(enumItemProcessorTypes["blast_furnace"]);
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

    setupEntityComponents(entity) {
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
                processorType: enumItemProcessorTypes["blast_furnace"],
                processingRequirement: enumItemProcessorRequirements["blast_furnace"],
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
 * @this { Mod }
 */
export function setupBlastFurnace() {
    const blastFurnaceRecipes = [
        {
            item: STONE_ITEM_SINGLETONS[enumStoneType.stone],
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
    enumItemProcessorTypes["blast_furnace"] = "blast_furnace";
    enumItemProcessorRequirements["blast_furnace"] = "blast_furnace";

    MODS_CAN_PROCESS[enumItemProcessorRequirements["blast_furnace"]] = function ({ entity }) {
        const processorComp = entity.components.ItemProcessor;
        return processorComp.inputCount >= processorComp.inputsPerCharge;
    };

    MODS_PROCESSING_REQUIREMENTS[enumItemProcessorRequirements["blast_furnace"]] = function ({
        entity,
        item,
        slotIndex,
    }) {
        if (!item || !item.definition) return false;
        const recipe = blastFurnaceRecipes.find(x => x.shape(item.definition));
        return !!recipe;
    };

    /**
     * @this {ItemProcessorSystem}
     */
    MOD_ITEM_PROCESSOR_HANDLERS[enumItemProcessorTypes["blast_furnace"]] = function ({
        entity,
        items,
        outItems,
    }) {
        const recipe = blastFurnaceRecipes.find(x => x.shape(items.get(0).definition));

        // Output
        outItems.push({
            item: recipe.item,
        });
    };

    /**
     * @param {GameRoot} root
     */
    MOD_ITEM_PROCESSOR_SPEEDS[enumItemProcessorTypes["blast_furnace"]] = function (root) {
        return globalConfig.beltSpeedItemsPerSecond * root.hubGoals.upgradeImprovements.processors * (1 / 8);
    };
}
