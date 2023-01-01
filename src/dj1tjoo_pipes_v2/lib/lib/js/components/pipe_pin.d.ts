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
 *   productionPerTick?: number,
 *   consumptionPerTick?: number,
 *   maxBuffer?: number
 *   fluid: BaseFluid
 * }} PipePinSlotDefinition */
/** @typedef {{
 *   pos: import("shapez/core/vector").Vector,
 *   type: enumPinSlotType,
 *   direction: import("shapez/core/vector").enumDirection,
 *   linkedNetwork: import("../pipe/pipe_network").PipeNetwork,
 *   oldNetwork: import("../pipe/pipe_network").PipeNetwork,
 *   productionPerTick?: number,
 *   consumptionPerTick?: number,
 *   maxBuffer?: number
 *   fluid: BaseFluid
 * }} PipePinSlotType */
export class PipePinSlot {
    /**
     * @param {PipePinSlotType} param0
     */
    constructor({ pos, type, direction, linkedNetwork, oldNetwork, productionPerTick, consumptionPerTick, maxBuffer, fluid, }: PipePinSlotType);
    pos: import("shapez/core/vector").Vector;
    type: string;
    direction: string;
    linkedNetwork: import("../pipe/pipe_network").PipeNetwork;
    oldNetwork: import("../pipe/pipe_network").PipeNetwork;
    fluid: BaseFluid;
    maxProduction: number;
    maxConsumption: number;
    buffer: number;
    maxBuffer: number;
    get production(): number;
    produce(amount: any): void;
    get consumption(): number;
    consume(amount: any): void;
}
export class PipePinComponent extends Component {
    /**
     * @param {object} param0
     * @param {Array<PipePinSlotDefinition>} param0.slots
     */
    constructor({ slots }: {
        slots: Array<PipePinSlotDefinition>;
    });
    /**
     * Sets the slots of this building
     * @param {Array<PipePinSlotDefinition>} slots
     */
    setSlots(slots: Array<PipePinSlotDefinition>): void;
    /** @type {Array<PipePinSlot>} */
    slots: Array<PipePinSlot>;
}
export type PipePinSlotDefinition = {
    pos: import("shapez/core/vector").Vector;
    type: "ejector" | "acceptor";
    direction: import("shapez/core/vector").enumDirection;
    productionPerTick?: number;
    consumptionPerTick?: number;
    maxBuffer?: number;
    fluid: BaseFluid;
};
export type PipePinSlotType = {
    pos: import("shapez/core/vector").Vector;
    type: enumPinSlotType;
    direction: import("shapez/core/vector").enumDirection;
    linkedNetwork: import("../pipe/pipe_network").PipeNetwork;
    oldNetwork: import("../pipe/pipe_network").PipeNetwork;
    productionPerTick?: number;
    consumptionPerTick?: number;
    maxBuffer?: number;
    fluid: BaseFluid;
};
import { BaseFluid } from "../items/base_fluid";
import { Component } from "shapez/game/component";
