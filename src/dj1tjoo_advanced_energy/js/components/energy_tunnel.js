import { Component } from "shapez/game/component";

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
    constructor({
        pos,
        direction,
        tunnelDirection,
        linkedNetwork,
        oldNetwork,
        maxEnergyVolume = 1000,
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

        this.maxEnergyVolume = maxEnergyVolume;
        this.maxThroughputPerTick = maxThroughputPerTick;
    }

    get energyVolume() {
        if (!this.linkedNetwork) {
            return 0;
        }

        return this.maxEnergyVolume * (this.linkedNetwork.currentVolume / this.linkedNetwork.maxVolume);
    }
}

export class EnergyTunnelComponent extends Component {
    static getId() {
        return "EnergyTunnel";
    }

    /**
     * @param {object} param0
     * @param {Array<EnergyTunnelSlotDefinition>} param0.slots
     */
    constructor({ slots = [] }) {
        super();
        this.setSlots(slots);
    }

    /**
     * Sets the slots of this building
     * @param {Array<EnergyTunnelSlotDefinition>} slots
     */
    setSlots(slots) {
        /** @type {Array<EnergyTunnelSlot>} */
        this.slots = [];

        for (let i = 0; i < slots.length; ++i) {
            const slotData = slots[i];
            this.slots.push(
                new EnergyTunnelSlot({
                    pos: slotData.pos,
                    direction: slotData.direction,
                    linkedNetwork: null,
                    oldNetwork: null,
                    maxEnergyVolume: slotData.maxEnergyVolume,
                    maxThroughputPerTick: slotData.maxThroughputPerTick,
                    type: slotData.type,
                    maxLength: slotData.maxLength,
                    tunnelDirection: slotData.tunnelDirection,
                })
            );
        }
    }
}
