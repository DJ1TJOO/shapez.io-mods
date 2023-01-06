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
import { Steam } from "../../../shared/fluids/steam";
import { Water } from "../../../shared/fluids/water";
import { getComponentShared } from "../../../shared/getShared";
import { rewards } from "../reward";

export const processLabelSteamGenerator = "dj1tjoo@steam_generator";

export class MetaSteamGeneratorBuilding extends ModMetaBuilding {
    constructor() {
        super("steam_generator");
    }

    getSilhouetteColor() {
        return "#CDD3DA";
    }

    getDimensions() {
        return new Vector(3, 2);
    }

    /**
     * @param {import("shapez/game/root").GameRoot} root
     * @returns {boolean}
     */
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(rewards.advanced_energy_steam_turbine);
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Steam Generator",
                description: "Generates steam from energy and water",
            },
        ];
    }

    getAdditionalStatistics() {
        return /** @type {[string, string][]}*/ ([
            [T.advanced_generators.produces, formatLPerTick(config().steam_generator.steam)],
            [T.advanced_generators.consumes, formatLPerTick(config().steam_generator.water)],
            [T.advanced_generators.consumes, formatAePerTick(config().steam_generator.energy)],
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
                processorType: enumItemProcessorTypes[processLabelSteamGenerator],
                processingRequirement: enumItemProcessorRequirements[processLabelSteamGenerator],
            })
        );

        entity.addComponent(getComponentShared("EnergyPinRenderer"));
        entity.addComponent(getComponentShared("PipePinRenderer"));

        const localConfig = config().steam_generator;
        entity.addComponent(
            new AdvancedEnergy.EnergyPinComponent({
                slots: [
                    {
                        direction: enumDirection.left,
                        pos: new Vector(0, 0),
                        type: "acceptor",
                        consumptionPerTick: localConfig.energy,
                        maxBuffer: root
                            ? amountPerCharge(root, localConfig.energy, processLabelSteamGenerator) * 3
                            : localConfig.energy * 3,
                    },
                ],
            })
        );

        entity.addComponent(
            new Pipes.PipePinComponent({
                slots: [
                    {
                        direction: enumDirection.top,
                        pos: new Vector(2, 0),
                        type: "ejector",
                        productionPerTick: localConfig.steam,
                        maxBuffer: root
                            ? amountPerCharge(root, localConfig.steam, processLabelSteamGenerator) * 3
                            : localConfig.steam * 3,
                        fluid: Steam.SINGLETON,
                    },
                    {
                        direction: enumDirection.bottom,
                        pos: new Vector(0, 1),
                        type: "acceptor",
                        consumptionPerTick: localConfig.water,
                        maxBuffer: root
                            ? amountPerCharge(root, localConfig.water, processLabelSteamGenerator) * 3
                            : localConfig.water * 3,
                        fluid: Water.SINGLETON,
                    },
                ],
            })
        );
    }
}

export function setupSteamGenerator() {
    enumItemProcessorTypes[processLabelSteamGenerator] = processLabelSteamGenerator;
    enumItemProcessorRequirements[processLabelSteamGenerator] = processLabelSteamGenerator;

    /**
     * @this {import("shapez/game/systems/item_processor").ItemProcessorSystem}
     */
    MODS_CAN_PROCESS[enumItemProcessorRequirements[processLabelSteamGenerator]] = function ({ entity }) {
        const localConfig = config().steam_generator;

        /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent} */
        const energyPinComp = entity.components["EnergyPin"];

        if (
            !energyPinComp.slots[0].linkedNetwork ||
            energyPinComp.slots[0].buffer <
                amountPerCharge(this.root, localConfig.energy, processLabelSteamGenerator)
        ) {
            return false;
        }

        /** @type {import("@dj1tjoo/shapez-pipes/lib/js/components/pipe_pin").PipePinComponent} */
        const pipePinComp = entity.components["PipePin"];
        if (
            !pipePinComp.slots[0].linkedNetwork ||
            pipePinComp.slots[0].buffer +
                amountPerCharge(this.root, localConfig.steam, processLabelSteamGenerator) >
                pipePinComp.slots[0].maxBuffer
        ) {
            return false;
        }

        if (
            !pipePinComp.slots[1].linkedNetwork ||
            pipePinComp.slots[1].buffer <
                amountPerCharge(this.root, localConfig.water, processLabelSteamGenerator)
        ) {
            return false;
        }

        return true;
    };

    MODS_PROCESSING_REQUIREMENTS[enumItemProcessorRequirements[processLabelSteamGenerator]] = function ({
        _,
        item,
    }) {
        return true;
    };

    /**
     * @this {import("shapez/game/systems/item_processor").ItemProcessorSystem}
     * @param {{items:any, entity: import("shapez/game/entity").Entity}} param0
     */
    MOD_ITEM_PROCESSOR_HANDLERS[enumItemProcessorTypes[processLabelSteamGenerator]] = function ({
        items,
        entity,
    }) {
        const localConfig = config().steam_generator;

        /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent} */
        const pinComp = entity.components["EnergyPin"];

        if (!pinComp.slots[0].linkedNetwork) return;

        entity.components["EnergyPin"].slots[0].buffer -= amountPerCharge(
            this.root,
            localConfig.energy,
            processLabelSteamGenerator
        );

        entity.components["PipePin"].slots[0].buffer += amountPerCharge(
            this.root,
            localConfig.steam,
            processLabelSteamGenerator
        );

        entity.components["PipePin"].slots[1].buffer -= amountPerCharge(
            this.root,
            localConfig.water,
            processLabelSteamGenerator
        );
    };

    /**
     * @param {import("shapez/core/draw_parameters").GameRoot} root
     */
    MOD_ITEM_PROCESSOR_SPEEDS[enumItemProcessorTypes[processLabelSteamGenerator]] = function (root) {
        return globalConfig.beltSpeedItemsPerSecond * (1 / 8);
    };
}
