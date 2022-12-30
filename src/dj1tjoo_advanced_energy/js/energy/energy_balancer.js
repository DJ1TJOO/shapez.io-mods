import { EnergyNetwork } from "./energy_network";

/**
 * Balances the inputs and ouputs of the energy network
 * @param {EnergyNetwork} network
 */
export function balanceEnergyNetwork(network) {
    const potentialProduction = network.providers.reduce((a, { slot }) => a + slot.production, 0);
    const potentialConsumption = network.consumers.reduce((a, { slot }) => a + slot.consumption, 0);

    if (potentialConsumption === 0 && potentialProduction === 0) {
        return;
    }

    let productionRatio = 1;
    let consumptionRatio = 1;

    if (potentialProduction > potentialConsumption) {
        const storageDeficit = network.maxVolume - network.currentVolume;
        const realProduction = Math.min(potentialProduction, potentialConsumption + storageDeficit);
        network.currentVolume += realProduction - potentialConsumption;
        productionRatio = realProduction / potentialProduction;
    } else {
        const storageSurplus = network.currentVolume;
        const realConsumption = Math.min(potentialConsumption, potentialProduction + storageSurplus);
        network.currentVolume -= realConsumption - potentialProduction;
        consumptionRatio = realConsumption / potentialConsumption;
    }

    network.providers.forEach(({ slot }) => slot.produce(productionRatio * slot.production));
    network.consumers.forEach(({ slot }) => slot.consume(consumptionRatio * slot.consumption));
}
