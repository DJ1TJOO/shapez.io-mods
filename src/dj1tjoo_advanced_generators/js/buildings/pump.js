import { generateMatrixRotations } from "shapez/core/utils";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
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
import { T } from "shapez/translations";
import { formatAePerTick, formatLPerTick } from "../ui/formatter";
import { Pipes } from "@dj1tjoo/shapez-pipes";
import { AdvancedEnergy } from "@dj1tjoo/shapez-advanced-energy";
import { amountPerCharge } from "../amountPerCharge";
import { config } from "../config";

const overlayMatrix = generateMatrixRotations([1, 1, 1, 1, 0, 1, 1, 1, 1]);

export const processLabelPump = "dj1tjoo@pump";

export class MetaPumpBuilding extends ModMetaBuilding {
    constructor() {
        super("pump");
    }

    getSilhouetteColor() {
        return "#04FC84";
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Basic Pump",
                description: "Pumps up fluid from a fluid patch",
            },
        ];
    }

    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant) {
        return overlayMatrix[rotation];
    }

    getAdditionalStatistics() {
        const localConfig = config().pump;

        return /** @type {[string, string][]}*/ ([
            [T.advanced_generators.produces, formatLPerTick(localConfig.water)],
            [T.advanced_generators.consumes, formatAePerTick(localConfig.energy)],
        ]);
    }

    /**
     * Creates the entity at the given location
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     * @param {import("shapez/game/root").GameRoot} root
     */
    setupEntityComponents(entity, root) {
        entity.addComponent(
            new ItemProcessorComponent({
                inputsPerCharge: 0,
                processorType: enumItemProcessorTypes[processLabelPump],
                processingRequirement: enumItemProcessorRequirements[processLabelPump],
            })
        );

        const localConfig = config().pump;

        entity.addComponent(
            new AdvancedEnergy.EnergyPinComponent({
                slots: [
                    {
                        direction: enumDirection.left,
                        pos: new Vector(0, 0),
                        type: "acceptor",
                        consumptionPerTick: localConfig.energy,
                        maxBuffer: root
                            ? amountPerCharge(root, localConfig.energy, processLabelPump) * 3
                            : localConfig.energy * 3,
                    },
                ],
            })
        );

        if (!root) return;

        let fluid = null;
        const staticComp = entity.components.StaticMapEntity;
        const tileBelow = /** @type {import("@dj1tjoo/shapez-pipes/lib/js/items/base_fluid").BaseFluid} */ (
            root.map.getLowerLayerContentXY(staticComp.origin.x, staticComp.origin.y)
        );
        if (tileBelow && tileBelow.getItemType() === "fluid") {
            const fluidClass =
                /** @type {typeof import("@dj1tjoo/shapez-pipes/lib/js/items/base_fluid").BaseFluid} */ (
                    Pipes.gFluidRegistry.findById(tileBelow.getFluidType())
                );

            fluid = /** @type {import("@dj1tjoo/shapez-pipes/lib/js/items/base_fluid").BaseFluid} */ (
                fluidClass.resolver()
            );
        }
        if (!fluid) return;

        entity.addComponent(
            new Pipes.PipePinComponent({
                slots: [
                    {
                        direction: enumDirection.top,
                        pos: new Vector(0, 0),
                        type: "ejector",
                        productionPerTick: localConfig.water,
                        maxBuffer: root
                            ? amountPerCharge(root, localConfig.water, processLabelPump) * 3
                            : localConfig.water * 3,
                        fluid,
                    },
                ],
            })
        );
    }
}

export function setupPump() {
    enumItemProcessorTypes[processLabelPump] = processLabelPump;
    enumItemProcessorRequirements[processLabelPump] = processLabelPump;

    /**
     * @this {import("shapez/game/systems/item_processor").ItemProcessorSystem}
     */
    MODS_CAN_PROCESS[enumItemProcessorRequirements[processLabelPump]] = function ({ entity }) {
        const localConfig = config().pump;

        /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent} */
        const energyPinComp = entity.components["EnergyPin"];
        if (
            !energyPinComp.slots[0].linkedNetwork ||
            energyPinComp.slots[0].buffer < amountPerCharge(this.root, localConfig.energy, processLabelPump)
        ) {
            return false;
        }

        /** @type {import("@dj1tjoo/shapez-pipes/lib/js/components/pipe_pin").PipePinComponent} */
        const pipePinComp = entity.components["PipePin"];
        if (
            !pipePinComp ||
            pipePinComp.slots[0].buffer + amountPerCharge(this.root, localConfig.water, processLabelPump) >
                pipePinComp.slots[0].maxBuffer
        ) {
            return false;
        }

        return true;
    };

    MODS_PROCESSING_REQUIREMENTS[enumItemProcessorRequirements[processLabelPump]] = function ({
        entity,
        item,
    }) {
        return !!entity.components["PipePin"];
    };

    /**
     * @this {import("shapez/game/systems/item_processor").ItemProcessorSystem}
     * @param {{items:any, entity: import("shapez/game/entity").Entity}} param0
     */
    MOD_ITEM_PROCESSOR_HANDLERS[enumItemProcessorTypes[processLabelPump]] = function ({ items, entity }) {
        const localConfig = config().pump;

        /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent} */
        const pinComp = entity.components["EnergyPin"];

        if (!pinComp.slots[0].linkedNetwork) return;

        entity.components["EnergyPin"].slots[0].buffer -= amountPerCharge(
            this.root,
            localConfig.energy,
            processLabelPump
        );

        entity.components["PipePin"].slots[0].buffer += amountPerCharge(
            this.root,
            localConfig.water,
            processLabelPump
        );
    };

    /**
     * @param {import("shapez/core/draw_parameters").GameRoot} root
     */
    MOD_ITEM_PROCESSOR_SPEEDS[enumItemProcessorTypes[processLabelPump]] = function (root) {
        return globalConfig.beltSpeedItemsPerSecond * (1 / 8);
    };
}
