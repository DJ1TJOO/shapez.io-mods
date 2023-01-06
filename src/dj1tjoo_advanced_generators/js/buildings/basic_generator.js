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
import { formatAePerTick, formatLPerTick } from "../ui/formatter";
import { amountPerCharge } from "../amountPerCharge";
import { config } from "../config";
import { Pipes } from "@dj1tjoo/shapez-pipes";
import { StoneMagma } from "../../../shared/fluids/magma";
import { rewards } from "../reward";

const overlayMatrix = generateMatrixRotations([1, 1, 1, 1, 0, 1, 1, 1, 1]);

export const processLabelBasicGenerator = "dj1tjoo@basic_generator";
export const basicGeneratorMagma = "basic_magma";

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
            {
                variant: basicGeneratorMagma,
                name: "Basic Magma Generator",
                description: "Generates flux by providing it with magma",
            },
        ];
    }

    getAvailableVariants(root) {
        if (root.hubGoals.isRewardUnlocked(rewards.advanced_energy_fluids)) {
            return [defaultBuildingVariant, basicGeneratorMagma];
        }

        return [defaultBuildingVariant];
    }

    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant) {
        return overlayMatrix[rotation];
    }

    getAdditionalStatistics(root, variant) {
        const stats = /** @type {[string, string][]}*/ ([
            [T.advanced_generators.produces, formatAePerTick(config().basic_generator[variant].energy)],
        ]);

        if (variant === basicGeneratorMagma) {
            stats.push([
                T.advanced_generators.consumes,
                formatLPerTick(config().basic_generator[variant].magma),
            ]);
        }

        return stats;
    }

    /**
     * Should update the entity to match the given variants
     * @param {import("shapez/game/entity").Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    updateVariants(entity, rotationVariant, variant) {
        const localConfig = config().basic_generator[variant];

        entity.components["EnergyPin"].setSlots([
            {
                direction: enumDirection.left,
                pos: new Vector(0, 0),
                type: "ejector",
                productionPerTick: localConfig.energy,
                maxBuffer: entity.root
                    ? amountPerCharge(entity.root, localConfig.energy, processLabelBasicGenerator) * 3
                    : localConfig.energy * 3,
            },
        ]);

        if (variant === basicGeneratorMagma) {
            entity.components.ItemProcessor.inputsPerCharge = 0;
            entity.components["PipePin"].setSlots([
                {
                    direction: enumDirection.bottom,
                    pos: new Vector(0, 0),
                    type: "acceptor",
                    consumptionPerTick: localConfig.magma,
                    maxBuffer: entity.root
                        ? amountPerCharge(entity.root, localConfig.magma, processLabelBasicGenerator) * 3
                        : localConfig.magma * 3,
                    fluid: StoneMagma.SINGLETON,
                },
            ]);
        } else if (variant === defaultBuildingVariant) {
            entity.components.ItemAcceptor.setSlots([
                {
                    direction: enumDirection.bottom,
                    pos: new Vector(0, 0),
                    filter: "shape",
                },
            ]);
        }
    }

    /**
     * Creates the entity at the given location
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     * @param {import("shapez/game/root").GameRoot} root
     */
    setupEntityComponents(entity, root) {
        entity.addComponent(
            new ItemAcceptorComponent({
                slots: [],
            })
        );

        entity.addComponent(
            new ItemProcessorComponent({
                inputsPerCharge: 1,
                processorType: enumItemProcessorTypes[processLabelBasicGenerator],
                processingRequirement: enumItemProcessorRequirements[processLabelBasicGenerator],
            })
        );

        entity.addComponent(new BasicGeneratorComponent());

        entity.addComponent(
            new AdvancedEnergy.EnergyPinComponent({
                slots: [],
            })
        );

        entity.addComponent(
            new Pipes.PipePinComponent({
                slots: [],
            })
        );
    }
}

export function setupBasicGenerator() {
    enumItemProcessorTypes[processLabelBasicGenerator] = processLabelBasicGenerator;
    enumItemProcessorRequirements[processLabelBasicGenerator] = processLabelBasicGenerator;

    /**
     * @this {import("shapez/game/systems/item_processor").ItemProcessorSystem}
     */
    MODS_CAN_PROCESS[enumItemProcessorRequirements[processLabelBasicGenerator]] = function ({ entity }) {
        const localConfig = config().basic_generator[entity.components.StaticMapEntity.getVariant()];

        /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent} */
        const pinComp = entity.components["EnergyPin"];
        if (
            pinComp.slots[0].buffer +
                amountPerCharge(this.root, localConfig.energy, processLabelBasicGenerator) >
            pinComp.slots[0].maxBuffer
        ) {
            return false;
        }

        /** @type {import("@dj1tjoo/shapez-pipes/lib/js/components/pipe_pin").PipePinComponent} */
        const pipeComp = entity.components["PipePin"];
        if (
            pipeComp.slots[0] &&
            pipeComp.slots[0].buffer <
                amountPerCharge(this.root, localConfig.magma, processLabelBasicGenerator)
        ) {
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
     * @this {import("shapez/game/systems/item_processor").ItemProcessorSystem}
     */
    MOD_ITEM_PROCESSOR_HANDLERS[enumItemProcessorTypes[processLabelBasicGenerator]] = function ({
        items,
        entity,
    }) {
        const localConfig = config().basic_generator[entity.components.StaticMapEntity.getVariant()];

        entity.components["EnergyPin"].slots[0].buffer += amountPerCharge(
            this.root,
            localConfig.energy,
            processLabelBasicGenerator
        );

        if (entity.components.StaticMapEntity.getVariant() === basicGeneratorMagma) {
            entity.components["PipePin"].slots[0].buffer -= amountPerCharge(
                this.root,
                localConfig.magma,
                processLabelBasicGenerator
            );
        }
    };

    /**
     * @param {import("shapez/core/draw_parameters").GameRoot} root
     */
    MOD_ITEM_PROCESSOR_SPEEDS[enumItemProcessorTypes[processLabelBasicGenerator]] = function (root) {
        return globalConfig.beltSpeedItemsPerSecond * (1 / 8);
    };
}
