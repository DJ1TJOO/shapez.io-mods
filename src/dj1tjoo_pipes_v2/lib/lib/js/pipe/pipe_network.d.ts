/// <reference path="../../../types.d.ts" />
export class PipeNetwork {
    /**
     * Who contributes to this network
     * @type {{ entity: import("shapez/savegame/savegame_typedefs").Entity, slot: import("../components/pipe_pin").PipePinSlot }[]} */
    providers: {
        entity: import("shapez/savegame/savegame_typedefs").Entity;
        slot: import("../components/pipe_pin").PipePinSlot;
    }[];
    /**
     * Who takes values from this network
     * @type {Array<{ entity: import("shapez/savegame/savegame_typedefs").Entity, slot: import("../components/pipe_pin").PipePinSlot }>} */
    consumers: {
        entity: import("shapez/savegame/savegame_typedefs").Entity;
        slot: import("../components/pipe_pin").PipePinSlot;
    }[];
    currentVolume: number;
    currentThroughput: number;
    /** @type {BaseFluid | null} */
    currentFluid: BaseFluid | null;
    /**
     * All connectors in the network
     * @type {(
     *      import("shapez/game/entity").Entity & {
     *      components: import("shapez/game/entity_components").EntityComponentStorage & {
     *          PipeConnector?: import("../components/pipe_connector").PipeConnectorComponent
     *      }
     * })[]}
     */
    connectors: (import("shapez/game/entity").Entity & {
        components: import("shapez/game/entity_components").EntityComponentStorage & {
            PipeConnector?: import("../components/pipe_connector").PipeConnectorComponent;
        };
    })[];
    /**
     * All connected slots
     * @type {Array<{ entity: import("shapez/game/entity").Entity, slot: import("../components/pipe_pin").PipePinSlot }>}
     */
    allSlots: {
        entity: import("shapez/game/entity").Entity;
        slot: import("../components/pipe_pin").PipePinSlot;
    }[];
    /**
     * Unique network identifier
     * @type {number}
     */
    uid: number;
    /**
     * @returns { number } The max fluid that is able to be transfered in the network with in a tick, limited by the weakest link
     */
    get maxThoughput(): number;
    /**
     * @returns { number } The max fluid that is able to be stored in the network
     */
    get maxVolume(): number;
    /**
     * Returns if network can hold pipe
     * @param {number} volume
     * @returns Can add volume
     */
    canAdd(volume: number): boolean;
    /**
     * Returns if network has the pipe
     * @param {number} volume
     * @returns Can remove volume
     */
    canRemove(volume: number): boolean;
}
import { BaseFluid } from "../items/base_fluid";
