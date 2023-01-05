import { Component } from "shapez/game/component";
import { BaseFluid } from "../items/base_fluid";

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
    constructor({
        pos,
        type,
        direction,
        linkedNetwork,
        oldNetwork,
        productionPerTick,
        consumptionPerTick,
        maxBuffer,
        fluid,
    }) {
        this.pos = pos;
        this.type = type;
        this.direction = direction;
        this.linkedNetwork = linkedNetwork;
        this.oldNetwork = oldNetwork;

        this.fluid = fluid;

        this.maxProduction = productionPerTick ?? 0;
        this.maxConsumption = consumptionPerTick ?? 0;

        this.buffer = 0;
        this.maxBuffer = maxBuffer ?? 3 * Math.max(this.maxProduction, this.maxConsumption);
    }

    get production() {
        return this.linkedNetwork?.maxThoughput < 0
            ? Math.min(this.buffer, this.maxProduction)
            : Math.min(this.buffer, this.maxProduction, this.linkedNetwork?.maxThoughput);
    }
    produce(amount) {
        this.buffer -= amount;
    }

    get consumption() {
        return this.linkedNetwork?.maxThoughput < 0
            ? Math.min(this.maxBuffer - this.buffer, this.maxConsumption)
            : Math.min(this.maxBuffer - this.buffer, this.maxConsumption, this.linkedNetwork?.maxThoughput);
    }
    consume(amount) {
        this.buffer += amount;
    }
}

export class PipePinComponent extends Component {
    static getId() {
        return "PipePin";
    }

    /**
     * @param {object} param0
     * @param {Array<PipePinSlotDefinition>} param0.slots
     */
    constructor({ slots = [] }) {
        super();
        this.setSlots(slots);
    }

    /**
     * Sets the slots of this building
     * @param {Array<PipePinSlotDefinition>} slots
     */
    setSlots(slots) {
        /** @type {Array<PipePinSlot>} */
        this.slots = [];

        for (let i = 0; i < slots.length; ++i) {
            const slotData = slots[i];
            this.slots.push(
                new PipePinSlot({
                    pos: slotData.pos,
                    type: slotData.type,
                    direction: slotData.direction,
                    linkedNetwork: null,
                    oldNetwork: null,
                    productionPerTick: slotData.productionPerTick,
                    consumptionPerTick: slotData.consumptionPerTick,
                    maxBuffer: slotData.maxBuffer,
                    fluid: slotData.fluid,
                })
            );
        }
    }
}
