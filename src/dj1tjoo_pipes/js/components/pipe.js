import { Component } from "shapez/game/component";
import { defaultBuildingVariant } from "shapez/game/meta_building";

/** @enum {string} */
export const enumPipeType = {
    forward: "forward",
    turn: "turn",
    split: "split",
    cross: "cross",
};

export class PipeComponent extends Component {
    static getId() {
        return "Pipe";
    }

    /**
     * @param {object} param0
     * @param {enumPipeType=} param0.type
     * @param {string=} param0.variant
     * @param {number=} param0.pressureFriction
     */
    constructor({ type = enumPipeType.forward, variant = defaultBuildingVariant, pressureFriction = 0.2 }) {
        super();
        this.type = type;

        /**
         * The variant of the pipe, different variants do not connect
         * @type {string}
         */
        this.variant = variant;

        /**
         * @type {import("../systems/pipe").PipeNetwork}
         */
        this.linkedNetwork = null;

        this.pressureFriction = pressureFriction;

        this.distance = [];
    }

    get localPressure() {
        let costs = 0;
        for (let j = 0; j < this.distance.length; j++) {
            costs += this.distance[j];
        }
        return this.linkedNetwork.currentPressure - costs;
    }
}
