import { arrayAllDirections } from "shapez/core/vector";
import { PipeConnectorComponent } from "../../components/pipe_connector";
import { enumPinSlotType } from "../../components/pipe_pin";
import { PipeNetwork } from "../pipe_network";
import { findSurroundingTargets } from "./pipe_network_find_surrouding";

/**
 * Recomputes the pipe networks and returns them
 * @param {import("shapez/game/root").GameRoot} root
 * @param {import("shapez/game/entity").Entity[]} pinEntities
 * @param {import("shapez/game/entity").Entity[]} connectors
 * @param {import("shapez/game/entity").Entity[]} tunnels
 * @returns {PipeNetwork[]}
 */
export function computePipeNetworks(root, pinEntities, connectors, tunnels) {
    const networks = [];

    // Remove current references and store them in the old network
    for (const entity of pinEntities) {
        /** @type {import("../../components/pipe_pin").PipePinComponent}*/
        const pinComp = entity.components["PipePin"];
        for (let i = 0; i < pinComp.slots.length; i++) {
            const slot = pinComp.slots[i];
            slot.oldNetwork = slot.linkedNetwork;
            slot.linkedNetwork = null;
        }
    }

    for (const entity of tunnels) {
        /** @type {import("../../components/pipe_tunnel").PipeTunnelComponent}*/
        const tunnelComp = entity.components["PipeTunnel"];
        for (let i = 0; i < tunnelComp.slots.length; i++) {
            const slot = tunnelComp.slots[i];
            slot.oldNetwork = slot.linkedNetwork;
            slot.linkedNetwork = null;
        }
    }

    for (const entity of connectors) {
        /** @type {PipeConnectorComponent}*/
        const pipeComp = entity.components["PipeConnector"];
        pipeComp.oldNetwork = pipeComp.linkedNetwork;
        pipeComp.linkedNetwork = null;
    }

    // Create networks from connectors
    for (const connector of connectors) {
        /** @type {PipeConnectorComponent}*/
        const pipeComp = connector.components["PipeConnector"];
        if (pipeComp.linkedNetwork !== null) {
            continue;
        }

        // This is a grossly simplified version of WireNetwork.prototype.recomputeWiresNetwork()
        // https://github.com/tobspr-games/shapez.io/blob/master/src/js/game/systems/wire.js#L155

        const currentNetwork = new PipeNetwork();
        networks.push(currentNetwork);

        computePipeNetwork(root, connector, currentNetwork);
        if (
            currentNetwork.currentFluid === null ||
            (pipeComp.oldNetwork && !currentNetwork.currentFluid.equals(pipeComp.oldNetwork.currentFluid))
        ) {
            currentNetwork.currentVolume = 0;
        }
    }

    return networks;
}

/**
 * Computes the network from a connector starting point
 * @param {import("shapez/game/root").GameRoot} root
 * @param {import("shapez/game/entity").Entity} connector
 * @param {PipeNetwork} currentNetwork
 */
function computePipeNetwork(root, connector, currentNetwork) {
    /** @type {PipeConnectorComponent}*/
    const connectorPipeComp = connector.components["PipeConnector"];

    /**
     * Once we occur a connector, we store its variant so we don't connect to
     * mismatching ones
     * @type {string}
     */
    const typeMask = connectorPipeComp.type;

    /**
     * @type {{
     *  entity: import("shapez/game/entity").Entity,
     *  slot: import("../../components/pipe_pin").PipePinSlot | null
     *  tunnelSlot: import("../../components/pipe_tunnel").PipeTunnelSlot | null
     * }[]}
     */
    const entitiesToProcess = [{ entity: connector, slot: null, tunnelSlot: null }];
    while (entitiesToProcess.length > 0) {
        const current = entitiesToProcess.shift();
        const currentEntity = current.entity;
        const currentSlot = current.slot;
        const currentTunnelSlot = current.tunnelSlot;

        if (
            currentSlot?.linkedNetwork ||
            currentTunnelSlot?.linkedNetwork ||
            currentEntity.components["PipeConnector"]?.linkedNetwork
        ) {
            continue;
        }

        let newSearchDirections = [];
        let newSearchTile = null;

        if (currentEntity.components["PipePin"]) {
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

        if (currentEntity.components["PipeConnector"]) {
            /** @type {PipeConnectorComponent}*/
            const pipeComp = currentEntity.components["PipeConnector"];

            if (pipeComp.type === typeMask) {
                currentNetwork.connectors.push(currentEntity);

                // Divide remaining evenly between old and new network
                if (
                    pipeComp.oldNetwork &&
                    (currentNetwork.currentFluid === null ||
                        pipeComp.oldNetwork.currentFluid.equals(currentNetwork.currentFluid))
                ) {
                    const oldNetworkCharge =
                        pipeComp.oldNetwork.currentVolume / pipeComp.oldNetwork.maxVolume;
                    const localCharge = pipeComp.maxPipeVolume * oldNetworkCharge;

                    currentNetwork.currentVolume += localCharge;
                    delete pipeComp.oldNetwork;
                }

                pipeComp.linkedNetwork = currentNetwork;

                // Get direction
                if (pipeComp.direction) {
                    newSearchDirections = [
                        currentEntity.components.StaticMapEntity.localDirectionToWorld(
                            pipeComp.direction.from
                        ),
                        currentEntity.components.StaticMapEntity.localDirectionToWorld(pipeComp.direction.to),
                    ];
                } else {
                    newSearchDirections = arrayAllDirections;
                }
            }
        }
        if (currentEntity.components["PipeTunnel"]) {
            if (currentTunnelSlot.type === typeMask) {
                // Register on the network
                currentNetwork.tunnels.push(currentEntity);

                // Divide remaining evenly between old and new network
                if (currentTunnelSlot.oldNetwork) {
                    const oldNetworkCharge =
                        currentTunnelSlot.oldNetwork.currentVolume / currentTunnelSlot.oldNetwork.maxVolume;
                    const localCharge = currentTunnelSlot.maxPipeVolume * oldNetworkCharge;

                    currentNetwork.currentVolume += localCharge;
                    delete currentTunnelSlot.oldNetwork;
                }

                currentTunnelSlot.linkedNetwork = currentNetwork;

                // Add new entities
                entitiesToProcess.push(
                    ...findSurroundingTargets(
                        root,
                        currentEntity.components.StaticMapEntity.getTileSpaceBounds(),
                        currentEntity.components.StaticMapEntity.localTileToWorld(currentTunnelSlot.pos),
                        [
                            currentEntity.components.StaticMapEntity.localDirectionToWorld(
                                currentTunnelSlot.direction
                            ),
                        ],
                        typeMask,
                        currentNetwork,
                        currentEntity
                    )
                );
            }
        } else {
            // Add new entities
            entitiesToProcess.push(
                ...findSurroundingTargets(
                    root,
                    currentEntity.components.StaticMapEntity.getTileSpaceBounds(),
                    newSearchTile,
                    newSearchDirections,
                    typeMask,
                    currentNetwork,
                    null
                )
            );
        }
    }
}
