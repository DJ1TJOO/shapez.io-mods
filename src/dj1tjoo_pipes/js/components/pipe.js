import { Component } from "shapez/game/component";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { types } from "shapez/savegame/serialization";
import { typeFluidSingleton } from "../base_fluid";

/**
 * @param {String} color
 * @param {number} percent
 * @returns
 */
function shadeColor(color, percent, alpha = 0) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    // @ts-ignore
    R = parseInt((R * (100 + percent)) / 100);
    // @ts-ignore
    G = parseInt((G * (100 + percent)) / 100);
    // @ts-ignore
    B = parseInt((B * (100 + percent)) / 100);

    R = R < 255 ? R : 255;
    G = G < 255 ? G : 255;
    B = B < 255 ? B : 255;

    return "rgba(" + R + "," + G + "," + B + "," + alpha + ")";
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
            volume: types.ufloat,
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
        this.pipeMaxVolume = maxVolume;
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

    get pressurePercentage() {
        let maxPressure = this.maxPressure;
        if (
            this.linkedNetwork &&
            this.linkedNetwork.currentPressure > 0 &&
            this.linkedNetwork.currentPressure < maxPressure
        ) {
            maxPressure = this.linkedNetwork.currentPressure;
        }

        return this.localPressure / maxPressure;
    }

    get maxVolume() {
        return Math.floor(this.pipeMaxVolume * this.pressurePercentage);
    }

    localFluidColor(fluid) {
        const colorPercentage = 1 - this.pressurePercentage * (this.volume / this.maxVolume);
        const alpha = 255 - Math.floor(colorPercentage * 255);

        return shadeColor(fluid.getBackgroundColorAsResource(), colorPercentage * 1.2 * 100, alpha || 0);
    }
}
