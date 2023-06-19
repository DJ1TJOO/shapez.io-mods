import { globalConfig } from "shapez/core/config";
import { Loader } from "shapez/core/loader";
import { Rectangle } from "shapez/core/rectangle";
import { enumItemProcessorTypes } from "shapez/game/components/item_processor";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { amountPerCharge } from "../amountPerCharge";
import { processLabelBasicGenerator } from "../buildings/basic_generator";
import { BasicGeneratorComponent } from "../components/basic_generator";

export class BasicGeneratorSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [BasicGeneratorComponent]);

        this.fullSprite = Loader.getSprite("sprites/buildings/basic_generator_overlay.png");
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

            const processorComp = entity.components.ItemProcessor;
            if (!processorComp || processorComp.ongoingCharges.length < 1) continue;

            const speed = this.root.hubGoals.getProcessorBaseSpeed(
                enumItemProcessorTypes[processLabelBasicGenerator]
            );
            if (
                connectedSlots.length < 1 ||
                !connectedSlots.some(
                    x =>
                        x.buffer + amountPerCharge(this.root, x.maxProduction, processLabelBasicGenerator) <
                        x.maxBuffer
                )
            )
                continue;

            const size = staticComp.getTileSize();
            let worldX = staticComp.origin.x * globalConfig.tileSize;
            let worldY = staticComp.origin.y * globalConfig.tileSize;

            const rotation = staticComp.rotation;
            const extrudePixels = 2;

            const progress = 1 - processorComp.ongoingCharges[0].remainingTime * speed;

            const sizeX = globalConfig.tileSize * size.x + 2 * extrudePixels * size.x;
            const sizeY = globalConfig.tileSize * size.y + 2 * extrudePixels * size.y;

            if (rotation === 0) {
                // Early out, is faster
                this.fullSprite.drawCachedWithClipRect(
                    parameters,
                    worldX - extrudePixels * size.x,
                    worldY - extrudePixels * size.y - sizeY * 0.5 - (extrudePixels / 1.5) * size.y,
                    sizeX,
                    sizeY,
                    new Rectangle(0, 1, 1, -progress)
                );
            } else {
                const rotationCenterX = worldX + globalConfig.halfTileSize;
                const rotationCenterY = worldY + globalConfig.halfTileSize;

                parameters.context.translate(rotationCenterX, rotationCenterY);
                parameters.context.rotate((rotation * Math.PI) / 180);
                this.fullSprite.drawCachedWithClipRect(
                    parameters,
                    -globalConfig.halfTileSize - extrudePixels * size.x,
                    -globalConfig.halfTileSize -
                        extrudePixels * size.y -
                        sizeY * 0.5 -
                        (extrudePixels / 1.5) * size.y,
                    sizeX,
                    sizeY,
                    new Rectangle(0, 1, 1, -progress)
                );
                parameters.context.rotate(-(rotation * Math.PI) / 180);
                parameters.context.translate(-rotationCenterX, -rotationCenterY);
            }
        }
    }
}
