import { Component } from "shapez/game/component";
export class EnergyConnectorComponent extends Component {
    static getId() {
        return "EnergyConnector";
    }
    /**
     * @param {object} param0
     * @param {number=} param0.maxEnergyVolume
     * @param {string=} param0.type
     * @param {{from: enumDirection, to: enumDirection}=} param0.direction
     */
    constructor({ maxEnergyVolume = 30, type = "default", direction = null }) {
        super();
        this.maxEnergyVolume = maxEnergyVolume;
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
