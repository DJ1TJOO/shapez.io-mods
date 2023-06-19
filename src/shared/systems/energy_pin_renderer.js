import { globalConfig } from "shapez/core/config";
import { Loader } from "shapez/core/loader";
import { enumDirectionToAngle } from "shapez/core/vector";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { EnergyPinRendererComponent } from "../components/energy_pin_renderer";

export class EnergyPinRendererSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [EnergyPinRendererComponent]);

        this.pinSprite = Loader.getSprite("sprites/energy/pin.png");
        this.pinOverlaySprite = Loader.getSprite("sprites/energy/pin_overlay.png");
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
            const renderComp = entity.components["EnergyPinRenderer"];

            if (!pinComp || !renderComp) continue;

            const staticComp = entity.components.StaticMapEntity;

            for (let i = 0; i < pinComp.slots.length; i++) {
                const slot = pinComp.slots[i];
                const pos = staticComp.localTileToWorld(slot.pos);

                this.drawSpriteOnBoundsClipped(
                    staticComp,
                    pos,
                    slot.direction,
                    parameters,
                    this.pinSprite,
                    2
                );

                if (slot.linkedNetwork) {
                    parameters.context.globalAlpha =
                        slot.linkedNetwork.currentVolume / slot.linkedNetwork.maxVolume;

                    this.drawSpriteOnBoundsClipped(
                        staticComp,
                        pos,
                        slot.direction,
                        parameters,
                        this.pinOverlaySprite,
                        2
                    );

                    parameters.context.globalAlpha = 1;
                }
            }
        }
    }

    /**
     * Draws a sprite over the whole space of the entity
     * @param {import("shapez/game/components/static_map_entity").StaticMapEntityComponent} staticComponent
     * @param {import("shapez/core/vector").enumDirection} direction
     * @param {import("shapez/core/vector").Vector} pos Whether to drwa the entity at a different location
     * @param {import("shapez/core/draw_utils").DrawParameters} parameters
     * @param {import("shapez/core/draw_utils").AtlasSprite} sprite
     * @param {number=} extrudePixels How many pixels to extrude the sprite
     */
    drawSpriteOnBoundsClipped(staticComponent, pos, direction, parameters, sprite, extrudePixels = 0) {
        if (!staticComponent.shouldBeDrawn(parameters)) {
            return;
        }
        let worldX = pos.x * globalConfig.tileSize;
        let worldY = pos.y * globalConfig.tileSize;

        const rotation = staticComponent.rotation + enumDirectionToAngle[direction];

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
