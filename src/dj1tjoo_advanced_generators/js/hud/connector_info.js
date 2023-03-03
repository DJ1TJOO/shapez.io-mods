import { BaseHUDPart } from "shapez/game/hud/base_hud_part";
import { T } from "shapez/translations";
import { config } from "../config";

/**
 * @typedef {(x: number, y: number, w: number, h: number, r: number)=> void} beginRoundedRect
 */

export class HUDConnectorInfo extends BaseHUDPart {
    initialize() {}

    /**
     *
     * @param {import("shapez/core/draw_utils").DrawParameters} parameters
     */
    drawOverlays(parameters) {
        if (this.root.currentLayer !== "regular") {
            // Not in the regular layer
            return;
        }

        const mousePos = this.root.app.mousePosition;
        if (!mousePos) {
            // No mouse
            return;
        }

        const worldPos = this.root.camera.screenToWorld(mousePos);
        const tile = worldPos.toTileSpace();
        const entity = this.root.map.getLayerContentXY(tile.x, tile.y, "regular");

        if (!entity) {
            // No entity
            return;
        }

        if (
            this.root.camera.getIsMapOverlayActive() ||
            ((entity.components["EnergyConnector"] || entity.components["PipeConnector"]) &&
                !this.root.logic.getIsEntityIntersectedWithMatrix(entity, worldPos))
        ) {
            // Detailed intersection check
            return;
        }

        const networks = this.getEntityNetworks(entity, tile);
        if (networks === null) {
            // This entity will never be able to be connected
            return;
        }

        const x = mousePos.x + 10;
        let y = mousePos.y + 10;

        const ctx = /** @type {CanvasRenderingContext2D & {beginRoundedRect: beginRoundedRect}} */ (
            parameters.context
        );

        if (networks.turbines.length > 0 && !networks.turbines[0].isValid) {
            ctx.fillStyle = "#64666Ebb";
            ctx.strokeStyle = "#64666Ebb";

            const network = networks.turbines[0];
            const localConfig = config().turbine;

            const messages = [];
            if (!network.hasSufficientControllers()) {
                messages.push(T.advanced_generators.turbine.maxController.replace("<x>", 1));
            }
            if (!network.hasSufficientEnergyOutlets()) {
                messages.push(
                    T.advanced_generators.turbine.maxEnergyOutlet.replace(
                        "<x>",
                        localConfig.maxConnections.energy_outlet
                    )
                );
            }
            if (!network.hasSufficientFuelIntakes()) {
                messages.push(
                    T.advanced_generators.turbine.maxFuelIntake.replace(
                        "<x>",
                        localConfig.maxConnections.fuel_intake
                    )
                );
            }
            if (!network.hasSufficientSteamIntakes()) {
                messages.push(
                    T.advanced_generators.turbine.maxSteamIntake.replace(
                        "<x>",
                        localConfig.maxConnections.steam_intake
                    )
                );
            }
            if (!network.fitsInMaxArea()) {
                messages.push(T.advanced_generators.turbine.maxArea.replace("<x>", localConfig.maxArea));
            }

            const metrics = messages.map(x => ctx.measureText(x));
            const width = Math.max(...metrics.map(x => x.width));
            const height =
                metrics.reduce((total, x) => total + x.fontBoundingBoxAscent + x.fontBoundingBoxDescent, 0) +
                (messages.length - 1) * 2;

            ctx.beginPath();
            ctx.beginRoundedRect(x, y, width + 20, height + 20, 5);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();

            ctx.textBaseline = "top";

            const innerX = x + 10;
            let innerY = y + 10;
            ctx.fillStyle = "#ee0000";

            messages.forEach((x, i) => {
                ctx.fillText(x, innerX, innerY);
                innerY += metrics[i].fontBoundingBoxAscent + metrics[i].fontBoundingBoxDescent + 2;
            });

            ctx.textBaseline = "alphabetic";
            return;
        }

        if (networks.connectors.length === 0) {
            // No network at all
            return;
        }

        let minWidth = 0;

        for (let i = 0; i < networks.connectors.length; i++) {
            const network = networks.connectors[i];

            ctx.fillStyle = "#64666Ebb";
            ctx.strokeStyle = "#64666Ebb";

            // No fluid so no info
            if (typeof network["currentFluid"] !== "undefined" && network["currentFluid"] === null) {
                return;
            }

            const fluidText =
                typeof network["currentFluid"] === "undefined"
                    ? ""
                    : T.advanced_generators.fluid.replace(
                          "<x>",
                          T.fluids[network["currentFluid"].getFluidType()] || T.advanced_generators.noFluid
                      );

            const fluidMetrics = ctx.measureText(fluidText);
            const fluidHeight = fluidMetrics.fontBoundingBoxAscent + fluidMetrics.fontBoundingBoxDescent;
            const fluidWidth = fluidMetrics.width;

            const throughputText = (
                typeof network["currentFluid"] === "undefined"
                    ? T.advanced_generators.throughputAe
                    : T.advanced_generators.throughputL
            )
                .replace(
                    "<x>",
                    Intl.NumberFormat("en", { notation: "compact" }).format(network.currentThroughput)
                )
                .replace(
                    "<y>",
                    network.maxThoughput < 0
                        ? "Infinite"
                        : Intl.NumberFormat("en", { notation: "compact" }).format(network.maxThoughput)
                );
            const throughputMetrics = ctx.measureText(throughputText);
            const throughputHeight =
                throughputMetrics.fontBoundingBoxAscent + throughputMetrics.fontBoundingBoxDescent;
            const throughputWidth = throughputMetrics.width;

            const volumeText = (
                typeof network["currentFluid"] === "undefined"
                    ? T.advanced_generators.volumeAe
                    : T.advanced_generators.volumeL
            )
                .replace(
                    "<x>",
                    Intl.NumberFormat("en", { notation: "compact" }).format(network.currentVolume)
                )
                .replace("<y>", Intl.NumberFormat("en", { notation: "compact" }).format(network.maxVolume));
            const volumeMetrics = ctx.measureText(volumeText);
            const volumeHeight = volumeMetrics.fontBoundingBoxAscent + volumeMetrics.fontBoundingBoxDescent;
            const volumeWidth = volumeMetrics.width;

            const infoWidth = Math.max(fluidWidth, throughputWidth, volumeWidth);
            const infoHeight =
                typeof network["currentFluid"] === "undefined"
                    ? throughputHeight + 2 + volumeHeight
                    : fluidHeight + 2 + throughputHeight + 2 + volumeHeight;

            if (infoWidth > minWidth) {
                minWidth = infoWidth;
            }

            ctx.beginPath();
            ctx.beginRoundedRect(x, y, minWidth + 20, infoHeight + 20, 5);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();

            ctx.textBaseline = "top";

            const innerX = x + 10;
            const innerY = y + 10;
            ctx.fillStyle = "#fff";

            let heightY = innerY;

            if (typeof network["currentFluid"] !== "undefined") {
                ctx.fillText(fluidText, innerX, heightY);
                heightY += fluidHeight + 2;
            }
            ctx.fillText(throughputText, innerX, heightY);
            heightY += throughputHeight + 2;
            ctx.fillText(volumeText, innerX, heightY);

            ctx.textBaseline = "alphabetic";

            y += infoHeight + 20 + 10;
        }
    }

