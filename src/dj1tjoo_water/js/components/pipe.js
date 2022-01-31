import { Component } from "shapez/game/component";

/** @enum {string} */
export const enumPipeType = {
    forward: "forward",
    turn: "turn",
    split: "split",
    cross: "cross",
};

/** @enum {string} */
export const enumPipeVariant = {
    pipe: "pipe",
    industrial: "industrial",
};

export class PipeComponent extends Component {
    static getId() {
        return "Pipe";
    }

    /**
     * @param {object} param0
     * @param {enumPipeType=} param0.type
     * @param {enumPipeVariant=} param0.variant
     */
    constructor({ type = enumPipeType.forward, variant = enumPipeVariant.pipe }) {
        super();
        this.type = type;

        /**
         * The variant of the pipe, different variants do not connect
         * @type {enumPipeVariant}
         */
        this.variant = variant;

        /**
         * @type {import("../systems/pipe").PipeNetwork}
         */
        this.linkedNetwork = null;

        this.distance = -1;
    }

    get localPressure() {
        return this.linkedNetwork.currentPressure - this.distance * this.linkedNetwork.pipeCosts;
    }
}
