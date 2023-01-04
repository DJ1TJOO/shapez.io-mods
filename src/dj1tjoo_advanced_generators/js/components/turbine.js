import { Component } from "shapez/game/component";

export class TurbineComponent extends Component {
    static getId() {
        return "Turbine";
    }

    constructor() {
        super();
        /**
         * @type {import("../turbine/turbine_network").TurbineNetwork}
         */
        this.linkedNetwork = null;
        /**
         * @type {import("../turbine/turbine_network").TurbineNetwork}
         */
        this.oldNetwork = null;
    }
}
