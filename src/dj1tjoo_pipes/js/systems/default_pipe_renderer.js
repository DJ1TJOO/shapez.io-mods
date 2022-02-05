import { globalConfig } from "shapez/core/config";
import { Loader } from "shapez/core/loader";
import { enumDirection } from "shapez/core/vector";
import { GameSystem } from "shapez/game/game_system";
import { MapChunkView } from "shapez/game/map_chunk_view";
import { enumPipeVariant, enumPipeVariantToVariant } from "../buildings/pipe";
import { enumPipeType, PipeComponent } from "../components/pipe";
import { PipeNetwork } from "./pipe";

export class DefaultPipeRendererSystem extends GameSystem {
    constructor(root) {
        super(root);

        /**
         * @type {Object<enumPipeVariant, Object<enumPipeType, import("shapez/core/draw_utils").AtlasSprite>>}
         */
        this.pipeSprites = {};

        const variants = Object.keys(enumPipeVariant);
        for (let i = 0; i < variants.length; ++i) {
            const pipeVariant = variants[i];
            const sprites = {};
            for (const pipeType in enumPipeType) {
                sprites[pipeType] = Loader.getSprite(
                    "sprites/pipes/" + pipeVariant + "_" + pipeType + ".png"
                );
            }
            this.pipeSprites[pipeVariant] = sprites;
        }
    }

    /**
     * Returns the given tileset and opacity
     * @param {PipeComponent} pipeComp
     * @returns {{ spriteSet: Object<enumPipeType, import("../../core/draw_utils").AtlasSprite>, opacity: number}}
     */
    getSpriteSetAndOpacityForPipe(pipeComp) {
        if (!pipeComp.linkedNetwork) {
            // There is no network, it's empty
            return {
                spriteSet: this.pipeSprites[pipeComp.variant],
                opacity: 0.5,
            };
        }

        const network = pipeComp.linkedNetwork;
        return {
            spriteSet: this.pipeSprites[pipeComp.variant],
            opacity: network.currentPressure > 0 ? (pipeComp.localPressure > 0 ? 1 : 0.9) : 0.5,
        };
    }

    /**
     * @param {enumDirection} direction
     * @returns
     */
    getGradient(parameters, entity, direction, half = false, offset = 0) {
        // @ts-ignore
        const pipeComp = entity.components.Pipe;
        const staticComp = entity.components.StaticMapEntity;
        const network = pipeComp.linkedNetwork;

        const size = half ? globalConfig.tileSize / 2 : globalConfig.tileSize;
        let startX = 0,
            startY = 0,
            endX = 0,
            endY = 0,
            ownFirst = true;
        if (direction === enumDirection.top) {
            endY = size;
            ownFirst = false;
        } else if (direction === enumDirection.bottom) {
            if (half) startY = size;
            endY = half ? size * 2 : size;
        } else if (direction === enumDirection.left) {
            endX = size;
        } else if (direction === enumDirection.right) {
            if (half) startX = size;
            endX = half ? size * 2 : size;
            ownFirst = false;
        }

        if (startX > 0) startX += offset;
        if (startY > 0) startY += offset;

        const gradient = parameters.context.createLinearGradient(
            staticComp.origin.x * globalConfig.tileSize + startX,
            staticComp.origin.y * globalConfig.tileSize + startY,
            staticComp.origin.x * globalConfig.tileSize + endX,
            staticComp.origin.y * globalConfig.tileSize + endY
        );
        const nextPipe = network.pipes[network.pipes.findIndex(x => x.uid === entity.uid) + 1];
        const ownColor = pipeComp.localFluidColor(network.currentFluid);
        // @ts-ignore
        const otherColor = nextPipe
            ? nextPipe.components.Pipe.localFluidColor(network.currentFluid)
            : ownColor;

        if (ownFirst) {
            gradient.addColorStop(0, ownColor);
            gradient.addColorStop(1, otherColor);
        } else {
            gradient.addColorStop(0, otherColor);
            gradient.addColorStop(1, ownColor);
        }

        return gradient;
    }

