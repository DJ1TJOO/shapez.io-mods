import { Component } from "shapez/game/component";
import { types } from "shapez/savegame/serialization";

export class TankComponent extends Component {
    static getId() {
        return "Tank";
    }

    static getSchema() {
        return {
            volume: types.uint,
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
    }

    /**
     *
     * @param {object} param0
     * @param {Number} param0.maxVolume The max volume to store
     */
    constructor({ maxVolume }) {
        super();
        this.volume = 0;
        this.maxVolume = maxVolume;
    }
}
