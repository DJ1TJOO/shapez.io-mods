import { enumInvertedDirections } from "shapez/core/vector";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { enumPinSlotType, PipedPinsComponent } from "../components/pipe_pins";
import { TankComponent } from "../components/tank";

export class TankSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [TankComponent]);

        this.transferVolume = Date.now();
    }

    update() {
        // Transfer every 500 miliseconds
        const doTransfer = Date.now() - this.transferVolume > 500;

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
                 * @TODO fix tank sprite
                 * */
                let fluid = null;
                let pressure = 0;
                let volumes = [];
                for (let i = 0; i < acceptors.length; i++) {
                    const acceptor = acceptors[i];
                    if (!fluid) {
                        fluid = acceptor.fluid;
                    } else if (fluid !== acceptor.fluid) {
                        fluid = null;
                        break;
                    }

                    pressure += acceptor.pressure;

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
                                staticComp.localDirectionToWorld(acceptor.direction);

                                for (let i = 0; i < pipePinsComp.slots.length; i++) {
                                    const currentSlot = pipePinsComp.slots[i];
                                    if (
                                        pipeStaticComp.localDirectionToWorld(acceptor.direction) ===
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

                            if (tankComp.volume + volume.volume <= tankComp.maxVolume) {
                                // Remove from network
                                volume.network.currentVolume -= volume.volume;

                                // Add to tank
                                tankComp.volume += volume.volume;
                            }
                        }

                        if (ejector.linkedNetwork) {
                            const pipe = pinsComp.getConnectedPipe(this.root, entity, ejector);
                            const volume = pipe ? pipe.components.Pipe.volume : 0;

                            if (tankComp.volume >= volume) {
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
}
