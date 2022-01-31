import { globalConfig } from "shapez/core/config";
import { fastArrayDelete } from "shapez/core/utils";
import { enumDirectionToVector } from "shapez/core/vector";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { MapChunkView } from "shapez/game/map_chunk_view";
import { FluidAcceptorComponent } from "../components/fluid_acceptor";
import { defaultFuildSpacing, defaultFluidDiameter } from "../systems/fluid_ejector";

export class FluidAcceptorSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [FluidAcceptorComponent]);

        // Well ... it's better to be verbose I guess?
        this.accumulatedTicksWhileInMapOverview = 0;
    }

    update() {
        if (this.root.app.settings.getAllSettings().simplifiedBelts) {
            // Disabled in potato mode
            return;
        }

        // This system doesn't render anything while in map overview,
        // so simply accumulate ticks
        if (this.root.camera.getIsMapOverlayActive()) {
            ++this.accumulatedTicksWhileInMapOverview;
            return;
        }

        // Compute how much ticks we missed
        const numTicks = 1 + this.accumulatedTicksWhileInMapOverview;
        const progress =
            this.root.dynamicTickrate.deltaSeconds *
            2 *
            this.root.hubGoals.getBeltBaseSpeed() *
            defaultFuildSpacing * // * 2 because its only a half tile
            numTicks;

        // Reset accumulated ticks
        this.accumulatedTicksWhileInMapOverview = 0;

        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            // @ts-ignore
            const aceptorComp = entity.components.FluidAcceptor;
            const animations = aceptorComp.fluidConsumptionAnimations;

            // Process fluid consumption animations to avoid fluids popping from the belts
            for (let animIndex = 0; animIndex < animations.length; ++animIndex) {
                const anim = animations[animIndex];
                anim.animProgress += progress;
                if (anim.animProgress > 1) {
                    fastArrayDelete(animations, animIndex);
                    animIndex -= 1;
                }
            }
        }
    }

    /**
     * @param {import("shapez/core/draw_utils").DrawParameters} parameters
     * @param {MapChunkView} chunk
     */
    drawChunk(parameters, chunk) {
        if (this.root.app.settings.getAllSettings().simplifiedBelts) {
            // Disabled in potato mode
            return;
        }

        const contents = chunk.containedEntitiesByLayer.regular;
        for (let i = 0; i < contents.length; ++i) {
            const entity = contents[i];
            // @ts-ignore
            const acceptorComp = entity.components.FluidAcceptor;
            if (!acceptorComp) {
                continue;
            }

            const staticComp = entity.components.StaticMapEntity;
            for (let animIndex = 0; animIndex < acceptorComp.fluidConsumptionAnimations.length; ++animIndex) {
                const { fluid, slotIndex, animProgress, direction } =
                    acceptorComp.fluidConsumptionAnimations[animIndex];

                const slotData = acceptorComp.slots[slotIndex];
                const realSlotPos = staticComp.localTileToWorld(slotData.pos);

                if (!chunk.tileSpaceRectangle.containsPoint(realSlotPos.x, realSlotPos.y)) {
                    // Not within this chunk
                    continue;
                }

                const fadeOutDirection = enumDirectionToVector[staticComp.localDirectionToWorld(direction)];
                const finalTile = realSlotPos.subScalars(
                    fadeOutDirection.x * (animProgress / 2 - 0.5),
                    fadeOutDirection.y * (animProgress / 2 - 0.5)
                );

                fluid.drawItemCenteredClipped(
                    (finalTile.x + 0.5) * globalConfig.tileSize,
                    (finalTile.y + 0.5) * globalConfig.tileSize,
                    parameters,
                    defaultFluidDiameter
                );
            }
        }
    }
}
