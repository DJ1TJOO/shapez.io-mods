import { globalConfig } from "shapez/core/config";
import { enumInvertedDirections } from "shapez/core/vector";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { MapChunkView } from "shapez/game/map_chunk_view";
import { enumPinSlotType, PipedPinsComponent } from "../components/pipe_pins";
import { TankComponent } from "../components/tank";

export class TankSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [TankComponent]);

        this.transferVolume = Date.now();
    }

    update() {
        // Transfer every second
        const doTransfer = Date.now() - this.transferVolume > 1000;

        // Set signals
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            const staticComp = entity.components.StaticMapEntity;
            /**  @type {TankComponent} */
            // @ts-ignore
            const tankComp = entity.components.Tank;
            /**  @type {PipedPinsComponent} */
            // @ts-ignore
            const pinsComp = entity.components.PipedPins;

            if (pinsComp) {
                const acceptors = pinsComp.slots.filter(x => x.type === enumPinSlotType.logicalAcceptor);
                const ejector = pinsComp.slots.filter(x => x.type === enumPinSlotType.logicalEjector)[0];

                /**
                 * @TODO clean up
                 * */
                let fluid = null;
                let pressure = 0;
                let volumes = [];
                for (let i = 0; i < acceptors.length; i++) {
                    const acceptor = acceptors[i];
                    if (!fluid) {
                        fluid = acceptor.fluid;
                    } else if (!acceptor.fluid) {
                        continue;
                    } else if (fluid !== acceptor.fluid) {
                        fluid = null;
                        break;
                    }

                    pressure += pinsComp.getLocalPressure(this.root, entity, acceptor);

                    if (doTransfer) {
                        if (acceptor.linkedNetwork) {
                            const pipe = pinsComp.getConnectedPipe(this.root, entity, acceptor);
                            let volume = 0;
                            if (pipe.components.Pipe) {
                                volume = pipe.components.Pipe.volume;
                            } else if (pipe.components.PipedPins) {
                                // Get correct slot
                                const pipePinsComp = pipe.components.PipedPins;
                                const pipeStaticComp = pipe.components.StaticMapEntity;

                                for (let i = 0; i < pipePinsComp.slots.length; i++) {
                                    const currentSlot = pipePinsComp.slots[i];
                                    if (
                                        pipeStaticComp.localDirectionToWorld(currentSlot.direction) ===
                                        enumInvertedDirections[
                                            staticComp.localDirectionToWorld(acceptor.direction)
                                        ]
                                    ) {
                                        volume = currentSlot.volume;
                                        break;
                                    }
                                }

                                volume = 0;
                            }

                            volumes.push({
                                volume: volume,
                                network: acceptor.linkedNetwork,
                            });
                        }
                    }
                }

                ejector.fluid = fluid;
                if (fluid) {
                    ejector.pressure = pressure;

                    if (doTransfer) {
                        for (let i = 0; i < volumes.length; i++) {
                            const volume = volumes[i];

                            const volumeToMove =
                                tankComp.volume + volume.volume < tankComp.maxVolume
                                    ? volume.volume
                                    : tankComp.maxVolume - tankComp.volume;

                            if (volume.network.currentVolume - volumeToMove > 0) {
                                // Remove from network
                                volume.network.currentVolume -= volumeToMove;

                                // Add to tank
                                tankComp.volume += volumeToMove;
                            }
                        }

                        if (ejector.linkedNetwork) {
                            // Can only eject into pipes
                            const pipe = pinsComp.getConnectedPipe(this.root, entity, ejector);
                            const volume = pipe ? pipe.components.Pipe.volume : 0;

                            if (
                                tankComp.volume >= volume &&
                                ejector.linkedNetwork.currentVolume + volume <=
                                    ejector.linkedNetwork.maxVolume
                            ) {
                                // Remove from tank
                                tankComp.volume -= volume;

                                // Add to ejector
                                ejector.linkedNetwork.currentVolume += volume;
                            }
                        }
                    }
                } else {
                    ejector.pressure = 0;
                }
            }
        }

        if (doTransfer) {
            this.transferVolume = Date.now();
        }
    }

    /**
     * Draws a given chunk
     * @param {import("shapez/core/draw_utils").DrawParameters} parameters
     * @param {MapChunkView} chunk
     */
    drawChunk(parameters, chunk) {
        // @ts-ignore
        const contents = chunk.contents;
        for (let y = 0; y < globalConfig.mapChunkSize; ++y) {
            for (let x = 0; x < globalConfig.mapChunkSize; ++x) {
                const entity = contents[x][y];
                // @ts-ignore
                if (entity && entity.components.Tank) {
                    /** @type {TankComponent} */
                    // @ts-ignore
                    const tankComp = entity.components.Tank;
                    /** @type {PipedPinsComponent} */
                    // @ts-ignore
                    const pinsComp = entity.components.PipedPins;
                    const staticComp = entity.components.StaticMapEntity;

                    const fluid = pinsComp.slots.filter(x => x.type === enumPinSlotType.logicalEjector)[0]
                        .fluid;

                    if (fluid) {
                        parameters.context.strokeStyle = fluid.getBackgroundColorAsResource();

                        let rotated = false;

                        if (staticComp.rotation % 360 === 0) {
                            rotated = false;
                        } else if (staticComp.rotation % 270 === 0) {
                            rotated = true;
                        } else if (staticComp.rotation % 180 === 0) {
                            rotated = false;
                        } else if (staticComp.rotation % 90 === 0) {
                            rotated = true;
                        }

                        parameters.context.beginPath();
                        parameters.context.ellipse(
                            (staticComp.origin.x + 0.5) * globalConfig.tileSize - 0.1,
                            (staticComp.origin.y + 0.5) * globalConfig.tileSize,
                            rotated ? 10.5 : 11.1,
                            rotated ? 11.1 : 10.5,
                            0,
                            (1 / 2) * Math.PI,
                            (tankComp.volume / tankComp.maxVolume) * 2 * Math.PI - (1 / 2) * Math.PI
                        );
                        parameters.context.lineWidth = 1.7;
                        parameters.context.lineCap = "round";
                        parameters.context.stroke();

                        fluid.drawItemCenteredClipped(
                            (staticComp.origin.x + 0.5) * globalConfig.tileSize,
                            (staticComp.origin.y + 0.5) * globalConfig.tileSize,
                            parameters,
                            globalConfig.tileSize
                        );
                    }
                }
            }
        }

        parameters.context.globalAlpha = 1;
    }
}
