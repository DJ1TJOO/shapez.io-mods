import { makeOffscreenBuffer } from "shapez/core/buffer_utils";
import { globalConfig } from "shapez/core/config";
import { smoothenDpi } from "shapez/core/dpi_manager";
import { DrawParameters } from "shapez/core/draw_parameters";
import { Loader } from "shapez/core/loader";
import { Rectangle } from "shapez/core/rectangle";
import { ORIGINAL_SPRITE_SCALE } from "shapez/core/sprites";
import { Vector } from "shapez/core/vector";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { PipeConnectorRendererComponent } from "../components/pipe_connector_renderer";
import { enumConnectorType, arrayConnectorRotationVariantToType } from "../connectorTypes";

export class PipeConnectorRendererSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [PipeConnectorRendererComponent]);

        this.sprites = {};
        this.spriteOverlays = {};
        for (const type in enumConnectorType) {
            this.sprites[type] = Loader.getSprite("sprites/connectors/pipe/pipe_" + type + ".png");
            this.spriteOverlays[type] = Loader.getSprite(
                "sprites/connectors/pipe/pipe_" + type + "_overlay.png"
            );
        }
    }

    update() {}

    /**
     * Draws a given chunk
     * @param {import("shapez/core/draw_utils").DrawParameters} parameters
     * @param {import("shapez/game/map_chunk_view").MapChunkView} chunk
     */
    drawChunk(parameters, chunk) {
        const contents = chunk.contents;
        for (let y = 0; y < globalConfig.mapChunkSize; ++y) {
            for (let x = 0; x < globalConfig.mapChunkSize; ++x) {
                const entity = contents[x][y];
                if (
                    entity &&
                    entity.components["PipeConnector"] &&
                    entity.components["PipeConnectorRenderer"]
                ) {
                    /** @type {import("@dj1tjoo/shapez-pipes/lib/js/components/pipe_connector").PipeConnectorComponent} */
                    const connectorComp = entity.components["PipeConnector"];

                    const type =
                        arrayConnectorRotationVariantToType[
                            entity.components.StaticMapEntity.getRotationVariant()
                        ];
                    const sprite = this.sprites[type];
                    const spriteOverlay = this.spriteOverlays[type];

                    const staticComp = entity.components.StaticMapEntity;

                    const canvas = parameters.root.buffers.getForKey({
                        key: "pipe-overlay",
                        subKey:
                            staticComp.getRotationVariant() +
                            "-" +
                            staticComp.rotation +
                            "-" +
                            connectorComp.linkedNetwork.currentFluid.getBackgroundColorAsResource() +
                            "-" +
                            connectorComp.linkedNetwork.currentVolume,
                        w: globalConfig.tileSize,
                        h: globalConfig.tileSize,
                        dpi: 1,
                        redrawMethod: this.overlayGenerator.bind(
                            this,
                            spriteOverlay,
                            connectorComp,
                            staticComp
                        ),
                    });

                    if (
                        connectorComp.linkedNetwork &&
                        connectorComp.linkedNetwork.currentFluid !== null &&
                        connectorComp.pipeVolume >= 1
                    ) {
                        parameters.context.drawImage(
                            canvas,
                            staticComp.origin.x * globalConfig.tileSize,
                            staticComp.origin.y * globalConfig.tileSize,
                            globalConfig.tileSize,
                            globalConfig.tileSize
                        );
                    }

                    staticComp.drawSpriteOnBoundsClipped(parameters, sprite);
                }
            }
        }
    }

    /**
     *
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} context
     * @param {number} w
     * @param {number} h
     * @param {number} dpi
     */
    overlayGenerator(spriteOverlay, connectorComp, staticComp, canvas, context, w, h, dpi) {
        context.fillStyle = connectorComp.linkedNetwork.currentFluid.getBackgroundColorAsResource();
        context.globalAlpha = connectorComp.pipeVolume / connectorComp.maxPipeVolume;

        context.fillRect(0, 0, globalConfig.tileSize, globalConfig.tileSize);

        context.globalCompositeOperation = "destination-in";

        this.drawSpriteOnBoundsClipped(
            staticComp,
            new Vector(0, 0),
            new DrawParameters({
                context,
                root: this.root,
                visibleRect: new Rectangle(0, 0, globalConfig.tileSize, globalConfig.tileSize),
                desiredAtlasScale: ORIGINAL_SPRITE_SCALE,
                zoomLevel: 0,
            }),
            spriteOverlay
        );
    }

    /**
     * Draws a sprite over the whole space of the entity
     * @param {import("shapez/game/components/static_map_entity").StaticMapEntityComponent} staticComponent
     * @param {import("shapez/core/vector").Vector} pos Whether to drwa the entity at a different location
     * @param {import("shapez/core/draw_utils").DrawParameters} parameters
     * @param {import("shapez/core/draw_utils").AtlasSprite} sprite
     * @param {number=} extrudePixels How many pixels to extrude the sprite
     */
    drawSpriteOnBoundsClipped(staticComponent, pos, parameters, sprite, extrudePixels = 0) {
        let worldX = pos.x * globalConfig.tileSize;
        let worldY = pos.y * globalConfig.tileSize;

        const rotation = staticComponent.rotation;

        if (rotation % 360 === 0) {
            // Early out, is faster
            sprite.drawCached(
                parameters,
                worldX - extrudePixels,
                worldY - extrudePixels,
                globalConfig.tileSize + 2 * extrudePixels,
                globalConfig.tileSize + 2 * extrudePixels
            );
        } else {
            const rotationCenterX = worldX + globalConfig.halfTileSize;
            const rotationCenterY = worldY + globalConfig.halfTileSize;

            parameters.context.translate(rotationCenterX, rotationCenterY);

            parameters.context.rotate((rotation * Math.PI) / 180);
            sprite.drawCached(
                parameters,
                -globalConfig.halfTileSize - extrudePixels,
                -globalConfig.halfTileSize - extrudePixels,
                globalConfig.tileSize + 2 * extrudePixels,
                globalConfig.tileSize + 2 * extrudePixels,
                false // no clipping possible here
            );
            parameters.context.rotate(-(rotation * Math.PI) / 180);
            parameters.context.translate(-rotationCenterX, -rotationCenterY);
        }
    }
}
