import { globalConfig } from "shapez/core/config";
import { BUILD_OPTIONS } from "shapez/core/globals";
import { enumDirectionToVector, enumAngleToDirection } from "shapez/core/vector";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { MapChunkView } from "shapez/game/map_chunk_view";
import { PumpComponent } from "../components/pump";

export class PumpSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [PumpComponent]);

        this.pressurePower = 20;

        this.root.signals.entityDestroyed.add(this.updateSurroundings, this);

        this.root.signals.entityAdded.add(this.findFluid, this);
        this.root.signals.entityAdded.add(this.updatePumpConnection, this);
    }

    update() {
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            // @ts-ignore
            const pumpComp = entity.components.Pump;

            for (const pipes of pumpComp.pipeConnections) {
                const pipeComp = pipes.components.Pipe;
                if (!pipeComp.currentValue && pumpComp.cachedPumpedFluid) {
                    pipeComp.currentValue = pumpComp.cachedPumpedFluid;
                }

                if (!pipeComp.currentValue) {
                    continue;
                }

                if (pipeComp.currentAmount < pipeComp.getMaxValue()) {
                    pipeComp.currentAmount += 1;
                }

                pipeComp.currentPressure = 20;
            }
        }
    }

    /**
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     */
    updatePumpConnection(entity) {
        const staticComp = entity.components.StaticMapEntity;
        // @ts-ignore
        const pumpComp = entity.components.Pump;

        if (!staticComp || !pumpComp) {
            return;
        }

        pumpComp.pipeConnections = [];
        pumpComp.pumpConnections = [];

        const rotation = staticComp.rotation;
        const origin = staticComp.origin;

        const posTop = origin.add(enumDirectionToVector[enumAngleToDirection[rotation]]);
        const posBottom = origin.add(enumDirectionToVector[enumAngleToDirection[(rotation + 180) % 360]]);

        const topEntity = this.root.map.getLayerContentXY(posTop.x, posTop.y, "regular");
        const bottomEntity = this.root.map.getLayerContentXY(posBottom.x, posBottom.y, "regular");
        const entities = [topEntity, bottomEntity];

        for (let i = 0; i < entities.length; ++i) {
            const neighborEntity = entities[i];
            if (!neighborEntity) {
                continue;
            }

            // @ts-ignore
            const neighborPipeComp = neighborEntity.components.Pipe;
            // @ts-ignore
            const neighborPumpComp = neighborEntity.components.Pump;
            if (neighborPipeComp) {
                pumpComp.pipeConnections.push(neighborEntity);

                if (!neighborPipeComp.connections.includes(entity)) {
                    neighborPipeComp.connections.push(entity);
                }
            } else if (neighborPumpComp) {
                pumpComp.pumpConnections.push(neighborEntity);

                if (!neighborPumpComp.pumpConnections.includes(entity)) {
                    neighborPumpComp.pumpConnections.push(entity);
                }
            }
        }
    }

    /**
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     */
    updateSurroundings(entity) {
        if (!this.root.gameInitialized) {
            return;
        }

        const staticComp = entity.components.StaticMapEntity;
        if (!staticComp) {
            return;
        }

        // @ts-ignore
        if (!entity.components.Pump) {
            return;
        }

        // Compute affected area
        const originalRect = staticComp.getTileSpaceBounds();
        const affectedArea = originalRect.expandedInAllDirections(1);

        for (let x = affectedArea.x; x < affectedArea.right(); ++x) {
            for (let y = affectedArea.y; y < affectedArea.bottom(); ++y) {
                if (originalRect.containsPoint(x, y)) {
                    // Make sure we don't update the original entity
                    continue;
                }

                const targetEntity = this.root.map.getLayerContentXY(x, y, "regular");
                if (!targetEntity) {
                    continue;
                }

                // @ts-ignore
                const pipeComp = targetEntity.components.Pipe;
                // @ts-ignore
                const pumpComp = targetEntity.components.Pump;
                if (pipeComp) {
                    const index = pipeComp.connections.indexOf(entity);
                    if (index > -1) {
                        pipeComp.connections.splice(index, 1);
                    }
                } else if (pumpComp) {
                    const index = pumpComp.pumpConnections.indexOf(entity);
                    if (index > -1) {
                        pumpComp.pumpConnections.splice(index, 1);
                    }
                }
            }
        }
    }

    findFluid(entity) {
        const pumpComp = entity.components.Pump;

        if (!pumpComp) {
            return;
        }

        // Check if miner is above an actual tile
        if (!pumpComp.cachedPumpedFluid) {
            const staticComp = entity.components.StaticMapEntity;
            let tileBelow = this.root.map.getLowerLayerContentXY(staticComp.origin.x, staticComp.origin.y);
            if (!tileBelow) {
                return;
            }

            pumpComp.cachedPumpedFluid = tileBelow;
        }
    }

    /**
     *
     * @param {import("shapez/core/draw_utils").DrawParameters} parameters
     * @param {MapChunkView} chunk
     */
    drawChunk(parameters, chunk) {
        const contents = chunk.containedEntitiesByLayer.regular;

        for (let i = 0; i < contents.length; ++i) {
            const entity = contents[i];
            // @ts-ignore
            const pumpComp = entity.components.Pump;
            if (!pumpComp) {
                continue;
            }

            const staticComp = entity.components.StaticMapEntity;
            if (!pumpComp.cachedPumpedFluid) {
                continue;
            }

            // // Draw the fluid background - this is to hide the ejected fluid animation from
            // // the fluid ejector

            // const padding = 3;
            // const destX = staticComp.origin.x * globalConfig.tileSize + padding;
            // const destY = staticComp.origin.y * globalConfig.tileSize + padding;
            // const dimensions = globalConfig.tileSize - 2 * padding;

            // if (parameters.visibleRect.containsRect4Params(destX, destY, dimensions, dimensions)) {
            //     parameters.context.fillStyle = pumpComp.cachedPumpedFluid.getBackgroundColorAsResource();
            //     parameters.context.fillRect(destX, destY, dimensions, dimensions);
            // }

            // pumpComp.cachedPumpedFluid.drawItemCenteredClipped(
            //     (0.5 + staticComp.origin.x) * globalConfig.tileSize,
            //     (0.5 + staticComp.origin.y) * globalConfig.tileSize,
            //     parameters,
            //     globalConfig.defaultFluidDiameter
            // );

            // DEBUG Rendering
            if (BUILD_OPTIONS.IS_DEV) {
                const textRed = String(0);
                // @ts-ignore
                const textGreen = String(entity.components.Pump.pipeConnections.length);
                // @ts-ignore
                const textBlue = String(entity.components.Pump.pumpConnections.length);
                // @ts-ignore
                const textBlack = String(entity.components.Pump.pressure);

                parameters.context.globalAlpha = 1;
                parameters.context.fillStyle = "red";
                parameters.context.font = "5px Tahoma";
                parameters.context.fillText(
                    textRed,
                    staticComp.origin.x * globalConfig.tileSize,
                    staticComp.origin.y * globalConfig.tileSize + 2.5
                );

                parameters.context.fillStyle = "green";
                parameters.context.fillText(
                    textGreen,
                    (staticComp.origin.x + 1) * globalConfig.tileSize - 2.5 * String(textGreen).length - 1,
                    staticComp.origin.y * globalConfig.tileSize + 2.5
                );

                parameters.context.fillStyle = "blue";
                parameters.context.fillText(
                    textBlue,
                    staticComp.origin.x * globalConfig.tileSize,
                    (staticComp.origin.y + 1) * globalConfig.tileSize - 2.5
                );

                parameters.context.fillStyle = "black";
                parameters.context.fillText(
                    textBlack,
                    (staticComp.origin.x + 1) * globalConfig.tileSize - 2.5 * String(textBlack).length - 1,
                    (staticComp.origin.y + 1) * globalConfig.tileSize - 2.5
                );
            }
        }
    }
}
