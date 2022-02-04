import { globalConfig } from "shapez/core/config";
import { formatItemsPerSecond } from "shapez/core/utils";
import { Vector, enumDirection } from "shapez/core/vector";
import { enumColors } from "shapez/game/colors";
import { ItemAcceptorComponent } from "shapez/game/components/item_acceptor";
import { ItemEjectorComponent } from "shapez/game/components/item_ejector";
import { enumItemProcessorTypes, ItemProcessorComponent } from "shapez/game/components/item_processor";
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
import { ItemProcessorSystem, MOD_ITEM_PROCESSOR_HANDLERS } from "shapez/game/systems/item_processor";
import { Mod } from "shapez/mods/mod";
import { MODS } from "shapez/mods/modloader";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { T } from "shapez/translations";
import { enumMagmaTypes } from "../fluids/magma";
import { STONE_ITEM_SINGLETONS, enumStoneType, StoneItem } from "../items/stone";

export class MetaCoolerBuilding extends ModMetaBuilding {
    constructor() {
        super("cooler");
    }

    static getAllVariantCombinations() {
        return [
            {
                name: "Cooler",
                description: "Coolds down fluids",
                variant: defaultBuildingVariant,
            },
        ];
    }

    getSilhouetteColor() {
        return "#DBF1FD";
    }

    getAdditionalStatistics(root) {
        const speed = root.hubGoals.getProcessorBaseSpeed(enumItemProcessorTypes["cooler"]);
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
                ],
            })
        );
        entity.addComponent(
            new PipedPinsComponent({
                slots: [
                    {
                        pos: new Vector(1, 0),
                        direction: enumDirection.right,
                        type: enumPinSlotType.logicalAcceptor,
                        pressure: 10,
                    },
                ],
            })
        );

        entity.addComponent(
            new ItemProcessorComponent({
                inputsPerCharge: 1,
                processorType: enumItemProcessorTypes["cooler"],
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
export function setupCooler() {
    // @ts-ignore
    const MAGMA_SINGLETONS = this.MAGMA_SINGLETONS;
    const coolerRecipes = [
        {
            item: STONE_ITEM_SINGLETONS[enumStoneType.basalt],
            fluid: MAGMA_SINGLETONS[enumMagmaTypes.stone_magma],
            fluidCost: 10,
            minPressure: 50,
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
                            tr.subShape !== enumSubShape.circle ||
                            br.subShape !== enumSubShape.circle ||
                            tl.subShape !== enumSubShape.circle ||
                            bl.subShape !== enumSubShape.circle
                        ) {
                            return false;
                        }
                    }

                    return true;
                },
        },
        {
            item: STONE_ITEM_SINGLETONS[enumStoneType.granite],
            fluid: MAGMA_SINGLETONS[enumMagmaTypes.basalt_magma],
            fluidCost: 20,
            minPressure: 60,
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
                            tr.color !== enumColors.red ||
                            br.color !== enumColors.red ||
                            tl.color !== enumColors.red ||
                            bl.color !== enumColors.red
                        ) {
                            return false;
                        }
                    }

                    return true;
                },
        },
    ];
    enumItemProcessorTypes["cooler"] = "cooler";
    /**
     * @this {ItemProcessorSystem}
     */
    MOD_ITEM_PROCESSOR_HANDLERS[enumItemProcessorTypes["cooler"]] = function ({ outItems, items, entity }) {
        // @ts-ignore
        const pinsComp = entity.components.PipedPins;

        if (pinsComp) {
            if (pinsComp.slots[0].linkedNetwork) {
                const recipes = coolerRecipes.filter(x => x.fluid === pinsComp.slots[0].fluid);
                const recipe = recipes.find(x => x.shape(items.get(0).definition));

                if (!recipe) {
                    // Output same shape a putted in. @TODO: maybe nicer as item acceptor filter
                    return outItems.push({
                        item: items.get(0),
                    });
                }

                // Output
                if (
                    pinsComp.slots[0].linkedNetwork.currentVolume > recipe.fluidCost &&
                    pinsComp.getLocalPressure(this.root, entity, pinsComp.slots[0]) > recipe.minPressure
                ) {
                    outItems.push({
                        item: recipe.item,
                    });

                    pinsComp.slots[0].linkedNetwork.currentVolume -= recipe.fluidCost;
                }
            }
        } else {
            // Output same shape a putted in. @TODO: maybe nicer as item acceptor filter
            return outItems.push({
                item: items.get(0),
            });
        }
    };

    /**
     * @param {GameRoot} root
     */
    MOD_ITEM_PROCESSOR_SPEEDS[enumItemProcessorTypes["cooler"]] = function (root) {
        return globalConfig.beltSpeedItemsPerSecond * root.hubGoals.upgradeImprovements.processors * (1 / 8);
    };
}
