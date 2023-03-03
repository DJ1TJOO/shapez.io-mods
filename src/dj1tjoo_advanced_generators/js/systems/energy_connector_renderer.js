import { globalConfig } from "shapez/core/config";
import { Loader } from "shapez/core/loader";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { EnergyConnectorRendererComponent } from "../components/energy_connector_renderer";
import { enumConnectorType, arrayConnectorRotationVariantToType } from "../connectorTypes";

export class EnergyConnectorRendererSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [EnergyConnectorRendererComponent]);

        this.sprites = {};
        this.spritesOverlay = {};
        for (const type in enumConnectorType) {
            this.sprites[type] = Loader.getSprite("sprites/connectors/energy/connector_" + type + ".png");
            this.spritesOverlay[type] = Loader.getSprite(
                "sprites/connectors/energy/connector_" + type + "_overlay.png"
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
                    entity.components["EnergyConnector"] &&
                    entity.components["EnergyConnectorRenderer"]
                ) {
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

                    parameters.context.globalAlpha =
                        connectorComp.energyVolume / connectorComp.maxEnergyVolume;

                    const spriteTop = this.spritesOverlay[type];
                    staticComp.drawSpriteOnBoundsClipped(parameters, spriteTop);

                    parameters.context.globalAlpha = 1;
                }
            }
        }
    }
}
