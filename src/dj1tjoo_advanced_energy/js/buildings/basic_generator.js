import { generateMatrixRotations } from "shapez/core/utils";
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
import { EnergyPinComponent } from "../components/energy_pin";

const overlayMatrix = generateMatrixRotations([1, 1, 1, 1, 0, 1, 1, 1, 1]);

const processLabelBasicGenerator = "dj1tjoo@basic_generator";

export class MetaBasicGeneratorBuilding extends ModMetaBuilding {
    constructor() {
        super("basic_generator");
    }

    getSilhouetteColor() {
        return "#CFCBC9";
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Basic Generator",
                description: "Generates 50f (flux)",
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
            new EnergyPinComponent({
                slots: [
                    {
                        direction: enumDirection.left,
                        pos: new Vector(0, 0),
                        type: "ejector",
                        production: 50,
                    },
                ],
            })
        );
    }
}

export function setupBasicGenerator() {
    enumItemProcessorTypes[processLabelBasicGenerator] = processLabelBasicGenerator;
    enumItemProcessorRequirements[processLabelBasicGenerator] = processLabelBasicGenerator;

    const volumeCreated = 50;

    MODS_CAN_PROCESS[enumItemProcessorRequirements[processLabelBasicGenerator]] = function ({ entity }) {
        /** @type {EnergyPinComponent} */
        const pinComp = entity.components["EnergyPin"];
        if (!pinComp.slots[0].linkedNetwork || !pinComp.slots[0].linkedNetwork.canAdd(volumeCreated)) {
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
        /** @type {EnergyPinComponent} */
        const pinComp = entity.components["EnergyPin"];

        if (!pinComp.slots[0].linkedNetwork) return;

        pinComp.slots[0].buffer += volumeCreated;
    };

    /**
     * @param {import("shapez/core/draw_parameters").GameRoot} root
     */
    MOD_ITEM_PROCESSOR_SPEEDS[enumItemProcessorTypes[processLabelBasicGenerator]] = function (root) {
        // TODO: remove upgrade later
        return globalConfig.beltSpeedItemsPerSecond * root.hubGoals.upgradeImprovements.processors * (1 / 8);
    };
}
