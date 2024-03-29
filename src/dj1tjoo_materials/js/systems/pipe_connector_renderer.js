import { globalConfig } from "shapez/core/config";
import { Loader } from "shapez/core/loader";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { PipeConnectorRendererComponent } from "../components/pipe_connector_renderer";
import { enumConnectorType, arrayConnectorRotationVariantToType } from "../connectorTypes";

export class PipeConnectorRendererSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [PipeConnectorRendererComponent]);

        this.sprites = {};
        for (const type in enumConnectorType) {
            this.sprites[type] = Loader.getSprite("sprites/connectors/pipe/pipe_" + type + ".png");
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

                    const staticComp = entity.components.StaticMapEntity;
                    staticComp.drawSpriteOnBoundsClipped(parameters, sprite);

                    if (
                        !connectorComp.linkedNetwork ||
                        connectorComp.linkedNetwork.currentFluid === null ||
                        connectorComp.pipeVolume < 1
                    )
                        continue;

                    parameters.context.fillStyle =
                        connectorComp.linkedNetwork.currentFluid.getBackgroundColorAsResource();
                    parameters.context.globalAlpha = connectorComp.pipeVolume / connectorComp.maxPipeVolume;
                    const size = 5;

                    switch (type) {
                        case enumConnectorType.cross:
                            parameters.context.fillRect(
                                (staticComp.origin.x + 0.5) * globalConfig.tileSize - size / 2,
                                staticComp.origin.y * globalConfig.tileSize - 0.1,
                                size,
                                globalConfig.tileSize + 0.2
                            );
                            parameters.context.fillRect(
                                staticComp.origin.x * globalConfig.tileSize - 0.1,
                                (staticComp.origin.y + 0.5) * globalConfig.tileSize - size / 2,
                                (globalConfig.tileSize - size) / 2 + 0.2,
                                size
                            );
                            parameters.context.fillRect(
                                (staticComp.origin.x + 0.5) * globalConfig.tileSize - 0.1 + size / 2,
                                (staticComp.origin.y + 0.5) * globalConfig.tileSize - size / 2,
                                (globalConfig.tileSize - size) / 2 + 0.2,
                                size
                            );
                            break;
                        case enumConnectorType.forward:
                            parameters.context.save();
                            parameters.context.translate(
                                (staticComp.origin.x + 0.5) * globalConfig.tileSize,
                                (staticComp.origin.y + 0.5) * globalConfig.tileSize
                            );
                            parameters.context.rotate((staticComp.rotation * Math.PI) / 180);
                            parameters.context.fillRect(
                                -size / 2,
                                -globalConfig.tileSize / 2 - 0.1,
                                size,
                                globalConfig.tileSize + 0.2
                            );
                            parameters.context.restore();
                            break;
                        case enumConnectorType.turn:
                            parameters.context.save();
                            parameters.context.translate(
                                (staticComp.origin.x + 0.5) * globalConfig.tileSize,
                                (staticComp.origin.y + 0.5) * globalConfig.tileSize
                            );
                            parameters.context.rotate((staticComp.rotation * Math.PI) / 180);
                            parameters.context.fillRect(
                                -size / 2,
                                -0.1 - size / 2,
                                size,
                                globalConfig.tileSize / 2 + size / 2 + 0.2
                            );
                            parameters.context.restore();

                            parameters.context.save();
                            parameters.context.translate(
                                (staticComp.origin.x + 0.5) * globalConfig.tileSize,
                                (staticComp.origin.y + 0.5) * globalConfig.tileSize
                            );
                            parameters.context.rotate(((staticComp.rotation + 90) * Math.PI) / 180);
                            parameters.context.fillRect(
                                -size / 2,
                                -globalConfig.tileSize / 2 - 0.1,
                                size,
                                globalConfig.tileSize / 2 - size / 2 + 0.2
                            );
                            parameters.context.restore();
                            break;
                        case enumConnectorType.split:
                            parameters.context.save();
                            parameters.context.translate(
                                (staticComp.origin.x + 0.5) * globalConfig.tileSize,
                                (staticComp.origin.y + 0.5) * globalConfig.tileSize
                            );
                            parameters.context.rotate((staticComp.rotation * Math.PI) / 180);
                            parameters.context.fillRect(
                                -size / 2,
                                size / 2 - 0.1,
                                size,
                                globalConfig.tileSize / 2 - size / 2 + 0.2
                            );
                            parameters.context.restore();

                            parameters.context.save();
                            parameters.context.translate(
                                (staticComp.origin.x + 0.5) * globalConfig.tileSize,
                                (staticComp.origin.y + 0.5) * globalConfig.tileSize
                            );
                            parameters.context.rotate(((staticComp.rotation + 90) * Math.PI) / 180);
                            parameters.context.fillRect(
                                -size / 2,
                                -globalConfig.tileSize / 2 - 0.1,
                                size,
                                globalConfig.tileSize + 0.2
                            );
                            parameters.context.restore();
                            break;
                        case enumConnectorType.stub:
                            parameters.context.save();
                            parameters.context.translate(
                                (staticComp.origin.x + 0.5) * globalConfig.tileSize,
                                (staticComp.origin.y + 0.5) * globalConfig.tileSize
                            );
                            parameters.context.rotate((staticComp.rotation * Math.PI) / 180);
                            parameters.context.fillRect(
                                -size / 2,
                                -globalConfig.tileSize / 2 - 0.1 + size * 1.5,
                                size,
                                globalConfig.tileSize - size * 1.5 + 0.2
                            );
                            parameters.context.restore();
                            break;

                        default:
                            break;
                    }

                    parameters.context.globalAlpha = 1;
                }
            }
        }
    }
}
