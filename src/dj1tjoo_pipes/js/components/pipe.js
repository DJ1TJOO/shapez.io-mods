import { Component } from "shapez/game/component";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { types } from "shapez/savegame/serialization";

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

    static getSchema() {
        return {
            volume: types.uint,
        };
    }

    /**
     * @param {object} param0
     * @param {enumPipeType=} param0.type
     * @param {string=} param0.variant
     * @param {number=} param0.pressureFriction
     * @param {number=} param0.maxVolume
     * @param {number=} param0.maxPressure
     */
    constructor({
        type = enumPipeType.forward,
        variant = defaultBuildingVariant,
        pressureFriction = 0.2,
        maxVolume = 30,
        maxPressure = 100,
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
        this.maxPressure = maxPressure;
        this.maxVolume = maxVolume;
        this.volume = 0;

        this.distance = [];
    }

    get localPressure() {
        if (this.linkedNetwork) {
            let costs = 0;
            for (let j = 0; j < this.distance.length; j++) {
                costs += this.distance[j];
            }
            const pressure = this.linkedNetwork.currentPressure - costs;
            return pressure < 0 ? 0 : pressure > this.maxPressure ? this.maxPressure : pressure;
        }

        return 0;
    }
}
