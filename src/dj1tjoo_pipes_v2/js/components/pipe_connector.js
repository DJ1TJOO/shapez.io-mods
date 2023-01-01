import { Component } from "shapez/game/component";

export class PipeConnectorComponent extends Component {
    static getId() {
        return "PipeConnector";
    }

    /**
     * @param {object} param0
     * @param {number=} param0.maxPipeVolume The max pipe that this building can store
     * @param {number=} param0.maxThroughputPerTick The max pipe that is able to be transfered in the network with in a tick
     * @param {string=} param0.type The type of connectors it can link to
     * @param {{from: import("shapez/core/vector").enumDirection, to: import("shapez/core/vector").enumDirection}=} param0.direction The directions the connector is able to input and output from
     */
    constructor({ maxPipeVolume = 30, maxThroughputPerTick = 50, type = "default", direction = null }) {
        super();
        this.maxPipeVolume = maxPipeVolume;
        this.maxThroughputPerTick = maxThroughputPerTick;
        this.type = type;
        this.direction = direction;
        /**
         * @type {import("../pipe/pipe_network").PipeNetwork}
         */
        this.linkedNetwork = null;
        /**
         * @type {import("../pipe/pipe_network").PipeNetwork}
         */
        this.oldNetwork = null;

        this.maxPipeVolume = maxPipeVolume;
    }

    get pipeVolume() {
        if (!this.linkedNetwork) {
            return 0;
        }

        return this.maxPipeVolume * (this.linkedNetwork.currentVolume / this.linkedNetwork.maxVolume);
    }
}
