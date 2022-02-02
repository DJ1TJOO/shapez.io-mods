import { Component } from "shapez/game/component";
import { types } from "shapez/savegame/serialization";

export class ExtractorComponent extends Component {
    static getId() {
        return "Extractor";
    }

    static getSchema() {
        return {
            pressure: types.uint,
        };
    }

    /**
     * Copy the current state to another component
     * @param {ExtractorComponent} otherComponent
     */
    copyAdditionalStateTo(otherComponent) {
        otherComponent.pressure = this.pressure;
    }

    /**
     *
     * @param {object} param0
     * @param {Number} param0.pressure The pressure to store
     */
    constructor({ pressure = 0 }) {
        super();
        this.pressure = pressure;
    }
}
