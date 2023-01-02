import { BaseFluid } from "../items/base_fluid";

let pipeUidCounter = 0;
export class PipeNetwork {
    constructor() {
        /**
         * Who contributes to this network
         * @type {{ entity: import("shapez/savegame/savegame_typedefs").Entity, slot: import("../components/pipe_pin").PipePinSlot }[]} */
        this.providers = [];

        /**
         * Who takes values from this network
         * @type {Array<{ entity: import("shapez/savegame/savegame_typedefs").Entity, slot: import("../components/pipe_pin").PipePinSlot }>} */
        this.consumers = [];

        this.currentVolume = 0;
        this.currentThroughput = 0;
        /** @type {BaseFluid | null} */
        this.currentFluid = null;

        /**
         * All connectors in the network
         * @type {(
         *      import("shapez/game/entity").Entity & {
         *      components: import("shapez/game/entity_components").EntityComponentStorage & {
         *          PipeConnector?: import("../components/pipe_connector").PipeConnectorComponent
         *      }
         * })[]}
         */
        this.connectors = [];

        /**
         * All connected slots
         * @type {Array<{ entity: import("shapez/game/entity").Entity, slot: import("../components/pipe_pin").PipePinSlot }>}
         */
        this.allSlots = [];

        /**
         * Unique network identifier
         * @type {number}
         */
        this.uid = ++pipeUidCounter;
    }

    /**
     * @returns { number } The max fluid that is able to be transfered in the network with in a tick, limited by the weakest link
     */
    get maxThoughput() {
        return (
            Math.min(...this.connectors.map(x => x.components.PipeConnector.maxThroughputPerTick)) *
            Math.max(this.providers.length, this.consumers.length)
        );
    }

    /**
     * @returns { number } The max fluid that is able to be stored in the network
     */
    get maxVolume() {
        return this.connectors.reduce((maxVolume, entity) => {
            return maxVolume + entity.components["PipeConnector"].maxPipeVolume;
        }, 0);
    }

    /**
     * Returns if network can hold pipe
     * @param {number} volume
     * @returns Can add volume
     */
    canAdd(volume) {
        return this.currentVolume + volume <= this.maxVolume;
    }

    /**
     * Returns if network has the pipe
     * @param {number} volume
     * @returns Can remove volume
     */
    canRemove(volume) {
        return this.currentVolume - volume >= 0;
    }
}
