/** @typedef {{
 * pos: Vector,
 * directions: enumDirection[],
 * filter?: ItemType
 * }} FluidAcceptorSlot */

import { Vector, enumDirection, enumInvertedDirections } from "shapez/core/vector";
import { Component } from "shapez/game/component";

/**
 * Contains information about a slot plus its location
 * @typedef {{
 *  slot: FluidAcceptorSlot,
 *  index: number,
 *  acceptedDirection: enumDirection
 * }} FluidAcceptorLocatedSlot */

/** @typedef {{
 * pos: Vector,
 * directions: enumDirection[],
 * filter?: ItemType
 * }} FluidAcceptorSlotConfig */

export class FluidAcceptorComponent extends Component {
    static getId() {
        return "FluidAcceptor";
    }

    /**
     *
     * @param {object} param0
     * @param {Array<FluidAcceptorSlotConfig>} param0.slots The slots from which we accept fluids
     */
    constructor({ slots = [] }) {
        super();

        /**
         * Fixes belt animations
         * @type {Array<{
         *  fluid: import("shapez/core/global_registries").BaseItem,
         * slotIndex: number,
         * animProgress: number,
         * direction: enumDirection
         * }>}
         */
        this.fluidConsumptionAnimations = [];

        this.setSlots(slots);
    }

    /**
     *
     * @param {Array<FluidAcceptorSlotConfig>} slots
     */
    setSlots(slots) {
        /** @type {Array<FluidAcceptorSlot>} */
        this.slots = [];
        for (let i = 0; i < slots.length; ++i) {
            const slot = slots[i];
            this.slots.push({
                pos: slot.pos,
                directions: slot.directions,

                // Which type of fluid to accept (shape | color | all) @see FluidType
                filter: slot.filter,
            });
        }
    }

    /**
     * Returns if this acceptor can accept a new fluid at slot N
     * @param {number} slotIndex
     * @param {import("shapez/core/global_registries").BaseItem=} fluid
     */
    canAcceptFluid(slotIndex, fluid) {
        const slot = this.slots[slotIndex];
        return !slot.filter || slot.filter === fluid.getItemType();
    }

    /**
     * Called when an fluid has been accepted so that
     * @param {number} slotIndex
     * @param {enumDirection} direction
     * @param {import("shapez/core/global_registries").BaseItem} fluid
     * @param {number} remainingProgress World space remaining progress, can be set to set the start position of the fluid
     */
    onFluidAccepted(slotIndex, direction, fluid, remainingProgress = 0.0) {
        this.fluidConsumptionAnimations.push({
            fluid,
            slotIndex,
            direction,
            animProgress: Math.min(1, remainingProgress * 2),
        });
    }

    /**
     * Tries to find a slot which accepts the current fluid
     * @param {Vector} targetLocalTile
     * @param {enumDirection} fromLocalDirection
     * @returns {FluidAcceptorLocatedSlot|null}
     */
    findMatchingSlot(targetLocalTile, fromLocalDirection) {
        // We need to invert our direction since the acceptor specifies *from* which direction
        // it accepts fluids, but the ejector specifies *into* which direction it ejects fluids.
        // E.g.: Ejector ejects into "right" direction but acceptor accepts from "left" direction.
        const desiredDirection = enumInvertedDirections[fromLocalDirection];

        // Go over all slots and try to find a target slot
        for (let slotIndex = 0; slotIndex < this.slots.length; ++slotIndex) {
            const slot = this.slots[slotIndex];

            // Make sure the acceptor slot is on the right position
            if (!slot.pos.equals(targetLocalTile)) {
                continue;
            }

            // Check if the acceptor slot accepts fluids from our direction
            for (let i = 0; i < slot.directions.length; ++i) {
                // const localDirection = targetStaticComp.localDirectionToWorld(slot.directions[l]);
                if (desiredDirection === slot.directions[i]) {
                    return {
                        slot,
                        index: slotIndex,
                        acceptedDirection: desiredDirection,
                    };
                }
            }
        }

        return null;
    }
}
