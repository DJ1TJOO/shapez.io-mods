/**
 * Balances the inputs and ouputs of the pipe network
 * @param {import("./pipe_network").PipeNetwork} network
 */
export function balancePipeNetwork(network) {
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

    let maxProduction = 0;
    let maxConsumption = 0;

    network.providers.forEach(({ slot }) => {
        const production = productionRatio * slot.production;
        if (maxProduction < production) {
            maxProduction = production;
        }

        slot.produce(production);
    });
    network.consumers.forEach(({ slot }) => {
        const consumption = consumptionRatio * slot.consumption;
        if (maxConsumption < consumption) {
            maxConsumption = consumption;
        }

        slot.consume(consumption);
    });

    network.currentThroughput = Math.max(maxProduction, maxConsumption);
}
