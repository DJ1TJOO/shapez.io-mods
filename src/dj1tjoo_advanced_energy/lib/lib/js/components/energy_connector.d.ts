/// <reference path="../../../types.d.ts" />
export class EnergyConnectorComponent extends Component {
    /**
     * @param {object} param0
     * @param {number=} param0.maxEnergyVolume The max energy that this building can store
     * @param {number=} param0.maxThroughputPerTick The max energy that is able to be transfered in the network with in a tick
     * @param {string=} param0.type The type of connectors it can link to
     * @param {{from: import("shapez/core/vector").enumDirection, to: import("shapez/core/vector").enumDirection}=} param0.direction The directions the connector is able to input and output from
     */
    constructor({ maxEnergyVolume, maxThroughputPerTick, type, direction }: {
        maxEnergyVolume?: number | undefined;
        maxThroughputPerTick?: number | undefined;
        type?: string | undefined;
        direction?: {
            from: import("shapez/core/vector").enumDirection;
            to: import("shapez/core/vector").enumDirection;
        } | undefined;
    });
    maxEnergyVolume: number;
    maxThroughputPerTick: number;
    type: string;
    direction: {
        from: import("shapez/core/vector").enumDirection;
        to: import("shapez/core/vector").enumDirection;
    };
    /**
     * @type {import("../energy/energy_network").EnergyNetwork}
     */
    linkedNetwork: import("../energy/energy_network").EnergyNetwork;
    /**
     * @type {import("../energy/energy_network").EnergyNetwork}
     */
    oldNetwork: import("../energy/energy_network").EnergyNetwork;
    get energyVolume(): number;
}
import { Component } from "shapez/game/component";
