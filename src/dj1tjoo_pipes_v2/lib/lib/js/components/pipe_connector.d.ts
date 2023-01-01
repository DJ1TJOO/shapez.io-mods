/// <reference path="../../../types.d.ts" />
export class PipeConnectorComponent extends Component {
    /**
     * @param {object} param0
     * @param {number=} param0.maxPipeVolume The max pipe that this building can store
     * @param {number=} param0.maxThroughputPerTick The max pipe that is able to be transfered in the network with in a tick
     * @param {string=} param0.type The type of connectors it can link to
     * @param {{from: import("shapez/core/vector").enumDirection, to: import("shapez/core/vector").enumDirection}=} param0.direction The directions the connector is able to input and output from
     */
    constructor({ maxPipeVolume, maxThroughputPerTick, type, direction }: {
        maxPipeVolume?: number | undefined;
        maxThroughputPerTick?: number | undefined;
        type?: string | undefined;
        direction?: {
            from: import("shapez/core/vector").enumDirection;
            to: import("shapez/core/vector").enumDirection;
        } | undefined;
    });
    maxPipeVolume: number;
    maxThroughputPerTick: number;
    type: string;
    direction: {
        from: import("shapez/core/vector").enumDirection;
        to: import("shapez/core/vector").enumDirection;
    };
    /**
     * @type {import("../pipe/pipe_network").PipeNetwork}
     */
    linkedNetwork: import("../pipe/pipe_network").PipeNetwork;
    /**
     * @type {import("../pipe/pipe_network").PipeNetwork}
     */
    oldNetwork: import("../pipe/pipe_network").PipeNetwork;
    get pipeVolume(): number;
}
import { Component } from "shapez/game/component";
