import { globalConfig } from "shapez/core/config";
import { clamp } from "shapez/core/utils";
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
        const transferRate = (Date.now() - this.transferVolume) / 1000;

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

                let fluid = tankComp.fluid;
                let pressures = [];
                let volumes = [];
                for (let i = 0; i < acceptors.length; i++) {
                    const acceptor = acceptors[i];

                    // Get fluid
                    if (!acceptor.fluid) {
                        continue;
                    } else if (!fluid) {
                        // Set fluid
                        fluid = acceptor.fluid;
                    } else if (fluid !== acceptor.fluid) {
                        // Fluid conflict
                        fluid = null;
                        break;
                    }

                    // Get local pressure on pin
                    const pressure = pinsComp.getLocalPressure(this.root, entity, acceptor);
                    if (pressure > 0) {
                        pressures.push(pressure);
                    }

                    if (acceptor.linkedNetwork) {
                        const pipe = pinsComp.getConnectedPipe(this.root, entity, acceptor);

                        // Get volume
                        let volume = 0;
                        if (pipe.components.Pipe) {
                            // Get max volume of pipe
                            volume = pipe.components.Pipe.maxVolume;
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
                                    // Defaults to max volume of 50 when no pipes
                                    if (currentSlot.linkedNetwork) {
                                        volume = currentSlot.linkedNetwork.maxVolume;
                                    }
                                    break;
                                }
                            }
                        }

                        volumes.push({
                            volume: volume,
                            network: acceptor.linkedNetwork,
                        });
                    }
                }

                ejector.fluid = fluid;
                if (fluid) {
                    let pressure = 0;

                    if (pressures.length > 0) {
                        const totalPressure = pressures.reduce((prev, curr) => prev + curr, 0);
                        pressure = Math.round(totalPressure / pressures.length);
                    }

                    if (pressure <= 0 && tankComp.pressure > 0) {
                        ejector.pressure = tankComp.pressure;
                    } else {
                        ejector.pressure = pressure;
                        tankComp.pressure = pressure;
                    }

                    tankComp.fluid = fluid;

                    for (let i = 0; i < volumes.length; i++) {
                        const volume = volumes[i];

                        let volumeToMove = 0;
                        if (tankComp.volume + volume.volume < tankComp.maxVolume) {
                            volumeToMove = volume.volume;
                        } else {
                            volumeToMove = tankComp.maxVolume - tankComp.volume;
                        }

                        if (volume.network.currentVolume - volumeToMove < 0) {
                            volumeToMove = volume.network.currentVolume;
                        }

                        const maxRate =
                            volume.volume * transferRate > 1
                                ? Math.round(volume.volume * transferRate)
                                : volume.volume;
                        if (volumeToMove > maxRate) {
                            volumeToMove = maxRate;
                        }

                        // Remove from network
                        volume.network.currentVolume -= volumeToMove;

                        // Add to tank
                        tankComp.volume += volumeToMove;
                    }

                    if (ejector.linkedNetwork) {
                        // Can only eject into pipes
                        const pipe = pinsComp.getConnectedPipe(this.root, entity, ejector);

                        let volumeToMove = 0;
                        if (pipe.components.Pipe) {
                            volumeToMove = pipe.components.Pipe.maxVolume;
                        } else if (pipe.components.PipedPins) {
                            // Get correct slot
                            const pipePinsComp = pipe.components.PipedPins;
                            const pipeStaticComp = pipe.components.StaticMapEntity;

                            for (let i = 0; i < pipePinsComp.slots.length; i++) {
                                const currentSlot = pipePinsComp.slots[i];
                                if (
                                    pipeStaticComp.localDirectionToWorld(currentSlot.direction) ===
                                    enumInvertedDirections[
                                        staticComp.localDirectionToWorld(ejector.direction)
                                    ]
                                ) {
                                    if (currentSlot.linkedNetwork) {
                                        volumeToMove = currentSlot.linkedNetwork.maxVolume;
                                    }
                                    break;
                                }
                            }
                        }

                        const maxRate =
                            volumeToMove * transferRate > 1
                                ? Math.round(volumeToMove * transferRate)
                                : volumeToMove;

                        if (tankComp.volume < volumeToMove) {
                            volumeToMove = tankComp.volume;
                        }

                        if (
                            ejector.linkedNetwork.currentVolume + volumeToMove >=
                            ejector.linkedNetwork.maxVolume
                        ) {
                            volumeToMove =
                                ejector.linkedNetwork.maxVolume - ejector.linkedNetwork.currentVolume;
                        }

                        if (volumeToMove > maxRate) {
                            volumeToMove = maxRate;
                        }

                        // Remove from tank
                        tankComp.volume -= volumeToMove;

                        // Add to ejector
                        ejector.linkedNetwork.currentVolume += volumeToMove;
                    }

                    if (tankComp.volume <= 0) {
                        tankComp.pressure = 0;
                        tankComp.fluid = null;
                    }
                }
            }
        }

        this.transferVolume = Date.now();
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
                    const staticComp = entity.components.StaticMapEntity;

                    if (tankComp.fluid) {
                        if (tankComp.volume > 0) {
                            parameters.context.strokeStyle = tankComp.fluid.getBackgroundColorAsResource();

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
                                (staticComp.origin.x + 0.5) * globalConfig.tileSize,
                                (staticComp.origin.y + 0.5) * globalConfig.tileSize,
                                11.1,
                                11.1,
                                0,
                                0,
                                (tankComp.volume / tankComp.maxVolume) * 2 * Math.PI
                            );
                            parameters.context.lineWidth = 1.7;
                            parameters.context.lineCap = "round";
                            parameters.context.stroke();
                        }

                        tankComp.fluid.drawItemCenteredClipped(
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