    /**
     * Draws a given chunk
     * @param {import("shapez/core/draw_utils").DrawParameters} parameters
     * @param {MapChunkView} chunk
     */
    drawChunk(parameters, chunk) {
        // @ts-ignore
        const contents = chunk.contents;
        for (let y = 0; y < globalConfig.mapChunkSize; ++y) {
            for (let x = 0; x < globalConfig.mapChunkSize; ++x) {
                const entity = contents[x][y];
                // @ts-ignore
                if (entity && entity.components.DefaultPipeRenderer && entity.components.Pipe) {
                    // @ts-ignore
                    const pipeComp = entity.components.Pipe;
                    const pipeType = pipeComp.type;

                    const { opacity, spriteSet } = this.getSpriteSetAndOpacityForPipe(pipeComp);

                    const sprite = spriteSet[pipeType];

                    assert(sprite, "Unknown pipe type: " + pipeType);
                    const staticComp = entity.components.StaticMapEntity;
                    parameters.context.globalAlpha = opacity;
                    staticComp.drawSpriteOnBoundsClipped(parameters, sprite, 0);

                    /** @type {PipeNetwork} */
                    const network = pipeComp.linkedNetwork;

                    if (
                        network &&
                        network.currentFluid &&
                        pipeComp.localPressure > 0 &&
                        pipeComp.volume > 0
                    ) {
                        /** @TODO gradients */
                        parameters.context.fillStyle = pipeComp.localFluidColor(network.currentFluid);
                        const size =
                            enumPipeVariant.pipe === enumPipeVariantToVariant[staticComp.getVariant()]
                                ? 3
                                : 8;

                        switch (pipeType) {
                            case enumPipeType.forward:
                                if (staticComp.rotation % 180 === 0) {
                                    // parameters.context.fillStyle = this.getGradient(
                                    //     parameters,
                                    //     entity,
                                    //     staticComp.rotation % 360 === 0
                                    //         ? enumDirection.top
                                    //         : enumDirection.bottom
                                    // );
                                    parameters.context.fillRect(
                                        (staticComp.origin.x + 0.5) * globalConfig.tileSize - size / 2,
                                        staticComp.origin.y * globalConfig.tileSize - 0.1,
                                        size,
                                        globalConfig.tileSize + 0.2
                                    );
                                } else {
                                    // parameters.context.fillStyle = this.getGradient(
                                    //     parameters,
                                    //     entity,
                                    //     staticComp.rotation % 270 === 0
                                    //         ? enumDirection.left
                                    //         : enumDirection.right
                                    // );
                                    parameters.context.fillRect(
                                        staticComp.origin.x * globalConfig.tileSize - 0.1,
                                        (staticComp.origin.y + 0.5) * globalConfig.tileSize - size / 2,
                                        globalConfig.tileSize + 0.2,
                                        size
                                    );
                                }
                                break;
                            case enumPipeType.cross:
                                // parameters.context.fillStyle = pipeComp.localFluidColor(network.currentFluid);
                                parameters.context.fillRect(
                                    (staticComp.origin.x + 0.5) * globalConfig.tileSize - size / 2,
                                    staticComp.origin.y * globalConfig.tileSize - 0.1,
                                    size,
                                    globalConfig.tileSize + 0.2
                                );
                                parameters.context.fillRect(
                                    staticComp.origin.x * globalConfig.tileSize - 0.1,
                                    (staticComp.origin.y + 0.5) * globalConfig.tileSize - size / 2,
                                    globalConfig.tileSize + 0.2,
                                    size
                                );
                                break;
                            case enumPipeType.split:
                                // parameters.context.fillStyle = pipeComp.localFluidColor(network.currentFluid);
                                if (staticComp.rotation % 360 === 0) {
                                    parameters.context.fillRect(
                                        (staticComp.origin.x + 0.5) * globalConfig.tileSize - size / 2,
                                        (staticComp.origin.y + 0.5) * globalConfig.tileSize - 0.1,
                                        size,
                                        globalConfig.tileSize / 2 + 0.2
                                    );
                                    parameters.context.fillRect(
                                        staticComp.origin.x * globalConfig.tileSize - 0.1,
                                        (staticComp.origin.y + 0.5) * globalConfig.tileSize - size / 2,
                                        globalConfig.tileSize + 0.2,
                                        size
                                    );
                                } else if (staticComp.rotation % 270 === 0) {
                                    parameters.context.fillRect(
                                        (staticComp.origin.x + 0.5) * globalConfig.tileSize - size / 2,
                                        staticComp.origin.y * globalConfig.tileSize - 0.1,
                                        size,
                                        globalConfig.tileSize + 0.2
                                    );
                                    parameters.context.fillRect(
                                        (staticComp.origin.x + 0.5) * globalConfig.tileSize - 0.1,
                                        (staticComp.origin.y + 0.5) * globalConfig.tileSize - size / 2,
                                        globalConfig.tileSize / 2 + 0.2,
                                        size
                                    );
                                } else if (staticComp.rotation % 180 === 0) {
                                    parameters.context.fillRect(
                                        (staticComp.origin.x + 0.5) * globalConfig.tileSize - size / 2,
                                        staticComp.origin.y * globalConfig.tileSize - 0.1,
                                        size,
                                        globalConfig.tileSize / 2 + 0.2
                                    );
                                    parameters.context.fillRect(
                                        staticComp.origin.x * globalConfig.tileSize - 0.1,
                                        (staticComp.origin.y + 0.5) * globalConfig.tileSize - size / 2,
                                        globalConfig.tileSize + 0.2,
                                        size
                                    );
                                } else if (staticComp.rotation % 90 === 0) {
                                    parameters.context.fillRect(
                                        (staticComp.origin.x + 0.5) * globalConfig.tileSize - size / 2,
                                        staticComp.origin.y * globalConfig.tileSize - 0.1,
                                        size,
                                        globalConfig.tileSize + 0.2
                                    );
                                    parameters.context.fillRect(
                                        staticComp.origin.x * globalConfig.tileSize - 0.1,
                                        (staticComp.origin.y + 0.5) * globalConfig.tileSize - size / 2,
                                        globalConfig.tileSize / 2 + 0.2,
                                        size
                                    );
                                }
                                break;

                            case enumPipeType.turn:
                                if (staticComp.rotation % 360 === 0) {
                                    // parameters.context.fillStyle = this.getGradient(
                                    //     parameters,
                                    //     entity,
                                    //     enumDirection.bottom,
                                    //     true,
                                    //     size / 2
                                    // );
                                    parameters.context.fillRect(
                                        (staticComp.origin.x + 0.5) * globalConfig.tileSize - size / 2,
                                        (staticComp.origin.y + 0.5) * globalConfig.tileSize - 0.1,
                                        size,
                                        globalConfig.tileSize / 2 + 0.2
                                    );
                                    // parameters.context.fillStyle = pipeComp.localFluidColor(
                                    //     network.currentFluid
                                    // );
                                    parameters.context.fillRect(
                                        (staticComp.origin.x + 0.5) * globalConfig.tileSize - 0.1,
                                        (staticComp.origin.y + 0.5) * globalConfig.tileSize - size / 2,
                                        globalConfig.tileSize / 2 + 0.2,
                                        size
                                    );
                                } else if (staticComp.rotation % 270 === 0) {
                                    // parameters.context.fillStyle = this.getGradient(
                                    //     parameters,
                                    //     entity,
                                    //     enumDirection.top,
                                    //     true,
                                    //     size / 2
                                    // );
                                    parameters.context.fillRect(
                                        (staticComp.origin.x + 0.5) * globalConfig.tileSize - size / 2,
                                        staticComp.origin.y * globalConfig.tileSize - 0.1,
                                        size,
                                        globalConfig.tileSize / 2 + 0.2
                                    );
                                    // parameters.context.fillStyle = pipeComp.localFluidColor(
                                    //     network.currentFluid
                                    // );
                                    parameters.context.fillRect(
                                        (staticComp.origin.x + 0.5) * globalConfig.tileSize - 0.1,
                                        (staticComp.origin.y + 0.5) * globalConfig.tileSize - size / 2,
                                        globalConfig.tileSize / 2 + 0.2,
                                        size
                                    );
                                } else if (staticComp.rotation % 180 === 0) {
                                    parameters.context.fillRect(
                                        (staticComp.origin.x + 0.5) * globalConfig.tileSize - size / 2,
                                        staticComp.origin.y * globalConfig.tileSize - 0.1,
                                        size,
                                        globalConfig.tileSize / 2 + 0.2
                                    );
                                    parameters.context.fillRect(
                                        staticComp.origin.x * globalConfig.tileSize - 0.1,
                                        (staticComp.origin.y + 0.5) * globalConfig.tileSize - size / 2,
                                        globalConfig.tileSize / 2 + 0.2,
                                        size
                                    );
                                } else if (staticComp.rotation % 90 === 0) {
                                    parameters.context.fillRect(
                                        (staticComp.origin.x + 0.5) * globalConfig.tileSize - size / 2,
                                        (staticComp.origin.y + 0.5) * globalConfig.tileSize - 0.1,
                                        size,
                                        globalConfig.tileSize / 2 + 0.2
                                    );
                                    parameters.context.fillRect(
                                        staticComp.origin.x * globalConfig.tileSize - 0.1,
                                        (staticComp.origin.y + 0.5) * globalConfig.tileSize - size / 2,
                                        globalConfig.tileSize / 2 + 0.2,
                                        size
                                    );
                                }

                                // parameters.context.fillStyle = pipeComp.localFluidColor(network.currentFluid);
                                parameters.context.beginPath();
                                parameters.context.arc(
                                    (staticComp.origin.x + 0.5) * globalConfig.tileSize,
                                    (staticComp.origin.y + 0.5) * globalConfig.tileSize,
                                    size / 2,
                                    0,
                                    2 * Math.PI
                                );
                                parameters.context.fill();
                                break;

                            default:
                                break;
                        }
                    }
                }
            }
        }

        parameters.context.globalAlpha = 1;
    }
}
