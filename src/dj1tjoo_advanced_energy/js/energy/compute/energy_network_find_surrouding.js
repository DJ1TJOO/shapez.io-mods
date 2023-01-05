import { enumDirection, enumDirectionToVector, enumInvertedDirections, Vector } from "shapez/core/vector";
import { EnergyConnectorComponent } from "../../components/energy_connector";
import { EnergyPinComponent } from "../../components/energy_pin";
import { EnergyTunnelComponent } from "../../components/energy_tunnel";

/**
 * Finds surrounding entities which are not yet assigned to a network
 * @param {import("shapez/game/root").GameRoot} root
 * @param {import("shapez/core/draw_parameters").Rectangle} tileSpaceBounds
 * @param {Vector} initialTile
 * @param {Array<enumDirection>} directions
 * @param {string} typeMask
 * @param {import("shapez/game/entity").Entity | null} tunnel
 * @returns {Array<{
 *  entity: import("shapez/game/entity").Entity,
 *  slot: import("../../components/energy_pin").EnergyPinSlot,
 *  tunnelSlot: import("../../components/energy_tunnel").EnergyTunnelSlot
 * }>}
 */
export function findSurroundingTargets(root, tileSpaceBounds, initialTile, directions, typeMask, tunnel) {
    let result = [];

    const offsets = calculateOffsets(tileSpaceBounds, initialTile, directions);

    // Go over all directions we should search for
    for (let i = 0; i < offsets.length; ++i) {
        const { direction, initialSearchTile } = offsets[i];

        // First, find the initial connected entities
        const initialContents = root.map.getLayersContentsMultipleXY(
            initialSearchTile.x,
            initialSearchTile.y
        );

        // Link the initial tile to the initial entities, since it may change
        /** @type {Array<{entity: import("shapez/savegame/savegame_typedefs").Entity, tile: Vector}>} */
        const contents = [];
        for (let j = 0; j < initialContents.length; ++j) {
            contents.push({
                entity: initialContents[j],
                tile: initialSearchTile,
            });
        }

        for (let k = 0; k < contents.length; ++k) {
            const { entity, tile } = contents[k];

            const staticComp = entity.components.StaticMapEntity;

            /** @type {EnergyConnectorComponent} */
            const connectorComp = entity.components["EnergyConnector"];

            if (connectorComp) {
                let validDirection = true;
                if (connectorComp.direction) {
                    const connectorDirections = [
                        connectorComp.direction.from,
                        connectorComp.direction.to,
                    ].map(x => staticComp.localDirectionToWorld(x));

                    if (!connectorDirections.includes(enumInvertedDirections[direction])) {
                        validDirection = false;
                    }
                }

                if (
                    !connectorComp.linkedNetwork &&
                    (!typeMask || connectorComp.type === typeMask) &&
                    validDirection
                ) {
                    result.push({
                        entity,
                        slot: null,
                        tunnelSlot: null,
                        direction,
                    });
                }
            }

            // Check for connected slots
            /** @type {EnergyPinComponent} */
            const pinComp = entity.components["EnergyPin"];
            if (pinComp) {
                // Go over all slots and see if they are connected
                const pinSlots = pinComp.slots;
                for (let j = 0; j < pinSlots.length; ++j) {
                    const slot = pinSlots[j];

                    // Check if the position matches
                    const pinPos = staticComp.localTileToWorld(slot.pos);
                    if (!pinPos.equals(tile)) {
                        continue;
                    }

                    // Check if the direction (inverted) matches
                    const pinDirection = staticComp.localDirectionToWorld(slot.direction);
                    if (pinDirection !== enumInvertedDirections[direction]) {
                        continue;
                    }

                    if (!slot.linkedNetwork) {
                        result.push({
                            entity,
                            slot,
                            tunnelSlot: null,
                            direction,
                        });
                    }
                }

                // Pin slots mean it can be nothing else
                continue;
            }

            /** @type {EnergyTunnelComponent} */
            const tunnelComp = entity.components["EnergyTunnel"];
            if (tunnelComp) {
                // Go over all slots and see if they are connected
                const tunnelSlots = tunnelComp.slots;
                for (let j = 0; j < tunnelSlots.length; ++j) {
                    const tunnelSlot = tunnelSlots[j];

                    // Check if the position matches
                    const tunnelPos = staticComp.localTileToWorld(tunnelSlot.pos);
                    if (!tunnelPos.equals(tile)) {
                        continue;
                    }

                    // Check if the direction (inverted) matches
                    const pinDirection = staticComp.localDirectionToWorld(tunnelSlot.direction);
                    if (pinDirection !== enumInvertedDirections[direction]) {
                        continue;
                    }

                    if (!tunnelSlot.linkedNetwork && tunnelSlot.type === typeMask) {
                        result.push({
                            entity,
                            tunnelSlot,
                            slot: null,
                            direction,
                        });
                    }
                }

                // Pin slots mean it can be nothing else
                continue;
            }
        }
    }

    // Add connected tunnels
    if (tunnel) {
        /** @type {EnergyTunnelComponent}*/
        const energyComp = tunnel.components["EnergyTunnel"];
        for (const tunnelSlot of energyComp.slots) {
            const tunnelDirection = tunnel.components.StaticMapEntity.localDirectionToWorld(
                tunnelSlot.tunnelDirection
            );

            const pos = tunnel.components.StaticMapEntity.localTileToWorld(tunnelSlot.pos);
            const directionVector = enumDirectionToVector[tunnelDirection];

            let offset = pos.add(directionVector);
            for (let i = 0; i < tunnelSlot.maxLength; i++) {
                offset.addInplace(directionVector);
                const contents = root.map.getLayersContentsMultipleXY(offset.x, offset.y);

                for (let j = 0; j < contents.length; j++) {
                    const entity = contents[j];
                    if (!entity.components["EnergyTunnel"]) continue;

                    for (const slot of entity.components["EnergyTunnel"].slots) {
                        // Check if the position matches
                        const pinPos = entity.components.StaticMapEntity.localTileToWorld(slot.pos);
                        if (!pinPos.equals(offset)) {
                            continue;
                        }

                        // Check if the direction (inverted) matches
                        const pinDirection = entity.components.StaticMapEntity.localDirectionToWorld(
                            slot.tunnelDirection
                        );

                        if (pinDirection !== enumInvertedDirections[tunnelDirection]) {
                            continue;
                        }

                        if (!slot.linkedNetwork) {
                            result.push({
                                entity,
                                tunnelSlot: slot,
                                slot: null,
                            });
                            return result;
                        }
                    }
                }
            }
        }
    }

    return result;
}

