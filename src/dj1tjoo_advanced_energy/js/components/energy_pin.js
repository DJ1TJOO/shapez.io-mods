import { Component } from "shapez/game/component";

/** @enum {string} */
export const enumPinSlotType = {
    ejector: "ejector",
    acceptor: "acceptor",
};

/** @typedef {{
 *   pos: import("shapez/core/vector").Vector,
 *   type: "ejector" | "acceptor",
 *   direction: import("shapez/core/vector").enumDirection,
 *   productionPerTick?: number,
 *   consumptionPerTick?: number,
 *   maxBuffer?: number
 * }} EnergyPinSlotDefinition */

/** @typedef {{
 *   pos: import("shapez/core/vector").Vector,
 *   type: enumPinSlotType,
 *   direction: import("shapez/core/vector").enumDirection,
 *   linkedNetwork: import("../energy/energy_network").EnergyNetwork,
 *   oldNetwork: import("../energy/energy_network").EnergyNetwork,
 *   productionPerTick?: number,
 *   consumptionPerTick?: number,
 *   maxBuffer?: number
 * }} EnergyPinSlotType */

export class EnergyPinSlot {
    /**
     * @param {EnergyPinSlotType} param0
     */
    constructor({
        pos,
        type,
        direction,
        linkedNetwork,
        oldNetwork,
        productionPerTick,
        consumptionPerTick,
        maxBuffer,
    }) {
        this.pos = pos;
        this.type = type;
        this.direction = direction;
        this.linkedNetwork = linkedNetwork;
        this.oldNetwork = oldNetwork;

        this.maxProduction = productionPerTick ?? 0;
        this.maxConsumption = consumptionPerTick ?? 0;

        this.buffer = 0;
        this.maxBuffer = maxBuffer ?? 3 * Math.max(this.maxProduction, this.maxConsumption);
    }

    get production() {
        return Math.min(this.buffer, this.maxProduction, this.linkedNetwork?.maxThoughput);
    }
    produce(amount) {
        this.buffer -= amount;
    }

    get consumption() {
        return Math.min(this.maxBuffer - this.buffer, this.maxConsumption, this.linkedNetwork?.maxThoughput);
    }
    consume(amount) {
        this.buffer += amount;
    }
}

export class EnergyPinComponent extends Component {
    static getId() {
        return "EnergyPin";
    }

    /**
     * @param {object} param0
     * @param {Array<EnergyPinSlotDefinition>} param0.slots
     */
    constructor({ slots = [] }) {
        super();
        this.setSlots(slots);
    }

    /**
     * Sets the slots of this building
     * @param {Array<EnergyPinSlotDefinition>} slots
     */
    setSlots(slots) {
        /** @type {Array<EnergyPinSlot>} */
        this.slots = [];

        for (let i = 0; i < slots.length; ++i) {
            const slotData = slots[i];
            this.slots.push(
                new EnergyPinSlot({
                    pos: slotData.pos,
                    type: slotData.type,
                    direction: slotData.direction,
                    linkedNetwork: null,
                    oldNetwork: null,
                    productionPerTick: slotData.productionPerTick,
                    consumptionPerTick: slotData.consumptionPerTick,
                    maxBuffer: slotData.maxBuffer,
                })
            );
        }
    }
}
