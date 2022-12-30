/// <reference path="../../../types.d.ts" />
export type enumPinSlotType = string;
export namespace enumPinSlotType {
    const ejector: string;
    const acceptor: string;
}
/** @typedef {{
 *   pos: import("shapez/core/vector").Vector,
 *   type: "ejector" | "acceptor",
 *   direction: import("shapez/core/vector").enumDirection,
 *   production?: number,
 *   consumption?: number,
 *   maxBuffer?: number
 * }} EnergyPinSlotDefinition */
/** @typedef {{
 *   pos: import("shapez/core/vector").Vector,
 *   type: enumPinSlotType,
 *   direction: import("shapez/core/vector").enumDirection,
 *   linkedNetwork: import("../energy/energy_network").EnergyNetwork,
 *   oldNetwork: import("../energy/energy_network").EnergyNetwork,
 *   production?: number,
 *   consumption?: number,
 *   maxBuffer?: number
 * }} EnergyPinSlotType */
export class EnergyPinSlot {
    /**
     * @param {EnergyPinSlotType} param0
     */
    constructor({ pos, type, direction, linkedNetwork, oldNetwork, production, consumption, maxBuffer }: EnergyPinSlotType);
    pos: import("shapez/core/vector").Vector;
    type: string;
    direction: string;
    linkedNetwork: import("../energy/energy_network").EnergyNetwork;
    oldNetwork: import("../energy/energy_network").EnergyNetwork;
    maxProduction: number;
    maxConsumption: number;
    buffer: number;
    maxBuffer: number;
    get production(): number;
    produce(amount: any): void;
    get consumption(): number;
    consume(amount: any): void;
}
export class EnergyPinComponent extends Component {
    /**
     * @param {object} param0
     * @param {Array<EnergyPinSlotDefinition>} param0.slots
     */
    constructor({ slots }: {
        slots: Array<EnergyPinSlotDefinition>;
    });
    /**
     * Sets the slots of this building
     * @param {Array<EnergyPinSlotDefinition>} slots
     */
    setSlots(slots: Array<EnergyPinSlotDefinition>): void;
    /** @type {Array<EnergyPinSlot>} */
    slots: Array<EnergyPinSlot>;
}
export type EnergyPinSlotDefinition = {
    pos: import("shapez/core/vector").Vector;
    type: "ejector" | "acceptor";
    direction: import("shapez/core/vector").enumDirection;
    production?: number;
    consumption?: number;
    maxBuffer?: number;
};
export type EnergyPinSlotType = {
    pos: import("shapez/core/vector").Vector;
    type: enumPinSlotType;
    direction: import("shapez/core/vector").enumDirection;
    linkedNetwork: import("../energy/energy_network").EnergyNetwork;
    oldNetwork: import("../energy/energy_network").EnergyNetwork;
    production?: number;
    consumption?: number;
    maxBuffer?: number;
};
import { Component } from "shapez/game/component";
