import { globalConfig } from "shapez/core/config";
import { Loader } from "shapez/core/loader";
import { enumItemProcessorTypes } from "shapez/game/components/item_processor";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { processLabelBasicGenerator } from "../buildings/basic_generator";
import { BasicGeneratorComponent } from "../components/basic_generator";

export class BasicGeneratorSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [BasicGeneratorComponent]);

        this.pinSprite = Loader.getSprite("sprites/buildings/basic_generator_pin.png");
        this.sprites = [
            Loader.getSprite("sprites/buildings/basic_generator_0.png"),
            Loader.getSprite("sprites/buildings/basic_generator_1.png"),
            Loader.getSprite("sprites/buildings/basic_generator_2.png"),
            Loader.getSprite("sprites/buildings/basic_generator_3.png"),
        ];
    }

    update() {}

    /**
     * Draws a given chunk
     * @param {import("shapez/core/draw_utils").DrawParameters} parameters
     * @param {import("shapez/game/map_chunk_view").MapChunkView} chunk
     */
    drawChunk(parameters, chunk) {
        const contents = chunk.containedEntitiesByLayer.regular;

        for (let i = 0; i < contents.length; ++i) {
            const entity = contents[i];

            /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent} */
            const pinComp = entity.components["EnergyPin"];

            /** @type {import("../components/basic_generator").BasicGeneratorComponent} */
            const genComp = entity.components["BasicGenerator"];

            if (!pinComp || !genComp) continue;

            const staticComp = entity.components.StaticMapEntity;

            const connectedSlots = pinComp.slots.filter(x => x.type === "ejector");

            if (connectedSlots.some(x => x.linkedNetwork)) {
                entity.components.StaticMapEntity.drawSpriteOnBoundsClipped(parameters, this.pinSprite, 2);
                parameters.context.fillStyle = "#04FC84";
                parameters.context.globalAlpha =
                    connectedSlots[0].linkedNetwork.currentVolume / connectedSlots[0].linkedNetwork.maxVolume;

                parameters.context.save();
                parameters.context.translate(
                    (staticComp.origin.x + 0.5) * globalConfig.tileSize,
                    (staticComp.origin.y + 0.5) * globalConfig.tileSize
                );
                parameters.context.rotate((staticComp.rotation * Math.PI) / 180);
                parameters.context.fillRect(-globalConfig.tileSize / 2, -10.5 / 2, 6.5, 10.5);
                parameters.context.restore();
                parameters.context.globalAlpha = 1;
            }

            const processorComp = entity.components.ItemProcessor;
            if (!processorComp || (processorComp.ongoingCharges.length < 1 && processorComp.inputCount < 1))
                continue;

            const speed =
                this.root.hubGoals.getProcessorBaseSpeed(enumItemProcessorTypes[processLabelBasicGenerator]) /
                this.root.app.settings.getDesiredFps();
            if (
                connectedSlots.length < 1 ||
                !connectedSlots.some(x => x.buffer + x.production / speed < x.maxBuffer)
            )
                continue;

            const animationIndex = Math.floor(this.root.time.realtimeNow() * 2);

            const index = animationIndex % (this.sprites.length + 1);
            if (index === this.sprites.length) continue;

            const sprite = this.sprites[index];
            entity.components.StaticMapEntity.drawSpriteOnBoundsClipped(parameters, sprite, 2);
        }
    }
}
