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
import { MODS } from "shapez/mods/modloader";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { T } from "shapez/translations";
import { enumMagmaTypes } from "../fluids/magma";
import { STONE_ITEM_SINGLETONS, enumStoneType, StoneItem } from "../items/stone";

export class MetaHeaterBuilding extends ModMetaBuilding {
    constructor() {
        super("heater");
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
        const speed = root.hubGoals.getProcessorBaseSpeed(enumItemProcessorTypes["heater"]);
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
        // @ts-ignore
        const { PipedPinsComponent, enumPinSlotType } = MODS.mods.find(
            x => x.metadata.id === "dj1tjoo_pipes"
        );
        entity.addComponent(
            new ItemAcceptorComponent({
                slots: [
                    {
                        pos: new Vector(0, 1),
                        direction: enumDirection.bottom,
                        filter: "stone",
                    },
                ],
            })
        );

        entity.addComponent(
            new ItemProcessorComponent({
                inputsPerCharge: 1,
                processorType: enumItemProcessorTypes["heater"],
                processingRequirement: enumItemProcessorRequirements["heater"],
            })
        );

        entity.addComponent(
            new PipedPinsComponent({
                slots: [
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalEjector,
                    },
                ],
            })
        );
    }
}

/**
 * @this { Mod }
 */
export function setupHeater() {
    // @ts-ignore
    const MAGMA_SINGLETONS = this.MAGMA_SINGLETONS;
    enumItemProcessorTypes["heater"] = "heater";
    enumItemProcessorRequirements["heater"] = "heater";

    const heaterRecipes = [
        {
            item: STONE_ITEM_SINGLETONS[enumStoneType.stone],
            fluid: MAGMA_SINGLETONS[enumMagmaTypes.stone_magma],
            fluidAdded: 10,
            pressure: 100,
        },
        {
            item: STONE_ITEM_SINGLETONS[enumStoneType.basalt],
            fluid: MAGMA_SINGLETONS[enumMagmaTypes.basalt_magma],
            fluidAdded: 10,
            pressure: 100,
        },
        {
            item: STONE_ITEM_SINGLETONS[enumStoneType.clean_marble],
            fluid: MAGMA_SINGLETONS[enumMagmaTypes.cleaned_marble_magma],
            fluidAdded: 10,
            pressure: 100,
        },
    ];

    MODS_CAN_PROCESS[enumItemProcessorRequirements["heater"]] = function ({ entity }) {
        // @ts-ignore
        const pinsComp = entity.components.PipedPins;

        if (!pinsComp) return false;
        if (!pinsComp.slots[0].linkedNetwork) return false;
        if (pinsComp.slots[0].linkedNetwork.currentVolume >= pinsComp.slots[0].linkedNetwork.maxVolume)
            return false;

        const processorComp = entity.components.ItemProcessor;
        return processorComp.inputCount >= processorComp.inputsPerCharge;
    };

    MODS_PROCESSING_REQUIREMENTS[enumItemProcessorRequirements["heater"]] = function ({
        entity,
        item,
        slotIndex,
    }) {
        // @ts-ignore
        const pinsComp = entity.components.PipedPins;

        if (!pinsComp) return false;
        if (!pinsComp.slots[0].linkedNetwork) return false;
        if (pinsComp.slots[0].linkedNetwork.currentVolume >= pinsComp.slots[0].linkedNetwork.maxVolume)
            return false;

        const recipe = heaterRecipes.find(x => x.item === item);
        return !!recipe;
    };
    /**
     * @this {ItemProcessorSystem}
     */
    MOD_ITEM_PROCESSOR_HANDLERS[enumItemProcessorTypes["heater"]] = function ({ items, entity }) {
        // @ts-ignore
        const pinsComp = entity.components.PipedPins;

        /** @type {StoneItem} */
        const stone = items.get(0);

        const recipe = heaterRecipes.find(x => x.item === stone);
        if (pinsComp) {
            pinsComp.slots[0].pressure = recipe.pressure;
            pinsComp.slots[0].fluid = recipe.fluid;
            if (pinsComp.slots[0].linkedNetwork) {
                pinsComp.slots[0].linkedNetwork.currentVolume += recipe.fluidAdded;
            }
        }
    };

    /**
     * @param {GameRoot} root
     */
    MOD_ITEM_PROCESSOR_SPEEDS[enumItemProcessorTypes["heater"]] = function (root) {
        return globalConfig.beltSpeedItemsPerSecond * root.hubGoals.upgradeImprovements.processors * (1 / 8);
    };
}
