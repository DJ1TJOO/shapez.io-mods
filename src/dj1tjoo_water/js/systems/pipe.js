import { globalConfig } from "shapez/core/config";
import { BUILD_OPTIONS } from "shapez/core/globals";
import { gMetaBuildingRegistry } from "shapez/core/global_registries";
import { Loader } from "shapez/core/loader";
import { lerp, round2Digits } from "shapez/core/utils";
import {
    enumDirection,
    enumDirectionToVector,
    enumAngleToDirection,
    enumDirectionToAngle,
    Vector,
} from "shapez/core/vector";
import { getCodeFromBuildingData } from "shapez/game/building_codes";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { MapChunkView } from "shapez/game/map_chunk_view";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { MetaPipeBuilding, arrayPipeVariantToRotation } from "../buildings/pipe";
import { PipeComponent, enumPipeVariant } from "../components/pipe";

/**
 * Manages all pipes
 */
export class PipeSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [PipeComponent]);

        this.pipeSprites = {
            [defaultBuildingVariant]: {
                [enumDirection.top]: Loader.getSprite("sprites/pipes/pipe_top.png"),
                [enumDirection.left]: Loader.getSprite("sprites/pipes/pipe_left.png"),
                [enumDirection.right]: Loader.getSprite("sprites/pipes/pipe_right.png"),
            },

            [enumPipeVariant.industrial]: {
                [enumDirection.top]: Loader.getSprite("sprites/pipes/industrial_top.png"),
                [enumDirection.left]: Loader.getSprite("sprites/pipes/industrial_left.png"),
                [enumDirection.right]: Loader.getSprite("sprites/pipes/industrial_right.png"),
            },
        };

        this.root.signals.entityDestroyed.add(this.updateSurroundingPipePlacement, this);

        this.root.signals.entityAdded.add(this.updateSurroundingPipePlacement, this);
        this.root.signals.entityAdded.add(this.updatePipeConnection, this);
    }

    update() {
        // this.updatePipeConnection();
        this.updatePressure();
        this.updateFluidValume();
    }

    updateFluidValume() {
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            // @ts-ignore
            const pipeComp = entity.components.Pipe;

            if (!pipeComp.currentValue) {
                continue;
            }

            const currentPressure = pipeComp.currentPressure;
            const currentAmount = pipeComp.currentAmount;

            if (currentPressure === 0 || currentAmount === 0) {
                continue;
            }

            for (let i = 0; i < pipeComp.connections.length; ++i) {
                const connection = pipeComp.connections[i];
                const pipeComponent = connection.components.Pipe;

                if (!pipeComponent) {
                    continue;
                }

                if (
                    pipeComponent.currentValue != null &&
                    pipeComponent.currentValue != pipeComp.currentValue
                ) {
                    continue;
                }

                const pressure = pipeComponent.currentPressure;
                if (pressure === 0) {
                    continue;
                }

                if (pressure > currentPressure) {
                    continue;
                }

                const pipeFluidAmount = pipeComponent.currentAmount;
                if (currentAmount > pipeFluidAmount + 1) {
                    const increaseAmount =
                        Math.floor(
                            lerp(0, currentAmount - pipeFluidAmount, currentPressure / pipeComp.maxPressure) *
                                1000
                        ) / 1000;
                    if (
                        increaseAmount > 0 &&
                        pipeFluidAmount + increaseAmount <= pipeComponent.getMaxValue()
                    ) {
                        pipeComponent.currentAmount += increaseAmount;
                        pipeComponent.currentValue = pipeComp.currentValue;
                    }
                }
            }
        }
    }

    updatePressure() {
        for (let i = 0; i < this.allEntities.length; i++) {
            const entity = this.allEntities[i];
            // @ts-ignore
            const pipeComp = entity.components.Pipe;

            const mainPressure = pipeComp.currentPressure;

            if (pipeComp.connections.length == 0) {
                pipeComp.currentPressure = 0;

                continue;
            }

            for (let j = 0; j < pipeComp.connections.length; j++) {
                const connection = pipeComp.connections[j];
                const pipeCon = connection.components.Pipe;

                if (!pipeCon) {
                    continue;
                }

                const pressure = pipeCon.currentPressure;
                if (pressure > mainPressure) {
                    pipeComp.currentPressure = pressure - 1;
                }
            }
        }
    }

    /**
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     * @returns
     */
    updatePipeConnection(entity) {
        const staticComp = entity.components.StaticMapEntity;
        // @ts-ignore
        const pipeComp = entity.components.Pipe;

        if (!staticComp || !pipeComp) {
            return;
        }

        pipeComp.connections = [];

        const rotation = staticComp.rotation;
        const origin = staticComp.origin;

        const posTop = origin.add(
            enumDirectionToVector[
                enumAngleToDirection[(rotation + enumDirectionToAngle[pipeComp.direction]) % 360]
            ]
        );
        const posBottom = origin.add(enumDirectionToVector[enumAngleToDirection[(rotation + 180) % 360]]);

        const topEntity = this.root.map.getLayerContentXY(posTop.x, posTop.y, "regular");
        const bottomEntity = this.root.map.getLayerContentXY(posBottom.x, posBottom.y, "regular");

        // @ts-ignore
        if (topEntity && topEntity.components.Pump) {
            pipeComp.connections.push(topEntity);
            // @ts-ignore
            topEntity.components.Pump.pipeConnections.push(entity);
        }

        // @ts-ignore
        if (bottomEntity && bottomEntity.components.Pump) {
            pipeComp.connections.push(bottomEntity);
            // @ts-ignore
            bottomEntity.components.Pump.pipeConnections.push(entity);
        }

        switch (pipeComp.direction) {
            case enumDirection.top:
                // If pipe is straight
                // @ts-ignore
                if (topEntity && topEntity.components.Pipe) {
                    // @ts-ignore
                    const topPipe = topEntity.components.Pipe;
                    const topStatic = topEntity.components.StaticMapEntity;

                    let rotationAddition = 0;
                    if (topPipe.direction === enumDirection.left) {
                        rotationAddition = 270;
                    }

                    if (
                        topPipe.direction !== enumDirection.top &&
                        (topStatic.rotation === (rotation + rotationAddition) % 360 ||
                            topStatic.rotation === (rotation + rotationAddition + 90) % 360)
                    ) {
                        pipeComp.connections.push(topEntity);

                        // @ts-ignore
                        if (!topEntity.components.Pipe.connections.includes(entity)) {
                            // @ts-ignore
                            topEntity.components.Pipe.connections.push(entity);
                        }
                    } else if (
                        topPipe.direction === enumDirection.top &&
                        (topStatic.rotation === rotation || topStatic.rotation === (rotation + 180) % 360)
                    ) {
                        pipeComp.connections.push(topEntity);

                        // @ts-ignore
                        if (!topEntity.components.Pipe.connections.includes(entity)) {
                            // @ts-ignore
                            topEntity.components.Pipe.connections.push(entity);
                        }
                    }
                }

                // @ts-ignore
                if (bottomEntity && bottomEntity.components.Pipe) {
                    // @ts-ignore
                    const bottomPipe = bottomEntity.components.Pipe;
                    const bottomStatic = bottomEntity.components.StaticMapEntity;

                    let rotationAddition = 90;
                    if (bottomPipe.direction === enumDirection.right) {
                        rotationAddition = 180;
                    }

                    if (
                        bottomPipe.direction !== enumDirection.top &&
                        (bottomStatic.rotation === (rotation + rotationAddition) % 360 ||
                            bottomStatic.rotation === (rotation + rotationAddition + 90) % 360)
                    ) {
                        pipeComp.connections.push(bottomEntity);

                        // @ts-ignore
                        if (!bottomEntity.components.Pipe.connections.includes(entity)) {
                            // @ts-ignore
                            bottomEntity.components.Pipe.connections.push(entity);
                        }
                    } else if (
                        bottomPipe.direction === enumDirection.top &&
                        (bottomStatic.rotation === rotation ||
                            bottomStatic.rotation === (rotation + 180) % 360)
                    ) {
                        pipeComp.connections.push(bottomEntity);

                        // @ts-ignore
                        if (!bottomEntity.components.Pipe.connections.includes(entity)) {
                            // @ts-ignore
                            bottomEntity.components.Pipe.connections.push(entity);
                        }
                    }
                }

                break;
            case enumDirection.right:
                // If pipe is turning right
                // @ts-ignore
                if (topEntity && topEntity.components.Pipe) {
                    // @ts-ignore
                    const topPipe = topEntity.components.Pipe;
                    const topStatic = topEntity.components.StaticMapEntity;

                    let rotationAddition = 0;
                    if (topPipe.direction === enumDirection.right) {
                        rotationAddition = 90;
                    }

                    if (
                        topPipe.direction !== enumDirection.top &&
                        (topStatic.rotation === (rotation + rotationAddition) % 360 ||
                            topStatic.rotation === (rotation + rotationAddition + 90) % 360)
                    ) {
                        pipeComp.connections.push(topEntity);

                        // @ts-ignore
                        if (!topEntity.components.Pipe.connections.includes(entity)) {
                            // @ts-ignore
                            topEntity.components.Pipe.connections.push(entity);
                        }
                    } else if (
                        topPipe.direction === enumDirection.top &&
                        (topStatic.rotation === (rotation + 90) % 360 ||
                            topStatic.rotation === (rotation + 270) % 360)
                    ) {
                        pipeComp.connections.push(topEntity);

                        // @ts-ignore
                        if (!topEntity.components.Pipe.connections.includes(entity)) {
                            // @ts-ignore
                            topEntity.components.Pipe.connections.push(entity);
                        }
                    }
                }

                // @ts-ignore
                if (bottomEntity && bottomEntity.components.Pipe) {
                    // @ts-ignore
                    const bottomPipe = bottomEntity.components.Pipe;
                    const bottomStatic = bottomEntity.components.StaticMapEntity;

                    let rotationAddition = 90;
                    if (bottomPipe.direction === enumDirection.right) {
                        rotationAddition = 180;
                    }

                    if (
                        bottomPipe.direction !== enumDirection.top &&
                        (bottomStatic.rotation === (rotation + rotationAddition) % 360 ||
                            bottomStatic.rotation === (rotation + rotationAddition + 90) % 360)
                    ) {
                        pipeComp.connections.push(bottomEntity);

                        // @ts-ignore
                        if (!bottomEntity.components.Pipe.connections.includes(entity)) {
                            // @ts-ignore
                            bottomEntity.components.Pipe.connections.push(entity);
                        }
                    } else if (
                        bottomPipe.direction === enumDirection.top &&
                        (bottomStatic.rotation === rotation ||
                            bottomStatic.rotation === (rotation + 180) % 360)
                    ) {
                        pipeComp.connections.push(bottomEntity);

                        // @ts-ignore
                        if (!bottomEntity.components.Pipe.connections.includes(entity)) {
                            // @ts-ignore
                            bottomEntity.components.Pipe.connections.push(entity);
                        }
                    }
                }

                break;
            case enumDirection.left:
                // If pipe is turning left
                // @ts-ignore
                if (topEntity && topEntity.components.Pipe) {
                    // @ts-ignore
                    const topPipe = topEntity.components.Pipe;
                    const topStatic = topEntity.components.StaticMapEntity;

                    let rotationAddition = 180;
                    if (topPipe.direction === enumDirection.left) {
                        rotationAddition = 270;
                    }

                    if (
                        topPipe.direction !== enumDirection.top &&
                        (topStatic.rotation === (rotation + rotationAddition) % 360 ||
                            topStatic.rotation === (rotation + rotationAddition + 90) % 360)
                    ) {
                        pipeComp.connections.push(topEntity);

                        // @ts-ignore
                        if (!topEntity.components.Pipe.connections.includes(entity)) {
                            // @ts-ignore
                            topEntity.components.Pipe.connections.push(entity);
                        }
                    } else if (
                        topPipe.direction === enumDirection.top &&
                        (topStatic.rotation === (rotation + 90) % 360 ||
                            topStatic.rotation === (rotation + 270) % 360)
                    ) {
                        pipeComp.connections.push(topEntity);

                        // @ts-ignore
                        if (!topEntity.components.Pipe.connections.includes(entity)) {
                            // @ts-ignore
                            topEntity.components.Pipe.connections.push(entity);
                        }
                    }
                }

                // @ts-ignore
                if (bottomEntity && bottomEntity.components.Pipe) {
                    // @ts-ignore
                    const bottomPipe = bottomEntity.components.Pipe;
                    const bottomStatic = bottomEntity.components.StaticMapEntity;

                    let rotationAddition = 90;
                    if (bottomPipe.direction === enumDirection.right) {
                        rotationAddition = 180;
                    }

                    if (
                        bottomPipe.direction !== enumDirection.top &&
                        (bottomStatic.rotation === (rotation + rotationAddition) % 360 ||
                            bottomStatic.rotation === (rotation + rotationAddition + 90) % 360)
                    ) {
                        pipeComp.connections.push(bottomEntity);

                        // @ts-ignore
                        if (!bottomEntity.components.Pipe.connections.includes(entity)) {
                            // @ts-ignore
                            bottomEntity.components.Pipe.connections.push(entity);
                        }
                    } else if (
                        bottomPipe.direction === enumDirection.top &&
                        (bottomStatic.rotation === rotation ||
                            bottomStatic.rotation === (rotation + 180) % 360)
                    ) {
                        pipeComp.connections.push(bottomEntity);

                        // @ts-ignore
                        if (!bottomEntity.components.Pipe.connections.includes(entity)) {
                            // @ts-ignore
                            bottomEntity.components.Pipe.connections.push(entity);
                        }
                    }
                }

                break;
        }
    }

    /**
     * Updates the pipe placement after an entity has been added / deleted
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     */
    updateSurroundingPipePlacement(entity) {
        if (!this.root.gameInitialized) {
            return;
        }

        const staticComp = entity.components.StaticMapEntity;
        if (!staticComp) {
            return;
        }

        const metaPipe = gMetaBuildingRegistry.findByClass(MetaPipeBuilding);
        // Compute affected area
        const originalRect = staticComp.getTileSpaceBounds();
        const affectedArea = originalRect.expandedInAllDirections(1);

        for (let x = affectedArea.x; x < affectedArea.right(); ++x) {
            for (let y = affectedArea.y; y < affectedArea.bottom(); ++y) {
                if (originalRect.containsPoint(x, y)) {
                    // Make sure we don't update the original entity
                    continue;
                }

                const targetEntities = this.root.map.getLayersContentsMultipleXY(x, y);
                for (let i = 0; i < targetEntities.length; ++i) {
                    const targetEntity = targetEntities[i];

                    // @ts-ignore
                    const targetPipeComp = targetEntity.components.Pipe;
                    const targetStaticComp = targetEntity.components.StaticMapEntity;

                    if (!targetPipeComp) {
                        // Not a pipe
                        continue;
                    }

                    const { rotation, rotationVariant } =
                        metaPipe.computeOptimalDirectionAndRotationVariantAtTile({
                            root: this.root,
                            tile: new Vector(x, y),
                            rotation: targetStaticComp.originalRotation,
                            variant: targetPipeComp.variant,
                            layer: targetEntity.layer,
                        });

                    // Compute delta to see if anything changed
                    const newDirection = arrayPipeVariantToRotation[rotationVariant];

                    if (targetStaticComp.rotation !== rotation || newDirection !== targetPipeComp.direction) {
                        // Change stuff
                        targetStaticComp.rotation = rotation;
                        metaPipe.updateVariants(targetEntity, rotationVariant, targetPipeComp.variant);

                        // Update code as well
                        targetStaticComp.code = getCodeFromBuildingData(
                            metaPipe,
                            targetPipeComp.variant,
                            rotationVariant
                        );

                        // Make sure the chunks know about the update
                        this.root.signals.entityChanged.dispatch(targetEntity);
                    }

                    this.updatePipeConnection(targetEntity);
                }
            }
        }
    }

    /**
     * Draws a given chunk
     * @param {import("shapez/core/draw_utils").DrawParameters} parameters
     * @param {MapChunkView} chunk
     */
    drawChunk(parameters, chunk) {
        // Limit speed to avoid pipes going backwards
        // @ts-ignore
        const speedMultiplier = Math.min(this.root.hubGoals.getBeltBaseSpeed(), 10);
        const contents = chunk.containedEntitiesByLayer.regular;

        if (this.root.app.settings.getAllSettings().simplifiedBelts) {
            for (let i = 0; i < contents.length; ++i) {
                const entity = contents[i];
                // @ts-ignore
                if (entity.components.Pipe) {
                    // @ts-ignore
                    const variant = entity.components.Pipe.variant;
                    // @ts-ignore
                    const rotationVariant = entity.components.Pipe.direction;
                    let sprite = this.pipeSprites[variant][rotationVariant];

                    // Culling happens within the static map entity component
                    entity.components.StaticMapEntity.drawSpriteOnBoundsClipped(parameters, sprite, 0);
                }
            }
        } else {
            for (let i = 0; i < contents.length; ++i) {
                const entity = contents[i];
                // @ts-ignore
                if (entity.components.Pipe) {
                    // @ts-ignore
                    const variant = entity.components.Pipe.variant;
                    // @ts-ignore
                    const rotationVariant = entity.components.Pipe.direction;
                    const sprite = this.pipeSprites[variant][rotationVariant];

                    // Culling happens within the static map entity component
                    entity.components.StaticMapEntity.drawSpriteOnBoundsClipped(parameters, sprite, 0);

                    const staticComp = entity.components.StaticMapEntity;

                    // DEBUG Rendering
                    if (BUILD_OPTIONS.IS_DEV) {
                        const textRed = String(staticComp.originalRotation);
                        // @ts-ignore
                        const textGreen = String(entity.components.Pipe.connections.length);
                        // @ts-ignore
                        const textBlue = String(round2Digits(entity.components.Pipe.currentAmount));
                        // @ts-ignore
                        const textBlack = String(round2Digits(entity.components.Pipe.currentPressure));

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
                            (staticComp.origin.x + 1) * globalConfig.tileSize -
                                2.5 * String(textGreen).length -
                                1,
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
                            (staticComp.origin.x + 1) * globalConfig.tileSize -
                                2.5 * String(textBlack).length -
                                1,
                            (staticComp.origin.y + 1) * globalConfig.tileSize - 2.5
                        );

                        const w = 3;
                        parameters.context.fillStyle = "rgba(255, 0, 0, 0.2)";
                        if (staticComp.originalRotation % 180 === 0) {
                            parameters.context.fillRect(
                                (staticComp.origin.x + 0.5) * globalConfig.tileSize - w / 2,
                                staticComp.origin.y * globalConfig.tileSize,
                                w,
                                globalConfig.tileSize
                            );
                        } else {
                            parameters.context.fillRect(
                                staticComp.origin.x * globalConfig.tileSize,
                                (staticComp.origin.y + 0.5) * globalConfig.tileSize - w / 2,
                                globalConfig.tileSize,
                                w
                            );
                        }
                    }
                }
            }
        }
    }
}
