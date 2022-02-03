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
     * @param {number=} param0.volume
     */
    constructor({
        type = enumPipeType.forward,
        variant = defaultBuildingVariant,
        pressureFriction = 0.2,
        volume = 30,
    }) {
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
        this.volume = volume;

        this.distance = [];
    }

    get localPressure() {
        if (this.linkedNetwork) {
            let costs = 0;
            for (let j = 0; j < this.distance.length; j++) {
                costs += this.distance[j];
            }
            const pressure = this.linkedNetwork.currentPressure - costs;
            return pressure < 0 ? 0 : pressure;
        }

        return 0;
    }
}
