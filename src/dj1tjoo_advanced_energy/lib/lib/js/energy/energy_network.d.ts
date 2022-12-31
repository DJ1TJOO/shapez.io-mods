/// <reference path="../../../types.d.ts" />
export class EnergyNetwork {
    /**
     * Who contributes to this network
     * @type {{ entity: import("shapez/savegame/savegame_typedefs").Entity, slot: import("../components/energy_pin").EnergyPinSlot }[]} */
    providers: {
        entity: import("shapez/savegame/savegame_typedefs").Entity;
        slot: import("../components/energy_pin").EnergyPinSlot;
    }[];
    /**
     * Who takes values from this network
     * @type {Array<{ entity: import("shapez/savegame/savegame_typedefs").Entity, slot: import("../components/energy_pin").EnergyPinSlot }>} */
    consumers: {
        entity: import("shapez/savegame/savegame_typedefs").Entity;
        slot: import("../components/energy_pin").EnergyPinSlot;
    }[];
    currentVolume: number;
    /**
     * All connectors in the network
     * @type {(
     *      import("shapez/game/entity").Entity & {
     *      components: import("shapez/game/entity_components").EntityComponentStorage & {
     *          EnergyConnector?: import("../components/energy_connector").EnergyConnectorComponent
     *      }
     * })[]}
     */
    connectors: (import("shapez/game/entity").Entity & {
        components: import("shapez/game/entity_components").EntityComponentStorage & {
            EnergyConnector?: import("../components/energy_connector").EnergyConnectorComponent;
        };
    })[];
    /**
     * All connected slots
     * @type {Array<{ entity: import("shapez/game/entity").Entity, slot: import("../components/energy_pin").EnergyPinSlot }>}
     */
    allSlots: {
        entity: import("shapez/game/entity").Entity;
        slot: import("../components/energy_pin").EnergyPinSlot;
    }[];
    /**
     * Unique network identifier
     * @type {number}
     */
    uid: number;
    /**
     * @returns { number } The max energy that is able to be transfered in the network with in a tick, limited by the weakest link
     */
    get maxThoughput(): number;
    /**
     * @returns { number } The max energy that is able to be stored in the network
     */
    get maxVolume(): number;
    /**
     * Returns if network can hold energy
     * @param {number} volume
     * @returns Can add volume
     */
    canAdd(volume: number): boolean;
    /**
     * Returns if network has the energy
     * @param {number} volume
     * @returns Can remove volume
     */
    canRemove(volume: number): boolean;
}
