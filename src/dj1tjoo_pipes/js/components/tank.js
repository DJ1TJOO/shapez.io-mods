import { Component } from "shapez/game/component";
import { types } from "shapez/savegame/serialization";
import { typeFluidSingleton } from "../base_fluid";

export class TankComponent extends Component {
    static getId() {
        return "Tank";
    }

    static getSchema() {
        return {
            volume: types.uint,
            pressure: types.uint,
            fluid: types.nullable(typeFluidSingleton),
            maxVolume: types.uint,
        };
    }

    /**
     * Copy the current state to another component
     * @param {TankComponent} otherComponent
     */
    copyAdditionalStateTo(otherComponent) {
        otherComponent.maxVolume = this.maxVolume;
        otherComponent.volume = this.volume;
        otherComponent.fluid = this.fluid;
        otherComponent.pressure = this.pressure;
    }

    /**
     *
     * @param {object} param0
     * @param {Number} param0.maxVolume The max volume to store
     */
    constructor({ maxVolume }) {
        super();
        this.pressure = 0;
        this.volume = 0;
        this.fluid = null;
        this.maxVolume = maxVolume;
    }
}
