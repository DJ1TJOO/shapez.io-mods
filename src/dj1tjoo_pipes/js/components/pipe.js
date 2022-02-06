import { Component } from "shapez/game/component";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { types } from "shapez/savegame/serialization";
import { typeFluidSingleton } from "../base_fluid";

/**
 * @param {String} color
 * @param {number} percent
 * @returns
 */
function shadeColor(color, percent) {
    var R = parseInt(color.substring(1, 3), 16);
    var G = parseInt(color.substring(3, 5), 16);
    var B = parseInt(color.substring(5, 7), 16);

    // @ts-ignore
    R = parseInt((R * (100 + percent)) / 100);
    // @ts-ignore
    G = parseInt((G * (100 + percent)) / 100);
    // @ts-ignore
    B = parseInt((B * (100 + percent)) / 100);

    R = R < 255 ? R : 255;
    G = G < 255 ? G : 255;
    B = B < 255 ? B : 255;

    var RR = R.toString(16).length == 1 ? "0" + R.toString(16) : R.toString(16);
    var GG = G.toString(16).length == 1 ? "0" + G.toString(16) : G.toString(16);
    var BB = B.toString(16).length == 1 ? "0" + B.toString(16) : B.toString(16);

    return "#" + RR + GG + BB;
}

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
            fluid: types.nullable(typeFluidSingleton),
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
        this.fluid = null;

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

    localFluidColor(fluid) {
        const colorPercentage = 1 - (this.localPressure / this.maxPressure) * (this.volume / this.maxVolume);
        return shadeColor(fluid.getBackgroundColorAsResource(), colorPercentage * 1.2 * 100);
    }
}
