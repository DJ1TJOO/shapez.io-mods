let energyUidCounter = 0;
export class EnergyNetwork {
    constructor() {
        /**
         * Who contributes to this network
         * @type {{ entity: import("shapez/savegame/savegame_typedefs").Entity, slot: import("../components/energy_pin").EnergyPinSlot }[]} */
        this.providers = [];

        /**
         * Who takes values from this network
         * @type {Array<{ entity: import("shapez/savegame/savegame_typedefs").Entity, slot: import("../components/energy_pin").EnergyPinSlot }>} */
        this.consumers = [];

        this.currentVolume = 0;
        this.currentThroughput = 0;

        /**
         * All connectors in the network
         * @type {(
         *      import("shapez/game/entity").Entity & {
         *      components: import("shapez/game/entity_components").EntityComponentStorage & {
         *          EnergyConnector?: import("../components/energy_connector").EnergyConnectorComponent
         *      }
         * })[]}
         */
        this.connectors = [];

        /**
         * All tunnels in the network
         * @type {(
         *      import("shapez/game/entity").Entity & {
         *      components: import("shapez/game/entity_components").EntityComponentStorage & {
         *          EnergyTunnel?: import("../components/energy_tunnel").EnergyTunnelComponent
         *      }
         * })[]}
         */
        this.tunnels = [];

        /**
         * All connected slots
         * @type {Array<{ entity: import("shapez/game/entity").Entity, slot: import("../components/energy_pin").EnergyPinSlot }>}
         */
        this.allSlots = [];

        /**
         * Unique network identifier
         * @type {number}
         */
        this.uid = ++energyUidCounter;
    }

    /**
     * @returns { number } The max energy that is able to be transfered in the network with in a tick, limited by the weakest link
     */
    get maxThoughput() {
        return (
            Math.min(
                ...this.connectors.map(x => x.components.EnergyConnector.maxThroughputPerTick),
                ...this.tunnels.flatMap(x =>
                    x.components.EnergyTunnel.slots
                        .filter(x => x.linkedNetwork === this)
                        .map(x => x.maxThroughputPerTick)
                )
            ) * Math.max(this.providers.length, this.consumers.length)
        );
    }

    /**
     * @returns { number } The max energy that is able to be stored in the network
     */
    get maxVolume() {
        return (
            this.connectors.reduce(
                (maxVolume, entity) => maxVolume + entity.components["EnergyConnector"].maxEnergyVolume,
                0
            ) +
            this.tunnels.reduce(
                (maxVolume, entity) =>
                    maxVolume +
                    entity.components.EnergyTunnel.slots
                        .filter(x => x.linkedNetwork === this)
                        .reduce((total, x) => total + x.maxEnergyVolume, 0),
                0
            )
        );
    }
}
