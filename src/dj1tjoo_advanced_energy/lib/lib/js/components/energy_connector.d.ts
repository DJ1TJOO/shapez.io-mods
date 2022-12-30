/// <reference path="../../../types.d.ts" />
export class EnergyConnectorComponent extends Component {
    /**
     * @param {object} param0
     * @param {number=} param0.maxEnergyVolume
     * @param {string=} param0.type
     * @param {{from: enumDirection, to: enumDirection}=} param0.direction
     */
    constructor({ maxEnergyVolume, type, direction }: {
        maxEnergyVolume?: number | undefined;
        type?: string | undefined;
        direction?: {
            from: enumDirection;
            to: enumDirection;
        } | undefined;
    });
    maxEnergyVolume: number;
    type: string;
    direction: {
        from: enumDirection;
        to: enumDirection;
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
