import { Vector, enumDirectionToVector } from "shapez/core/vector";
import { GameLogic } from "shapez/game/logic";
import { Mod } from "shapez/mods/mod";
import { MetaPipeBuilding } from "./buildings/pipe";
import { MetaPumpBuilding } from "./buildings/pump";
import { FluidAcceptorComponent } from "./components/fluid_acceptor";
import { FluidEjectorComponent } from "./components/fluid_ejector";
import { PipeComponent } from "./components/pipe";
import { PumpComponent } from "./components/pump";
import { FluidAcceptorSystem } from "./systems/fluid_acceptor";
import { FluidEjectorSystem } from "./systems/fluid_ejector";
import { PipeSystem } from "./systems/pipe";
import { PumpSystem } from "./systems/pump";

// @ts-ignore
class ModImpl extends Mod {
    init() {
        this.checkSettings();

        this.modInterface.registerNewBuilding({
            metaClass: MetaPipeBuilding,
        });
        this.modInterface.addNewBuildingToToolbar({
            toolbar: "regular",
            location: "primary",
            metaClass: MetaPipeBuilding,
        });
        this.modInterface.registerNewBuilding({
            metaClass: MetaPumpBuilding,
        });
        this.modInterface.addNewBuildingToToolbar({
            toolbar: "regular",
            location: "primary",
            metaClass: MetaPumpBuilding,
        });

        this.modInterface.registerComponent(FluidAcceptorComponent);
        this.modInterface.registerComponent(FluidEjectorComponent);
        this.modInterface.registerComponent(PumpComponent);
        this.modInterface.registerComponent(PipeComponent);

        this.modInterface.registerGameSystem({
            id: "fluidAcceptor",
            systemClass: FluidAcceptorSystem,
            before: "pipe",
            drawHooks: ["foregroundDynamicAfter"],
        });

        this.modInterface.registerGameSystem({
            id: "pipe",
            systemClass: PipeSystem,
            before: "pump",
            drawHooks: ["backgroundLayerAfter"],
        });

        this.modInterface.registerGameSystem({
            id: "pump",
            systemClass: PumpSystem,
            before: "fluidEjector",
            drawHooks: ["staticAfter"],
        });

        this.modInterface.registerGameSystem({
            id: "fluidEjector",
            systemClass: FluidEjectorSystem,
            before: "constantProducer",
            drawHooks: ["foregroundDynamicAfter"],
        });

        this.modInterface.extendClass(GameLogic, () => ({
            /**
             * Returns the acceptors and ejectors which affect the current tile
             * @param {Vector} tile
             * @param {string} variant
             * @this {GameLogic}
             * @returns {import("shapez/game/logic").AcceptorsAndEjectorsAffectingTile}
             */
            getEjectorsAndAcceptorsAtTileForPipes(tile, variant) {
                /** @type {import("shapez/game/logic").EjectorsAffectingTile} */
                let ejectors = [];
                /** @type {import("shapez/game/logic").AcceptorsAffectingTile} */
                let acceptors = [];

                // Well .. please ignore this code! :D
                for (let dx = -1; dx <= 1; ++dx) {
                    for (let dy = -1; dy <= 1; ++dy) {
                        if (Math.abs(dx) + Math.abs(dy) !== 1) {
                            continue;
                        }

                        const entity = this.root.map.getLayerContentXY(tile.x + dx, tile.y + dy, "regular");
                        if (entity) {
                            let ejectorSlots = [];
                            let acceptorSlots = [];

                            const staticComp = entity.components.StaticMapEntity;
                            // @ts-ignore
                            const fluidEjector = entity.components.FluidEjector;
                            // @ts-ignore
                            const fluidAcceptor = entity.components.FluidAcceptor;
                            // @ts-ignore
                            const pipeComp = entity.components.Pipe;

                            if (fluidEjector) {
                                ejectorSlots = fluidEjector.slots.slice();
                            }

                            if (fluidAcceptor) {
                                acceptorSlots = fluidAcceptor.slots.slice();
                            }

                            if (pipeComp && pipeComp.variant === variant) {
                                const fakeEjectorSlot = pipeComp.getFakeEjectorSlot();
                                const fakeAcceptorSlot = pipeComp.getFakeAcceptorSlot();
                                ejectorSlots.push(fakeEjectorSlot);
                                acceptorSlots.push(fakeAcceptorSlot);
                            }

                            for (let ejectorSlot = 0; ejectorSlot < ejectorSlots.length; ++ejectorSlot) {
                                const slot = ejectorSlots[ejectorSlot];
                                const wsTile = staticComp.localTileToWorld(slot.pos);
                                const wsDirection = staticComp.localDirectionToWorld(slot.direction);
                                const targetTile = wsTile.add(enumDirectionToVector[wsDirection]);
                                if (targetTile.equals(tile)) {
                                    ejectors.push({
                                        entity,
                                        slot,
                                        fromTile: wsTile,
                                        toDirection: wsDirection,
                                    });
                                }
                            }

                            for (let acceptorSlot = 0; acceptorSlot < acceptorSlots.length; ++acceptorSlot) {
                                const slot = acceptorSlots[acceptorSlot];
                                const wsTile = staticComp.localTileToWorld(slot.pos);
                                for (let k = 0; k < slot.directions.length; ++k) {
                                    const direction = slot.directions[k];
                                    const wsDirection = staticComp.localDirectionToWorld(direction);

                                    const sourceTile = wsTile.add(enumDirectionToVector[wsDirection]);
                                    if (sourceTile.equals(tile)) {
                                        acceptors.push({
                                            entity,
                                            slot,
                                            toTile: wsTile,
                                            fromDirection: wsDirection,
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                return { ejectors, acceptors };
            },
        }));
    }

    checkSettings() {
        // Create default settings if corrupted
        if (!this.settings) {
            this.settings = {};
        }

        this.saveSettings();
    }
}
