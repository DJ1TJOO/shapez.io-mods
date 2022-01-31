import { globalConfig } from "shapez/core/config";
import { createLogger } from "shapez/core/logging";
import { StaleAreaDetector } from "shapez/core/stale_area_detector";
import { enumDirectionToVector, enumDirection } from "shapez/core/vector";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { MapChunkView } from "shapez/game/map_chunk_view";
import { FluidAcceptorComponent } from "../components/fluid_acceptor";
import { FluidEjectorComponent } from "../components/fluid_ejector";
import { PipeComponent } from "../components/pipe";

const logger = createLogger("systems/ejector");

export const defaultFluidDiameter = 10;
export const defaultFuildSpacing = 1;

export class FluidEjectorSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [FluidEjectorComponent]);

        this.staleAreaDetector = new StaleAreaDetector({
            root: this.root,
            name: "fluid-ejector",
            recomputeMethod: this.recomputeArea.bind(this),
        });

        this.staleAreaDetector.recomputeOnComponentsChanged(
            [FluidEjectorComponent, FluidAcceptorComponent, PipeComponent],
            1
        );

        this.root.signals.postLoadHook.add(this.recomputeCacheFull, this);
    }

    /**
     * Recomputes an area after it changed
     * @param {import("shapez/core/draw_parameters").Rectangle} area
     */
    recomputeArea(area) {
        /** @type {Set<number>} */
        const seenUids = new Set();
        for (let x = 0; x < area.w; ++x) {
            for (let y = 0; y < area.h; ++y) {
                const tileX = area.x + x;
                const tileY = area.y + y;
                // @NOTICE: Fluid ejector currently only supports regular layer
                const contents = this.root.map.getLayerContentXY(tileX, tileY, "regular");
                // @ts-ignore
                if (contents && contents.components.FluidEjector) {
                    if (!seenUids.has(contents.uid)) {
                        seenUids.add(contents.uid);
                        this.recomputeSingleEntityCache(contents);
                    }
                }
            }
        }
    }

    /**
     * Recomputes the whole cache after the game has loaded
     */
    recomputeCacheFull() {
        logger.log("Full cache recompute in post load hook");
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            this.recomputeSingleEntityCache(entity);
        }
    }

    /**
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     */
    recomputeSingleEntityCache(entity) {
        // @ts-ignore
        const ejectorComp = entity.components.FluidEjector;
        const staticComp = entity.components.StaticMapEntity;

        for (let slotIndex = 0; slotIndex < ejectorComp.slots.length; ++slotIndex) {
            const ejectorSlot = ejectorComp.slots[slotIndex];

            // Clear the old cache.
            ejectorSlot.cachedDestSlot = null;
            ejectorSlot.cachedTargetEntity = null;

            // Figure out where and into which direction we eject fluids
            const ejectSlotWsTile = staticComp.localTileToWorld(ejectorSlot.pos);
            const ejectSlotWsDirection = staticComp.localDirectionToWorld(ejectorSlot.direction);
            const ejectSlotWsDirectionVector = enumDirectionToVector[ejectSlotWsDirection];
            const ejectSlotTargetWsTile = ejectSlotWsTile.add(ejectSlotWsDirectionVector);

            // Try to find the given acceptor component to take the fluid
            // Since there can be cross layer dependencies, check on all layers
            const targetEntities = this.root.map.getLayersContentsMultipleXY(
                ejectSlotTargetWsTile.x,
                ejectSlotTargetWsTile.y
            );

            for (let i = 0; i < targetEntities.length; ++i) {
                const targetEntity = targetEntities[i];

                const targetStaticComp = targetEntity.components.StaticMapEntity;
                // @ts-ignore
                const targetPipeComp = targetEntity.components.Pipe;

                // Check for pipes (special case)
                if (targetPipeComp) {
                    const pipeAcceptingDirection = targetStaticComp.localDirectionToWorld(enumDirection.top);
                    if (ejectSlotWsDirection === pipeAcceptingDirection) {
                        ejectorSlot.cachedTargetEntity = targetEntity;
                        break;
                    }
                }

                // Check for fluid acceptors
                // @ts-ignore
                const targetAcceptorComp = targetEntity.components.FluidAcceptor;
                if (!targetAcceptorComp) {
                    // Entity doesn't accept fluids
                    continue;
                }

                const matchingSlot = targetAcceptorComp.findMatchingSlot(
                    targetStaticComp.worldToLocalTile(ejectSlotTargetWsTile),
                    targetStaticComp.worldDirectionToLocal(ejectSlotWsDirection)
                );

                if (!matchingSlot) {
                    // No matching slot found
                    continue;
                }

                // A slot can always be connected to one other slot only
                ejectorSlot.cachedTargetEntity = targetEntity;
                ejectorSlot.cachedDestSlot = matchingSlot;
                break;
            }
        }
    }

    update() {
        this.staleAreaDetector.update();

        // Precompute effective pipe speed
        let progressGrowth = 2 * this.root.dynamicTickrate.deltaSeconds;

        // Go over all cache entries
        for (let i = 0; i < this.allEntities.length; ++i) {
            const sourceEntity = this.allEntities[i];
            // @ts-ignore
            const sourceEjectorComp = sourceEntity.components.FluidEjector;

            const slots = sourceEjectorComp.slots;
            for (let j = 0; j < slots.length; ++j) {
                const sourceSlot = slots[j];
                const fluid = sourceSlot.fluid;
                if (!fluid) {
                    // No fluid available to be ejected
                    continue;
                }

                // Advance fluids on the slot
                sourceSlot.progress = Math.min(
                    1,
                    sourceSlot.progress +
                        progressGrowth * this.root.hubGoals.getMinerBaseSpeed() * defaultFuildSpacing
                );

                // Check if we are still in the process of ejecting, can't proceed then
                if (sourceSlot.progress < 1.0) {
                    continue;
                }

                // Check if the target acceptor can actually accept this fluid
                const destEntity = sourceSlot.cachedTargetEntity;
                const destSlot = sourceSlot.cachedDestSlot;
                if (destSlot) {
                    const targetAcceptorComp = destEntity.components.FluidAcceptor;
                    if (!targetAcceptorComp.canAcceptFluid(destSlot.index, fluid)) {
                        continue;
                    }

                    // Try to hand over the fluid
                    if (this.tryPassOverFluid(fluid, destEntity, destSlot.index)) {
                        // Handover successful, clear slot
                        if (!this.root.app.settings.getAllSettings().simplifiedBelts) {
                            targetAcceptorComp.onFluidAccepted(
                                destSlot.index,
                                destSlot.acceptedDirection,
                                fluid
                            );
                        }
                        sourceSlot.fluid = null;
                        continue;
                    }
                }
            }
        }
    }

    /**
     *
     * @param {import("shapez/core/global_registries").BaseItem} fluid
     * @param {import("shapez/savegame/savegame_typedefs").Entity} receiver
     * @param {number} slotIndex
     */
    // @ts-ignore
    tryPassOverFluid(fluid, receiver, slotIndex) {
        // Try figuring out how what to do with the fluid
        // @TODO: Kinda hacky. How to solve this properly? Don't want to go through inheritance hell.

        // const pipeComp = receiver.components.Pipe;
        // if (pipeComp) {
        //     const path = pipeComp.assignedPath;
        //     assert(path, "pipe has no path");
        //     if (path.tryAcceptFluid(fluid)) {
        //         return true;
        //     }
        //     // Pipe can have nothing else
        //     return false;
        // }

        // const fluidProcessorComp = receiver.components.FluidProcessor;
        // if (fluidProcessorComp) {
        //     // Check for potential filters
        //     if (!this.root.systemMgr.systems.fluidProcessor.checkRequirements(receiver, fluid, slotIndex)) {
        //         return false;
        //     }

        //     // Its an fluid processor ..
        //     if (fluidProcessorComp.tryTakeFluid(fluid, slotIndex)) {
        //         return true;
        //     }
        //     // Fluid processor can have nothing else
        //     return false;
        // }

        // const undergroundPipeComp = receiver.components.UndergroundPipe;
        // if (undergroundPipeComp) {
        //     // Its an underground pipe. yay.
        //     if (
        //         undergroundPipeComp.tryAcceptExternalFluid(
        //             fluid,
        //             this.root.hubGoals.getUndergroundPipeBaseSpeed()
        //         )
        //     ) {
        //         return true;
        //     }

        //     // Underground pipe can have nothing else
        //     return false;
        // }

        // const storageComp = receiver.components.Storage;
        // if (storageComp) {
        //     // It's a storage
        //     if (storageComp.canAcceptFluid(fluid)) {
        //         storageComp.takeFluid(fluid);
        //         return true;
        //     }

        //     // Storage can't have anything else
        //     return false;
        // }

        // const filterComp = receiver.components.Filter;
        // if (filterComp) {
        //     // It's a filter! Unfortunately the filter has to know a lot about it's
        //     // surrounding state and components, so it can't be within the component itself.
        //     if (this.root.systemMgr.systems.filter.tryAcceptFluid(receiver, slotIndex, fluid)) {
        //         return true;
        //     }
        // }

        return false;
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
            const ejectorComp = entity.components.FluidEjector;
            if (!ejectorComp) {
                continue;
            }

            const staticComp = entity.components.StaticMapEntity;

            for (let i = 0; i < ejectorComp.slots.length; ++i) {
                const slot = ejectorComp.slots[i];
                const ejectedFluid = slot.fluid;

                if (!ejectedFluid) {
                    // No fluid
                    continue;
                }

                if (!ejectorComp.renderFloatingFluids && !slot.cachedTargetEntity) {
                    // Not connected to any building
                    continue;
                }

                // Limit the progress to the maximum available space on the next pipe (also see #1000)
                let progress = slot.progress;

                // Skip if the fluid would barely be visible
                if (progress < 0.05) {
                    continue;
                }

                const realPosition = staticComp.localTileToWorld(slot.pos);
                if (!chunk.tileSpaceRectangle.containsPoint(realPosition.x, realPosition.y)) {
                    // Not within this chunk
                    continue;
                }

                const realDirection = staticComp.localDirectionToWorld(slot.direction);
                const realDirectionVector = enumDirectionToVector[realDirection];

                const tileX = realPosition.x + 0.5 + realDirectionVector.x * 0.5 * progress;
                const tileY = realPosition.y + 0.5 + realDirectionVector.y * 0.5 * progress;

                const worldX = tileX * globalConfig.tileSize;
                const worldY = tileY * globalConfig.tileSize;

                ejectedFluid.drawItemCenteredClipped(worldX, worldY, parameters, defaultFluidDiameter);
            }
        }
    }
}
