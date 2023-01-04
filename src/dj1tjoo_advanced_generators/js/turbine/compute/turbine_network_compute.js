import { arrayAllDirections } from "shapez/core/vector";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { TurbineComponent } from "../../components/turbine";
import { config } from "../../config";
import { TurbineNetwork } from "../turbine_network";
import { findSurroundingTargets } from "./turbine_network_find_surrouding";

/**
 *
 * @param {import("shapez/game/root").GameRoot} root
 * @param {import("shapez/game/entity").Entity[]} turbines
 * @returns {import("../turbine_network").TurbineNetwork[]}
 */
export function computeTurbineNetworks(root, turbines) {
    const networks = [];

    for (const entity of turbines) {
        /** @type {TurbineComponent}*/
        const turbineComp = entity.components["Turbine"];
        delete turbineComp.linkedNetwork;
        turbineComp.linkedNetwork = null;
    }

    // Create networks from controllers
    for (const controller of turbines.filter(
        x => x.components.StaticMapEntity.getVariant() === defaultBuildingVariant
    )) {
        /** @type {TurbineComponent}*/
        const turbineComp = controller.components["Turbine"];
        if (turbineComp.linkedNetwork !== null) {
            continue;
        }

        const currentNetwork = new TurbineNetwork();
        networks.push(currentNetwork);

        computeTurbineNetwork(root, controller, currentNetwork);
    }

    return networks;
}

/**
 * Computes the network from a controller starting point
 * @param {import("shapez/game/root").GameRoot} root
 * @param {import("shapez/game/entity").Entity} controller
 * @param {TurbineNetwork} currentNetwork
 */
function computeTurbineNetwork(root, controller, currentNetwork) {
    /**
     * @type {import("shapez/game/entity").Entity[]}
     */
    const entitiesToProcess = [controller];
    while (entitiesToProcess.length > 0) {
        const currentEntity = entitiesToProcess.shift();

        /** @type {TurbineComponent}*/
        const turbineComp = currentEntity.components["Turbine"];

        if (turbineComp.linkedNetwork) {
            continue;
        }

        turbineComp.linkedNetwork = currentNetwork;
        currentNetwork.parts.push(currentEntity);

        // Add new entities
        entitiesToProcess.push(
            ...findSurroundingTargets(
                root,
                currentEntity.components.StaticMapEntity.getTileSpaceBounds(),
                null,
                arrayAllDirections
            )
        );
    }
}
