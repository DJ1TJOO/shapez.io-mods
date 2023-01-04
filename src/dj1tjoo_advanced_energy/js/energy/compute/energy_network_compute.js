import { arrayAllDirections } from "shapez/core/vector";
import { EnergyConnectorComponent } from "../../components/energy_connector";
import { enumPinSlotType } from "../../components/energy_pin";
import { EnergyNetwork } from "../energy_network";
import { findSurroundingTargets } from "./energy_network_find_surrouding";

/**
 * Recomputes the energy networks and returns them
 * @param {import("shapez/game/root").GameRoot} root
 * @param {import("shapez/game/entity").Entity[]} pinEntities
 * @param {import("shapez/game/entity").Entity[]} connectors
 * @returns {EnergyNetwork[]}
 */
export function computeEnergyNetworks(root, pinEntities, connectors) {
    const networks = [];

    // Remove current references and store them in the old network
    for (const entity of pinEntities) {
        /** @type {import("../../components/energy_pin").EnergyPinComponent}*/
        const pinComp = entity.components["EnergyPin"];
        for (let i = 0; i < pinComp.slots.length; i++) {
            const slot = pinComp.slots[i];
            slot.oldNetwork = slot.linkedNetwork;
            slot.linkedNetwork = null;
        }
    }

    for (const entity of connectors) {
        /** @type {EnergyConnectorComponent}*/
        const energyComp = entity.components["EnergyConnector"];
        energyComp.oldNetwork = energyComp.linkedNetwork;
        energyComp.linkedNetwork = null;
    }

    // Create networks from connectors
    for (const connector of connectors) {
        /** @type {EnergyConnectorComponent}*/
        const energyComp = connector.components["EnergyConnector"];
        if (energyComp.linkedNetwork !== null) {
            continue;
        }

        // This is a grossly simplified version of WireNetwork.prototype.recomputeWiresNetwork()
        // https://github.com/tobspr-games/shapez.io/blob/master/src/js/game/systems/wire.js#L155

        const currentNetwork = new EnergyNetwork();
        networks.push(currentNetwork);

        computeEnergyNetwork(root, connector, currentNetwork);
    }

    return networks;
}

/**
 * Computes the network from a connector starting point
 * @param {import("shapez/game/root").GameRoot} root
 * @param {import("shapez/game/entity").Entity} connector
 * @param {EnergyNetwork} currentNetwork
 */
function computeEnergyNetwork(root, connector, currentNetwork) {
    /** @type {EnergyConnectorComponent}*/
    const connectorEnergyComp = connector.components["EnergyConnector"];

    /**
     * Once we occur a connector, we store its variant so we don't connect to
     * mismatching ones
     * @type {string}
     */
    const typeMask = connectorEnergyComp.type;

    /**
     * @type {{
     *  entity: import("shapez/game/entity").Entity,
     *  slot: import("../../components/energy_pin").EnergyPinSlot | null
     * }[]}
     */
    const entitiesToProcess = [{ entity: connector, slot: null }];
    while (entitiesToProcess.length > 0) {
        const current = entitiesToProcess.shift();
        const currentEntity = current.entity;
        const currentSlot = current.slot;

        if (currentSlot?.linkedNetwork || currentEntity.components["EnergyConnector"]?.linkedNetwork) {
            continue;
        }

        let newSearchDirections = [];
        let newSearchTile = null;

        if (currentEntity.components["EnergyPin"]) {
            if (currentSlot.type === enumPinSlotType.ejector) {
                currentNetwork.providers.push({ entity: currentEntity, slot: currentSlot });
            } else if (currentSlot.type === enumPinSlotType.acceptor) {
                currentNetwork.consumers.push({ entity: currentEntity, slot: currentSlot });
            } else {
                assertAlways(false, "unknown slot type:" + currentSlot.type);
            }

            // Register on the network
            currentNetwork.allSlots.push({ entity: currentEntity, slot: currentSlot });
            currentSlot.linkedNetwork = currentNetwork;

            // Specify where to search next
            newSearchDirections = [
                currentEntity.components.StaticMapEntity.localDirectionToWorld(currentSlot.direction),
            ];
            newSearchTile = currentEntity.components.StaticMapEntity.localTileToWorld(currentSlot.pos);

            delete currentSlot.oldNetwork;
        }

        if (currentEntity.components["EnergyConnector"]) {
            /** @type {EnergyConnectorComponent}*/
            const energyComp = currentEntity.components["EnergyConnector"];

            if (energyComp.type === typeMask) {
                currentNetwork.connectors.push(currentEntity);

                // Divide remaining evenly between old and new network
                if (energyComp.oldNetwork) {
                    const oldNetworkCharge =
                        energyComp.oldNetwork.currentVolume / energyComp.oldNetwork.maxVolume;
                    const localCharge = energyComp.maxEnergyVolume * oldNetworkCharge;

                    currentNetwork.currentVolume += localCharge;
                    delete energyComp.oldNetwork;
                }

                energyComp.linkedNetwork = currentNetwork;

                // Get direction
                if (energyComp.direction) {
                    newSearchDirections = [
                        currentEntity.components.StaticMapEntity.localDirectionToWorld(
                            energyComp.direction.from
                        ),
                        currentEntity.components.StaticMapEntity.localDirectionToWorld(
                            energyComp.direction.to
                        ),
                    ];
                } else {
                    newSearchDirections = arrayAllDirections;
                }
            }
        }

        // Add new entities
        entitiesToProcess.push(
            ...findSurroundingTargets(
                root,
                currentEntity.components.StaticMapEntity.getTileSpaceBounds(),
                newSearchTile,
                newSearchDirections,
                typeMask
            )
        );
    }
}
