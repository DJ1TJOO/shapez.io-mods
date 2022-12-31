import { globalConfig } from "shapez/core/config";
import { Loader } from "shapez/core/loader";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { arrayConnectorRotationVariantToType, enumConnectorType } from "../buildings/basic_connector";
import { BasicGeneratorComponent } from "../components/basic_generator";

export class BasicConnectorRendererSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [BasicGeneratorComponent]);

        this.sprites = {};
        this.spritesTop = {};
        for (const type in enumConnectorType) {
            this.sprites[type] = Loader.getSprite("sprites/connectors/connector_" + type + ".png");
            this.spritesTop[type] = Loader.getSprite("sprites/connectors/connector_" + type + "_top.png");
        }
    }

    update() {
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];

            /** @type {import("../components/basic_generator").BasicGeneratorComponent} */
            const genComp = entity.components["BasicGenerator"];
            /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent} */
            const pinComp = entity.components["EnergyPin"];

            const connectedSlots = pinComp.slots.filter(x => x.linkedNetwork && x.type === "ejector");

            let fluxGenerated = 0;
            if (genComp.generations > 0) {
                fluxGenerated += genComp.production;
                genComp.generations--;
            }

            // Divide generated over all slots
            for (let i = 0; i < connectedSlots.length; i++) {
                const slot = connectedSlots[i];
                slot.buffer += fluxGenerated / connectedSlots.length;
            }
        }
    }

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
                if (entity && entity.components["EnergyConnector"]) {
                    /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_connector").EnergyConnectorComponent} */
                    const connectorComp = entity.components["EnergyConnector"];

                    const type =
                        arrayConnectorRotationVariantToType[
                            entity.components.StaticMapEntity.getRotationVariant()
                        ];
                    const sprite = this.sprites[type];

                    const staticComp = entity.components.StaticMapEntity;
                    staticComp.drawSpriteOnBoundsClipped(parameters, sprite);

                    if (!connectorComp.linkedNetwork || connectorComp.energyVolume < 1) continue;

                    parameters.context.fillStyle = "#04FC84";
                    parameters.context.globalAlpha =
                        connectorComp.energyVolume / connectorComp.maxEnergyVolume;
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
                    const spriteTop = this.spritesTop[type];
                    staticComp.drawSpriteOnBoundsClipped(parameters, spriteTop);
                }
            }
        }
    }
}
