import { Component } from "shapez/game/component";
import { types } from "shapez/savegame/serialization";
import { BaseFluid, typeFluidSingleton } from "../base_fluid";

export class PumpComponent extends Component {
    static getId() {
        return "Pump";
    }

    static getSchema() {
        return {
            pressure: types.uint,
            fluid: types.nullable(typeFluidSingleton),
        };
    }

    /**
     * Copy the current state to another component
     * @param {PumpComponent} otherComponent
     */
    copyAdditionalStateTo(otherComponent) {
        otherComponent.pressure = this.pressure;
        otherComponent.fluid = this.fluid;
    }

    /**
     *
     * @param {object} param0
     * @param {Number} param0.pressure The pressure to store
     * @param {BaseFluid=} param0.fluid The fluid to store
     */
    constructor({ pressure = 0, fluid = null }) {
        super();
        this.pressure = pressure;
        this.fluid = fluid;
    }
}
