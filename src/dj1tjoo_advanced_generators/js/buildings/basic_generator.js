import { formatItemsPerSecond, generateMatrixRotations } from "shapez/core/utils";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { ItemAcceptorComponent } from "shapez/game/components/item_acceptor";
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
import { TOP_RIGHT, BOTTOM_RIGHT, BOTTOM_LEFT, TOP_LEFT, enumSubShape } from "shapez/game/shape_definition";
import { enumColors } from "shapez/game/colors";
import { AdvancedEnergy } from "@dj1tjoo/shapez-advanced-energy";
import { BasicGeneratorComponent } from "../components/basic_generator";
import { T } from "shapez/translations";
import { formatAePerSecond } from "../ui/aeFormatter";

const overlayMatrix = generateMatrixRotations([1, 1, 1, 1, 0, 1, 1, 1, 1]);

export const processLabelBasicGenerator = "dj1tjoo@basic_generator";
const volumeCreated = 50;

export class MetaBasicGeneratorBuilding extends ModMetaBuilding {
    constructor() {
        super("basic_generator");
    }

    getSilhouetteColor() {
        return "#04FC84";
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Basic Generator",
                description: "Generates flux by providing it with a circle",
            },
        ];
    }

    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant) {
        return overlayMatrix[rotation];
    }

    getAdditionalStatistics(root) {
        const speed = root.hubGoals.getProcessorBaseSpeed(enumItemProcessorTypes[processLabelBasicGenerator]);
        return /** @type {[[string, string]]}*/ ([
            [T.ingame.buildingPlacement.infoTexts.speed, formatAePerSecond(speed * volumeCreated)],
        ]);
    }

    /**
     * Creates the entity at the given location
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     * @param {import("shapez/game/root").GameRoot} root
     */
    setupEntityComponents(entity, root) {
        entity.addComponent(
            new ItemAcceptorComponent({
                slots: [
                    {
                        direction: enumDirection.bottom,
                        pos: new Vector(0, 0),
                        filter: "shape",
                    },
                ],
            })
        );

        entity.addComponent(
            new ItemProcessorComponent({
                inputsPerCharge: 1,
                processorType: enumItemProcessorTypes[processLabelBasicGenerator],
                processingRequirement: enumItemProcessorRequirements[processLabelBasicGenerator],
            })
        );

        entity.addComponent(
            new BasicGeneratorComponent({
                production: volumeCreated,
            })
        );

        const speed = globalConfig.beltSpeedItemsPerSecond * (1 / 8);
        entity.addComponent(
            new AdvancedEnergy.EnergyPinComponent({
                slots: [
                    {
                        direction: enumDirection.left,
                        pos: new Vector(0, 0),
                        type: "ejector",
                        productionPerTick: volumeCreated * speed,
                        maxBuffer: 100,
                    },
                ],
            })
        );
    }
}

export function setupBasicGenerator() {
    enumItemProcessorTypes[processLabelBasicGenerator] = processLabelBasicGenerator;
    enumItemProcessorRequirements[processLabelBasicGenerator] = processLabelBasicGenerator;

    MODS_CAN_PROCESS[enumItemProcessorRequirements[processLabelBasicGenerator]] = function ({ entity }) {
        /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent} */
        const pinComp = entity.components["EnergyPin"];
        if (pinComp.slots[0].buffer + volumeCreated > pinComp.slots[0].maxBuffer) {
            return false;
        }

        const processorComp = entity.components.ItemProcessor;
        return processorComp.inputCount >= processorComp.inputsPerCharge;
    };

    MODS_PROCESSING_REQUIREMENTS[enumItemProcessorRequirements[processLabelBasicGenerator]] = function ({
        _,
        item,
    }) {
        // If input is uncolored circle

        if (!item || !item.definition) return false;

        /** @type { import("shapez/game/shape_definition").ShapeLayer[] } */
        const newLayers = item.definition.getClonedLayers();
        if (newLayers.length > 1) {
            return false;
        }

        const layer = newLayers[0];
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

        if (
            tr.color !== enumColors.uncolored ||
            br.color !== enumColors.uncolored ||
            tl.color !== enumColors.uncolored ||
            bl.color !== enumColors.uncolored
        ) {
            return false;
        }

        return true;
    };

    /**
     * @this {ItemProcessorSystem}
     */
    MOD_ITEM_PROCESSOR_HANDLERS[enumItemProcessorTypes[processLabelBasicGenerator]] = function ({
        items,
        entity,
    }) {
        entity.components["EnergyPin"].slots[0].buffer += volumeCreated;
    };

    /**
     * @param {import("shapez/core/draw_parameters").GameRoot} root
     */
    MOD_ITEM_PROCESSOR_SPEEDS[enumItemProcessorTypes[processLabelBasicGenerator]] = function (root) {
        return globalConfig.beltSpeedItemsPerSecond * (1 / 8);
    };
}