    /**
     * Returns all energy networks this entity participates in on the given tile
     * @param {import("shapez/game/entity").Entity} entity
     * @param {import("shapez/core/vector").Vector} tile
     * @returns {{turbines: Array<import("../turbine/turbine_network").TurbineNetwork>, connectors: Array<import("@dj1tjoo/shapez-advanced-energy/lib/js/energy/energy_network").EnergyNetwork| import("@dj1tjoo/shapez-pipes/lib/js/pipe/pipe_network").PipeNetwork>}|null} Null if the entity is never able to be connected at the given tile
     */
    getEntityNetworks(entity, tile) {
        let canConnectAtAll = false;

        /** @type {Set<import("@dj1tjoo/shapez-advanced-energy/lib/js/energy/energy_network").EnergyNetwork | import("@dj1tjoo/shapez-pipes/lib/js/pipe/pipe_network").PipeNetwork>} */
        const networks = new Set();

        const staticComp = entity.components.StaticMapEntity;

        /** @type {(import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_connector").EnergyConnectorComponent | import("@dj1tjoo/shapez-pipes/lib/js/components/pipe_connector").PipeConnectorComponent)[]} */
        const connectorComps = [
            entity.components["EnergyConnector"],
            entity.components["PipeConnector"],
        ].filter(Boolean);
        if (connectorComps) {
            canConnectAtAll = true;
            connectorComps.forEach(x => x.linkedNetwork && networks.add(x.linkedNetwork));
        }

        /** @type {(import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent | import("@dj1tjoo/shapez-pipes/lib/js/components/pipe_pin").PipePinComponent)[]} */
        const pinsComps = [entity.components["EnergyPin"], entity.components["PipePin"]].filter(Boolean);
        if (pinsComps) {
            const slots = pinsComps.flatMap(x => x.slots);
            for (let i = 0; i < slots.length; ++i) {
                const slot = slots[i];
                const slotLocalPos = staticComp.localTileToWorld(slot.pos);
                if (slotLocalPos.equals(tile)) {
                    canConnectAtAll = true;
                    if (slot.linkedNetwork) {
                        networks.add(slot.linkedNetwork);
                    }
                }
            }
        }

        const turbineNetworks = new Set();
        const turbineComp = entity.components["Turbine"];
        if (turbineComp && turbineComp.linkedNetwork) {
            canConnectAtAll = true;
            turbineNetworks.add(turbineComp.linkedNetwork);
        }

        if (!canConnectAtAll) {
            return null;
        }

        return {
            turbines: Array.from(turbineNetworks),
            connectors: Array.from(networks),
        };
    }
}