/**
 * Calculates all the tiles to check
 * @param {import("shapez/core/draw_parameters").Rectangle} tileSpaceBounds
 * @param {Vector} initialTile
 * @param {Array<enumDirection>} directions
 * @returns {Array<{
 *  direction: import("shapez/core/vector").enumDirection,
 *  initialSearchTile: import("shapez/core/vector").Vector
 * }>}
 */
function calculateOffsets(tileSpaceBounds, initialTile, directions) {
    const allOffsets = [];

    if (!initialTile) {
        for (let x = 0; x < tileSpaceBounds.w; ++x) {
            allOffsets.push({
                initialSearchTile: new Vector(x + tileSpaceBounds.x, -1 + tileSpaceBounds.y),
                direction: enumDirection.top,
            });
            allOffsets.push({
                initialSearchTile: new Vector(x + tileSpaceBounds.x, tileSpaceBounds.h + tileSpaceBounds.y),
                direction: enumDirection.bottom,
            });
        }
        for (let y = 0; y < tileSpaceBounds.h; ++y) {
            allOffsets.push({
                initialSearchTile: new Vector(-1 + tileSpaceBounds.x, y + tileSpaceBounds.y),
                direction: enumDirection.left,
            });
            allOffsets.push({
                initialSearchTile: new Vector(tileSpaceBounds.w + tileSpaceBounds.x, y + tileSpaceBounds.y),
                direction: enumDirection.right,
            });
        }
    } else {
        for (let i = 0; i < directions.length; i++) {
            const direction = directions[i];
            const offset = enumDirectionToVector[direction];
            const initialSearchTile = initialTile.add(offset);
            allOffsets.push({ direction: directions[i], initialSearchTile });
        }
    }

    return allOffsets.filter(x => directions.includes(x.direction));
}
