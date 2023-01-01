import { round2Digits } from "shapez/core/utils";
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
            !this.root.camera.getIsMapOverlayActive() &&
            entity.components["EnergyConnector"] &&
            !this.root.logic.getIsEntityIntersectedWithMatrix(entity, worldPos)
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

        const x = mousePos.x + 40;
        const y = mousePos.y + 10;

        const ctx = /** @type {CanvasRenderingContext2D & {beginRoundedRect: beginRoundedRect}} */ (
            parameters.context
        );

        if (networks.length === 1) {
            const network = networks[0];

            ctx.fillStyle = "#64666Ebb";
            ctx.strokeStyle = "#64666Ebb";

            const throughputText = T.advaned_generators.throughput
                .replace("<x>", round2Digits(network.currentThroughput))
                .replace("<y>", round2Digits(network.maxThoughput));
            const throughputMetrics = ctx.measureText(throughputText);
            const throughputHeight =
                throughputMetrics.actualBoundingBoxAscent + throughputMetrics.actualBoundingBoxDescent;
            const throughputWidth = throughputMetrics.width;

            const volumeText = T.advaned_generators.volume
                .replace("<x>", round2Digits(network.currentVolume))
                .replace("<y>", round2Digits(network.maxVolume));
            const volumeMetrics = ctx.measureText(volumeText);
            const volumeHeight =
                volumeMetrics.actualBoundingBoxAscent + volumeMetrics.actualBoundingBoxDescent;
            const volumeWidth = volumeMetrics.width;

            const infoWidth = Math.max(throughputWidth, volumeWidth);
            const infoHeight = throughputHeight + 5 + volumeHeight;

            ctx.beginPath();
            ctx.beginRoundedRect(x, y, infoWidth + 20, infoHeight + 20, 5);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();

            ctx.textBaseline = "top";

            const innerX = x + 10;
            const innerY = y + 10;
            ctx.fillStyle = "#fff";
            ctx.fillText(throughputText, innerX, innerY);
            ctx.fillText(volumeText, innerX, innerY + 2 + throughputHeight);

            ctx.textBaseline = "alphabetic";
        }
    }

    /**
     * Returns all energy networks this entity participates in on the given tile
     * @param {import("shapez/game/entity").Entity} entity
     * @param {import("shapez/core/vector").Vector} tile
     * @returns {Array<import("@dj1tjoo/shapez-advanced-energy/lib/js/energy/energy_network").EnergyNetwork>|null} Null if the entity is never able to be connected at the given tile
     */
    getEntityNetworks(entity, tile) {
        let canConnectAtAll = false;

        /** @type {Set<import("@dj1tjoo/shapez-advanced-energy/lib/js/energy/energy_network").EnergyNetwork>} */
        const networks = new Set();

        const staticComp = entity.components.StaticMapEntity;

        /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_connector").EnergyConnectorComponent} */
        const connectorComp = entity.components["EnergyConnector"];
        if (connectorComp) {
            canConnectAtAll = true;
            if (connectorComp.linkedNetwork) {
                networks.add(connectorComp.linkedNetwork);
            }
        }

        /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent} */
        const pinsComp = entity.components["EnergyPin"];
        if (pinsComp) {
            const slots = pinsComp.slots;
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
