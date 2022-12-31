import { Component } from "shapez/game/component";

export class EnergyConnectorComponent extends Component {
    static getId() {
        return "EnergyConnector";
    }

    /**
     * @param {object} param0
     * @param {number=} param0.maxEnergyVolume The max energy that this building can store
     * @param {number=} param0.maxThroughputPerTick The max energy that is able to be transfered in the network with in a tick
     * @param {string=} param0.type The type of connectors it can link to
     * @param {{from: import("shapez/core/vector").enumDirection, to: import("shapez/core/vector").enumDirection}=} param0.direction The directions the connector is able to input and output from
     */
    constructor({ maxEnergyVolume = 30, maxThroughputPerTick = 50, type = "default", direction = null }) {
        super();
        this.maxEnergyVolume = maxEnergyVolume;
        this.maxThroughputPerTick = maxThroughputPerTick;
        this.type = type;
        this.direction = direction;
        /**
         * @type {import("../energy/energy_network").EnergyNetwork}
         */
        this.linkedNetwork = null;
        /**
         * @type {import("../energy/energy_network").EnergyNetwork}
         */
        this.oldNetwork = null;

        this.maxEnergyVolume = maxEnergyVolume;
    }

    get energyVolume() {
        if (!this.linkedNetwork) {
            return 0;
        }

        return this.maxEnergyVolume * (this.linkedNetwork.currentVolume / this.linkedNetwork.maxVolume);
    }
}
