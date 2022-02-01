import { Vector, enumDirection } from "shapez/core/vector";
import { Component } from "shapez/game/component";
import { types } from "shapez/savegame/serialization";
import { BaseFluid, typeFluidSingleton } from "../base_fluid";

/** @enum {string} */
export const enumPinSlotType = {
    logicalEjector: "logicalEjector",
    logicalAcceptor: "logicalAcceptor",
};

/** @typedef {{
 *   pos: Vector,
 *   type: enumPinSlotType,
 *   direction: enumDirection
 * }} PipePinSlotDefinition */

/** @typedef {{
 *   pos: Vector,
 *   type: enumPinSlotType,
 *   direction: enumDirection,
 *   pressure: Number,
 *   fluid: BaseFluid,
 *   linkedNetwork: import("../systems/pipe").PipeNetwork
 * }} PipePinSlot */

export class PipedPinsComponent extends Component {
    static getId() {
        return "PipedPins";
    }

    static getSchema() {
        return {
            slots: types.fixedSizeArray(
                types.structured({
                    pressure: types.uint,
                    fluid: types.nullable(typeFluidSingleton),
                })
            ),
        };
    }

    /**
     *
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
            this.slots.push({
                pos: slotData.pos,
                type: slotData.type,
                direction: slotData.direction,
                pressure: 0,
                fluid: null,
                linkedNetwork: null,
            });
        }
    }
}
