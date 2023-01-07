import { BaseHUDPart } from "shapez/game/hud/base_hud_part";
import { T } from "shapez/translations";

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

        if (networks.length === 0) {
            // No network at all
            return;
        }

        const x = mousePos.x + 10;
        let y = mousePos.y + 10;

        let minWidth = 0;

        const ctx = /** @type {CanvasRenderingContext2D & {beginRoundedRect: beginRoundedRect}} */ (
            parameters.context
        );

        if (networks.length < 1) return;

        for (let i = 0; i < networks.length; i++) {
            const network = networks[i];

            ctx.fillStyle = "#64666Ebb";
            ctx.strokeStyle = "#64666Ebb";

            const fluidText =
                typeof network["currentFluid"] === "undefined"
                    ? ""
                    : T.advanced_generators.fluid.replace(
                          "<x>",
                          T.fluids[network["currentFluid"].getFluidType()]
                      );

            const fluidMetrics = ctx.measureText(fluidText);
            const fluidHeight = fluidMetrics.actualBoundingBoxAscent + fluidMetrics.actualBoundingBoxDescent;
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
                throughputMetrics.actualBoundingBoxAscent + throughputMetrics.actualBoundingBoxDescent;
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
            const volumeHeight =
                volumeMetrics.actualBoundingBoxAscent + volumeMetrics.actualBoundingBoxDescent;
            const volumeWidth = volumeMetrics.width;

            const infoWidth = Math.max(fluidWidth, throughputWidth, volumeWidth);
            const infoHeight = fluidHeight + 5 + throughputHeight + 5 + volumeHeight;

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
            ctx.fillText(fluidText, innerX, innerY);
            ctx.fillText(throughputText, innerX, innerY + 4 + fluidHeight);
            ctx.fillText(volumeText, innerX, innerY + fluidHeight + 4 + throughputHeight);

            ctx.textBaseline = "alphabetic";

            y += infoHeight + 20 + 10;
        }
    }

    /**
     * Returns all energy networks this entity participates in on the given tile
     * @param {import("shapez/game/entity").Entity} entity
     * @param {import("shapez/core/vector").Vector} tile
     * @returns {Array<import("@dj1tjoo/shapez-advanced-energy/lib/js/energy/energy_network").EnergyNetwork| import("@dj1tjoo/shapez-pipes/lib/js/pipe/pipe_network").PipeNetwork>|null} Null if the entity is never able to be connected at the given tile
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

        if (!canConnectAtAll) {
            return null;
        }

        return Array.from(networks);
    }
}
