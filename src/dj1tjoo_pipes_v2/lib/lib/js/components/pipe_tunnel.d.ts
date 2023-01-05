/// <reference path="../../../types.d.ts" />
/** @typedef {{
 *   pos: import("shapez/core/vector").Vector,
 *   direction: import("shapez/core/vector").enumDirection,
 *   tunnelDirection: import("shapez/core/vector").enumDirection,
 *   maxThroughputPerTick?: number,
 *   maxPipeVolume?: number
 *   type?: string
 *   maxLength?: number
 * }} PipeTunnelSlotDefinition */
/** @typedef {{
 *   pos: import("shapez/core/vector").Vector,
 *   direction: import("shapez/core/vector").enumDirection,
 *   tunnelDirection: import("shapez/core/vector").enumDirection,
 *   linkedNetwork: import("../pipe/pipe_network").PipeNetwork,
 *   oldNetwork: import("../pipe/pipe_network").PipeNetwork,
 *   maxThroughputPerTick?: number,
 *   maxPipeVolume?: number
 *   type?: string
 *   maxLength?: number
 * }} PipeTunnelSlotType */
export class PipeTunnelSlot {
    /**
     * @param {PipeTunnelSlotType} param0
     */
    constructor({ pos, direction, tunnelDirection, linkedNetwork, oldNetwork, maxPipeVolume, maxThroughputPerTick, type, maxLength, }: PipeTunnelSlotType);
    pos: import("shapez/core/vector").Vector;
    type: string;
    direction: string;
    tunnelDirection: string;
    linkedNetwork: import("../pipe/pipe_network").PipeNetwork;
    oldNetwork: import("../pipe/pipe_network").PipeNetwork;
    maxLength: number;
    maxPipeVolume: number;
    maxThroughputPerTick: number;
    get pipeVolume(): number;
}
export class PipeTunnelComponent extends Component {
    /**
     * @param {object} param0
     * @param {Array<PipeTunnelSlotDefinition>} param0.slots
     */
    constructor({ slots }: {
        slots: Array<PipeTunnelSlotDefinition>;
    });
    /**
     * Sets the slots of this building
     * @param {Array<PipeTunnelSlotDefinition>} slots
     */
    setSlots(slots: Array<PipeTunnelSlotDefinition>): void;
    /** @type {Array<PipeTunnelSlot>} */
    slots: Array<PipeTunnelSlot>;
}
export type PipeTunnelSlotDefinition = {
    pos: import("shapez/core/vector").Vector;
    direction: import("shapez/core/vector").enumDirection;
    tunnelDirection: import("shapez/core/vector").enumDirection;
    maxThroughputPerTick?: number;
    maxPipeVolume?: number;
    type?: string;
    maxLength?: number;
};
export type PipeTunnelSlotType = {
    pos: import("shapez/core/vector").Vector;
    direction: import("shapez/core/vector").enumDirection;
    tunnelDirection: import("shapez/core/vector").enumDirection;
    linkedNetwork: import("../pipe/pipe_network").PipeNetwork;
    oldNetwork: import("../pipe/pipe_network").PipeNetwork;
    maxThroughputPerTick?: number;
    maxPipeVolume?: number;
    type?: string;
    maxLength?: number;
};
import { Component } from "shapez/game/component";
