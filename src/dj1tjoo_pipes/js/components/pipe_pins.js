import { Vector, enumDirection, enumDirectionToVector } from "shapez/core/vector";
import { Component } from "shapez/game/component";
import { Entity } from "shapez/game/entity";
import { GameRoot } from "shapez/game/root";
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
 *   direction: enumDirection,
 *   volume?: number,
 *   pressure?: number,
 * }} PipePinSlotDefinition */

/** @typedef {{
 *   pos: Vector,
 *   type: enumPinSlotType,
 *   direction: enumDirection,
 *   pressure: Number,
 *   fluid: BaseFluid,
 *   volume: Number,
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
                pressure: slotData.pressure || 0,
                volume: slotData.volume || 0,
                fluid: null,
                linkedNetwork: null,
            });
        }
    }

    /**
     * @param {GameRoot} root
     * @param {Entity} entity
     * @param {number} slotIndex
     * @returns {number}
     */
    getLocalPressure(root, entity, slotIndex) {
        const slot = this.slots[slotIndex];

        // If ejector the local pressure is the one generated
        if (slot.type === enumPinSlotType.logicalEjector) {
            return slot.pressure;
        }

        const pipe = this.getConnectedPipe(root, entity, slot);

        // @ts-ignore
        return pipe.components.Pipe.localPressure;
    }

    getConnectedPipe(root, entity, slot) {
        const direction =
            enumDirectionToVector[entity.components.StaticMapEntity.localDirectionToWorld(slot.direction)];
        const worldPos = entity.components.StaticMapEntity.localTileToWorld(slot.pos).add(direction);
        return root.map.getTileContent(worldPos, "regular");
    }
}
