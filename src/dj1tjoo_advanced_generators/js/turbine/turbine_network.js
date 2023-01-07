import { round2Digits } from "shapez/core/utils";
import { enumItemProcessorTypes } from "shapez/game/components/item_processor";
import { ShapeItem } from "shapez/game/items/shape_item";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { amountPerCharge } from "../amountPerCharge";
import { processLabelTurbine, turbineComponents } from "../buildings/turbine";
import { config } from "../config";

let turbineUidCounter = 0;
export class TurbineNetwork {
    constructor() {
        /** @type {import("shapez/game/entity").Entity[]} */
        this.parts = [];

        /**
         * Unique network identifier
         * @type {number}
         */
        this.uid = ++turbineUidCounter;

        /**
         * Shapes currently stored in the turbine
         * @type {ShapeItem[]}
         */
        this.fuel = [];

        this.remainingChargeTime = 0;
    }

    /**
     * @param {import("shapez/game/root").GameRoot} root
     */
    process(root) {
        // TODO: show why turbine is not valid on controller
        if (!this.isValid) return;

        this.remainingChargeTime -= root.dynamicTickrate.deltaSeconds;
        if (this.remainingChargeTime > 0) return;

        const tier = this.tier;
        const steam = this.steam;
        const availableEnergyBuffer = this.availableEnergyBuffer;

        if (this.fuel.length < tier.items) return;
        if (steam < tier.steam) return;

        const produced = amountPerCharge(root, tier.energy, processLabelTurbine);
        if (this.energy + produced > availableEnergyBuffer) return;
        this.remainingChargeTime =
            1 / root.hubGoals.getProcessorBaseSpeed(enumItemProcessorTypes[processLabelTurbine]);

        // Consume
        this.fuel.splice(this.fuel.length - tier.items, tier.items);
        this.parts
            .filter(x => x.components.StaticMapEntity.getVariant() === turbineComponents.steam_intake)
            .flatMap(x => x.components["PipePin"].slots)
            .forEach(slot => (slot.buffer -= (slot.buffer / steam) * tier.steam));

        const mixers = this.parts.filter(
            x => x.components.StaticMapEntity.getVariant() === turbineComponents.mixer
        );
        const efficienty = round2Digits(Math.min(1, mixers.length / tier.items));
        console.log(efficienty);

        // Produce
        this.parts
            .filter(
                entity => entity.components.StaticMapEntity.getVariant() === turbineComponents.energy_outlet
            )
            .flatMap(entity => entity.components["EnergyPin"].slots.map((y, i) => ({ slot: y, i, entity })))
            .forEach(
                ({ slot, i, entity }) =>
                    (entity.components["EnergyPin"].slots[i].buffer +=
                        ((slot.maxBuffer - slot.buffer) / availableEnergyBuffer) * produced * efficienty)
            );
    }

    get tier() {
        const localConfig = config().turbine;
        if (this.fuel.length < 1) return localConfig.tier1;

        if (this.fuel.some(x => x.definition.getHash() === localConfig.tier1.shape)) return localConfig.tier1;
        if (this.fuel.some(x => x.definition.getHash() === localConfig.tier2.shape)) return localConfig.tier2;
        if (this.fuel.some(x => x.definition.getHash() === localConfig.tier3.shape)) return localConfig.tier3;
        if (this.fuel.some(x => x.definition.getHash() === localConfig.tier4.shape)) return localConfig.tier4;

        return localConfig.tier1;
    }

    get availableEnergyBuffer() {
        return this.parts
            .filter(x => x.components.StaticMapEntity.getVariant() === turbineComponents.energy_outlet)
            .reduce(
                (total, outlet) =>
                    total +
                    outlet.components["EnergyPin"].slots.reduce(
                        (total, slot, i) => total + slot.maxBuffer,
                        0
                    ),
                0
            );
    }

    get energy() {
        return this.parts
            .filter(x => x.components.StaticMapEntity.getVariant() === turbineComponents.energy_outlet)
            .reduce(
                (total, outlet) =>
                    total +
                    outlet.components["EnergyPin"].slots.reduce((total, slot) => total + slot.buffer, 0),
                0
            );
    }

    get steam() {
        return this.parts
            .filter(x => x.components.StaticMapEntity.getVariant() === turbineComponents.steam_intake)
            .reduce(
                (total, outlet) =>
                    total +
                    outlet.components["PipePin"].slots.reduce((total, slot) => total + slot.buffer, 0),
                0
            );
    }

    get controller() {
        return (
            this.parts.find(x => x.components.StaticMapEntity.getVariant() === defaultBuildingVariant) || null
        );
    }

    get isValid() {
        return (
            this.hasSufficientControllers() &&
            this.hasSufficientEnergyOutlets() &&
            this.hasSufficientFuelIntakes() &&
            this.hasSufficientSteamIntakes() &&
            this.fitsInMaxArea()
        );
    }

    hasSufficientControllers() {
        const controllers = this.parts.filter(
            x => x.components.StaticMapEntity.getVariant() === defaultBuildingVariant
        );
        return controllers.length === 1;
    }

    hasSufficientSteamIntakes() {
        const localConfig = config().turbine;

        const steamIntakes = this.parts.filter(
            x => x.components.StaticMapEntity.getVariant() === turbineComponents.steam_intake
        );
        return steamIntakes.length > 0 && steamIntakes.length <= localConfig.maxConnections.steam_intake;
    }

    hasSufficientFuelIntakes() {
        const localConfig = config().turbine;

        const fuelIntakes = this.parts.filter(
            x => x.components.StaticMapEntity.getVariant() === turbineComponents.fuel_intake
        );
        return fuelIntakes.length > 0 && fuelIntakes.length <= localConfig.maxConnections.fuel_intake;
    }

    hasSufficientEnergyOutlets() {
        const localConfig = config().turbine;
        const energyOutlets = this.parts.filter(
            x => x.components.StaticMapEntity.getVariant() === turbineComponents.energy_outlet
        );

        return energyOutlets.length > 0 && energyOutlets.length <= localConfig.maxConnections.energy_outlet;
    }

    fitsInMaxArea() {
        const localConfig = config().turbine;
        const posX = this.parts.flatMap(x => [
            x.components.StaticMapEntity.origin.x,
            x.components.StaticMapEntity.origin.x + x.components.StaticMapEntity.getTileSize().x,
        ]);
        const posY = this.parts.flatMap(x => [
            x.components.StaticMapEntity.origin.y,
            x.components.StaticMapEntity.origin.y + x.components.StaticMapEntity.getTileSize().y,
        ]);
        const minX = Math.min(...posX);
        const minY = Math.min(...posY);
        const maxX = Math.max(...posX);
        const maxY = Math.max(...posY);

        const area = (maxX - minX) * (maxY - minY);
        return area <= localConfig.maxArea;
    }
}
