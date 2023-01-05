import { Component } from "shapez/game/component";

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
    constructor({
        pos,
        direction,
        tunnelDirection,
        linkedNetwork,
        oldNetwork,
        maxPipeVolume = 1000,
        maxThroughputPerTick = 1000,
        type = "default",
        maxLength = 5,
    }) {
        this.pos = pos;
        this.type = type;
        this.direction = direction;
        this.tunnelDirection = tunnelDirection;
        this.linkedNetwork = linkedNetwork;
        this.oldNetwork = oldNetwork;

        this.maxLength = maxLength;

        this.maxPipeVolume = maxPipeVolume;
        this.maxThroughputPerTick = maxThroughputPerTick;
    }

    get pipeVolume() {
        if (!this.linkedNetwork) {
            return 0;
        }

        return this.maxPipeVolume * (this.linkedNetwork.currentVolume / this.linkedNetwork.maxVolume);
    }
}

export class PipeTunnelComponent extends Component {
    static getId() {
        return "PipeTunnel";
    }

    /**
     * @param {object} param0
     * @param {Array<PipeTunnelSlotDefinition>} param0.slots
     */
    constructor({ slots = [] }) {
        super();
        this.setSlots(slots);
    }

    /**
     * Sets the slots of this building
     * @param {Array<PipeTunnelSlotDefinition>} slots
     */
    setSlots(slots) {
        /** @type {Array<PipeTunnelSlot>} */
        this.slots = [];

        for (let i = 0; i < slots.length; ++i) {
            const slotData = slots[i];
            this.slots.push(
                new PipeTunnelSlot({
                    pos: slotData.pos,
                    direction: slotData.direction,
                    linkedNetwork: null,
                    oldNetwork: null,
                    maxPipeVolume: slotData.maxPipeVolume,
                    maxThroughputPerTick: slotData.maxThroughputPerTick,
                    type: slotData.type,
                    maxLength: slotData.maxLength,
                    tunnelDirection: slotData.tunnelDirection,
                })
            );
        }
    }
}
