/// <reference path="../../../types.d.ts" />
/** @typedef {{
 *   pos: import("shapez/core/vector").Vector,
 *   direction: import("shapez/core/vector").enumDirection,
 *   tunnelDirection: import("shapez/core/vector").enumDirection,
 *   maxThroughputPerTick?: number,
 *   maxEnergyVolume?: number
 *   type?: string
 *   maxLength?: number
 * }} EnergyTunnelSlotDefinition */
/** @typedef {{
 *   pos: import("shapez/core/vector").Vector,
 *   direction: import("shapez/core/vector").enumDirection,
 *   tunnelDirection: import("shapez/core/vector").enumDirection,
 *   linkedNetwork: import("../energy/energy_network").EnergyNetwork,
 *   oldNetwork: import("../energy/energy_network").EnergyNetwork,
 *   maxThroughputPerTick?: number,
 *   maxEnergyVolume?: number
 *   type?: string
 *   maxLength?: number
 * }} EnergyTunnelSlotType */
export class EnergyTunnelSlot {
    /**
     * @param {EnergyTunnelSlotType} param0
     */
    constructor({ pos, direction, tunnelDirection, linkedNetwork, oldNetwork, maxEnergyVolume, maxThroughputPerTick, type, maxLength, }: EnergyTunnelSlotType);
    pos: import("shapez/core/vector").Vector;
    type: string;
    direction: string;
    tunnelDirection: string;
    linkedNetwork: import("../energy/energy_network").EnergyNetwork;
    oldNetwork: import("../energy/energy_network").EnergyNetwork;
    maxLength: number;
    maxEnergyVolume: number;
    maxThroughputPerTick: number;
    get energyVolume(): number;
}
export class EnergyTunnelComponent extends Component {
    /**
     * @param {object} param0
     * @param {Array<EnergyTunnelSlotDefinition>} param0.slots
     */
    constructor({ slots }: {
        slots: Array<EnergyTunnelSlotDefinition>;
    });
    /**
     * Sets the slots of this building
     * @param {Array<EnergyTunnelSlotDefinition>} slots
     */
    setSlots(slots: Array<EnergyTunnelSlotDefinition>): void;
    /** @type {Array<EnergyTunnelSlot>} */
    slots: Array<EnergyTunnelSlot>;
}
export type EnergyTunnelSlotDefinition = {
    pos: import("shapez/core/vector").Vector;
    direction: import("shapez/core/vector").enumDirection;
    tunnelDirection: import("shapez/core/vector").enumDirection;
    maxThroughputPerTick?: number;
    maxEnergyVolume?: number;
    type?: string;
    maxLength?: number;
};
export type EnergyTunnelSlotType = {
    pos: import("shapez/core/vector").Vector;
    direction: import("shapez/core/vector").enumDirection;
    tunnelDirection: import("shapez/core/vector").enumDirection;
    linkedNetwork: import("../energy/energy_network").EnergyNetwork;
    oldNetwork: import("../energy/energy_network").EnergyNetwork;
    maxThroughputPerTick?: number;
    maxEnergyVolume?: number;
    type?: string;
    maxLength?: number;
};
import { Component } from "shapez/game/component";
