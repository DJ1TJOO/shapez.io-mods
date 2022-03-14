import { Dialog } from "shapez/core/modal_dialog_elements";
import { Vector } from "shapez/core/vector";
import { getBuildingDataFromCode } from "shapez/game/building_codes";
import { MODS } from "shapez/mods/modloader";
import { types } from "shapez/savegame/serialization";
import { T } from "shapez/translations";
import { MultiplayerBuilder } from "./multiplayer_builder";
import {
    MultiplayerPacket,
    TextPacket,
    TextPacketTypes,
    SignalPacket,
    SignalPacketSignals,
    StringSerializable,
    DataPacket,
    FlagPacket,
    FlagPacketFlags,
    MultiplayerPacketTypes,
    handleComponents,
    setupHandleComponents,
} from "./multiplayer_packets";

import { v4 } from "uuid";
import io, { Socket } from "socket.io-client";
import { enumNotificationType } from "shapez/game/hud/parts/notifications";
import { StaticMapEntityComponent } from "shapez/game/components/static_map_entity";
import { getMod } from "../getMod";
import { enumColors, enumColorToShortcode } from "shapez/game/colors";

/**
 * @typedef {{
 * socket: Socket,
 * id: string,
 * connectionId: string,
 * hostSocketId?: string,
 * }} SocketInfo
 */

export class MultiplayerPeer {
    /**
     * @param {import ("../states/multiplayer_ingame").InMultiplayerGameState} ingameState
     * @param {SocketInfo | null} socket
     */
    constructor(ingameState, socket = null) {
        this.ingameState = ingameState;
        this.multiplayerPlace = [];
        this.multiplayerDestroy = [];
        this.multipalyerComponentAdd = [];
        this.multipalyerComponentRemove = [];
        this.multipalyerUnlockUpgrade = [];
        this.multiplayerConstantSignalChange = [];
        this.multiplayerColorCodedChange = [];

        this.leaving = false;

        this.user = {
            _id: v4(),
            username: getMod().settings.user.name,
            color: enumColors.uncolored,
        };
        this.users = [];

        if (this.ingameState.isHost()) {
            /**
             * @type {Array<{
             *  id: String,
             *  user?: Object
             * }>}
             */
            this.connections = [];
            this.setupHost();
        } else {
            this.socket = socket;
            this.setupClient();
        }

        this.builder = new MultiplayerBuilder(this.ingameState, this);
    }

    setupHost() {
        const connectionId = v4();

        const socket = io(this.ingameState.creationPayload.host, { transports: ["websocket"] });
        let socketId = undefined;

        socket.on("connect", () => {
            //Get socket id
            socket.on("id", id => {
                socketId = id;

                // Set socket
                this.socket = {
                    socket,
                    id: socketId,
                    connectionId: connectionId,
                };

                //Show uuid of room
                const dialog = new Dialog({
                    app: this.ingameState.app,
                    title: T.multiplayer.shareCode,
                    contentHTML: `
            <a id="share-connection-${this.socket.connectionId}" onclick="function fallbackCopyTextToClipboard(o){var e=document.createElement('textarea');e.value=o,e.style.top='0',e.style.left='0',e.style.position='fixed',document.body.appendChild(e),e.focus(),e.select();try{document.execCommand('copy')}catch(o){console.error('Fallback: Oops, unable to copy',o)}document.body.removeChild(e)}event.preventDefault();let copyTextToClipboard=o=>{navigator.clipboard?navigator.clipboard.writeText(o).then(function(){},function(o){console.error('Async: Could not copy text: ',o)}):fallbackCopyTextToClipboard(o)};copyTextToClipboard('${this.socket.connectionId}');">${this.socket.connectionId}</a>
                  `,
                    buttons: ["ok:good"],
                });
                this.ingameState.core.root.hud.parts.dialogs.internalShowDialog(dialog);
            });

            //Create room on server
            socket.emit("createRoom", connectionId);

            //Create peer
            socket.on("createPeer", async ({ receiverId }) => {
                console.log("connected");

                this.onOpen(receiverId);
                this.connections.push({ id: receiverId });
            });

            //Handle events
            socket.on("signal", signalData => {
                if (this.socket.id !== signalData.receiverId) return;

                this.onMessage(signalData.senderId, signalData.signal);
            });
        });

        socket.on("error", err => {
            console.error(err);
        });

        socket.on("connect_error", () => {
            this.ingameState.saveThenGoToState("MainMenuState", {
                loadError: "Failed to connect to server: " + this.ingameState.creationPayload.host,
            });
        });

        socket.on("disconnect", () => {
            console.log(socketId + " closed");
        });
    }

    setupClient() {
        // Socket aleady connected, only add events
        this.onOpen(this.socket.hostSocketId);
        this.socket.socket.on("signal", signalData => {
            if (this.socket.id !== signalData.receiverId) return;

            this.onMessage(signalData.senderId, signalData.signal);
        });
        this.socket.socket.on("disconnect", () => {
            console.log(this.socket.connectionId + " closed");
            this.ingameState.stageLeavingGame();
            if (!this.leaving) {
                this.ingameState.moveToState("MainMenuState", {
                    loadError: "Host disconnected",
                });
            } else {
                this.ingameState.moveToState("MainMenuState");
            }
        });
        this.socket.socket.on("error", err => {
            console.error(err);
        });
    }

    /**
     * Handels events and send packets
     */
    async onOpen(receiverId) {
        setupHandleComponents(this, receiverId);

        // Add singal handlers
        this.ingameState.core.root.signals.entityAdded.add(this.entityAddedHandler.bind(this, receiverId));

        this.ingameState.core.root.signals.entityDestroyed.add(
            this.entityDestroyedHandler.bind(this, receiverId)
        );

        this.ingameState.core.root.signals.upgradePurchased.add(
            this.upgradePurchasedHandler.bind(this, receiverId)
        );

        this.ingameState.core.root.hud.parts.buildingPlacer.signals.variantChanged.add(
            this.variantChangedHandler.bind(this, receiverId)
        );

        // Send data to new client
        if (this.ingameState.isHost()) {
            await this.ingameState.doSave();
            const dataPackets = DataPacket.createFromData(
                {
                    mods: MODS.mods.map(x => x.metadata.id),
                    version: this.ingameState.savegame.getCurrentVersion(),
                    dump: this.ingameState.savegame.getCurrentDump(),
                    stats: this.ingameState.savegame.getStatistics(),
                    lastUpdate: this.ingameState.savegame.getRealLastUpdate(),
                },
                600
            );

            MultiplayerPacket.sendPacket(this.socket, receiverId, new FlagPacket(FlagPacketFlags.STARTDATA));
            for (let i = 0; i < dataPackets.length; i++) {
                MultiplayerPacket.sendPacket(this.socket, receiverId, dataPackets[i]);
            }
            MultiplayerPacket.sendPacket(this.socket, receiverId, new FlagPacket(FlagPacketFlags.ENDDATA));
        } else {
            // Send user joined to host
            MultiplayerPacket.sendPacket(
                this.socket,
                receiverId,
                new TextPacket(TextPacketTypes.USER_JOINED, JSON.stringify(this.user))
            );
        }
    }

    //Handels incomming packets
    onMessage(senderId, data) {
        const packet = JSON.parse(data);

        // Send next or recieved packet
        if (packet.type === MultiplayerPacketTypes.FLAG && packet.flag === FlagPacketFlags.RECEIVED_PACKET) {
            MultiplayerPacket.sendNextPacket(packet);
        } else {
            MultiplayerPacket.handleReceivedPacket(this.socket, senderId, packet);
        }

        // Handle signal packets
        if (packet.type === MultiplayerPacketTypes.SIGNAL) {
            this.signalPacketHandler(packet);
        } else if (packet.type === MultiplayerPacketTypes.TEXT) {
            // Handle text packets
            this.textPacketHandler(packet, senderId);
        }
    }

    resetTileTo(origin, entity) {
        if (entity) {
            const staticMapEntity = entity.components.StaticMapEntity;

            for (let i = 0; i < this.connections.length; i++) {
                MultiplayerPacket.sendPacket(
                    this.socket,
                    this.connections[i].id,
                    new SignalPacket(SignalPacketSignals.setTile, [
                        types.tileVector.serialize(origin),
                        types.float.serialize(staticMapEntity.originalRotation),
                        types.float.serialize(staticMapEntity.rotation),
                        types.uintOrString.serialize(staticMapEntity.code),
                    ]),
                    this.connections
                );
            }
        } else {
            for (let i = 0; i < this.connections.length; i++) {
                MultiplayerPacket.sendPacket(
                    this.socket,
                    this.connections[i].id,
                    new SignalPacket(SignalPacketSignals.setTile, [types.tileVector.serialize(origin)]),
                    this.connections
                );
            }
        }
    }

    entityAddedHandler(receiverId, entity) {
        const multiplayerId = this.multiplayerPlace.findIndex(origin =>
            origin.equals(entity.components.StaticMapEntity.origin)
        );
        if (multiplayerId > -1) return this.multiplayerPlace.splice(multiplayerId, 1);

        /** @type {StaticMapEntityComponent} */
        const staticMapEntity = entity.components.StaticMapEntity;
        MultiplayerPacket.sendPacket(
            this.socket,
            receiverId,
            new SignalPacket(SignalPacketSignals.entityAdded, [
                types.tileVector.serialize(staticMapEntity.origin),
                types.float.serialize(staticMapEntity.originalRotation),
                types.float.serialize(staticMapEntity.rotation),
                types.uintOrString.serialize(staticMapEntity.code),
            ])
        );

        handleComponents(entity, this.ingameState.core.root);

        // Add color @ColorCoded
        if (entity.components.ColorCoded) {
            entity.components.ColorCoded.color = enumColorToShortcode[this.user.color];
        }
    }

    entityDestroyedHandler(receiverId, entity) {
        const multiplayerId = this.multiplayerDestroy.findIndex(origin =>
            origin.equals(entity.components.StaticMapEntity.origin)
        );
        if (multiplayerId > -1) return this.multiplayerDestroy.splice(multiplayerId, 1);

        MultiplayerPacket.sendPacket(
            this.socket,
            receiverId,
            new SignalPacket(SignalPacketSignals.entityDestroyed, [
                types.tileVector.serialize(entity.components.StaticMapEntity.origin),
            ])
        );
    }

    upgradePurchasedHandler(receiverId, upgradeId) {
        if (this.multipalyerUnlockUpgrade.includes(upgradeId)) {
            return this.multipalyerUnlockUpgrade.splice(this.multipalyerUnlockUpgrade.indexOf(upgradeId), 1);
        }

        MultiplayerPacket.sendPacket(
            this.socket,
            receiverId,
            new SignalPacket(SignalPacketSignals.upgradePurchased, [new StringSerializable(upgradeId)])
        );
    }

    variantChangedHandler(receiverId) {
        const metaBuilding = this.ingameState.core.root.hud.parts.buildingPlacer.currentMetaBuilding.get();
        if (!metaBuilding) {
            this.user.currentMetaBuilding = null;
        } else {
            this.user.currentMetaBuilding = metaBuilding.getId();
        }

        this.user.currentVariant = this.ingameState.core.root.hud.parts.buildingPlacer.currentVariant.get();
        this.user.currentBaseRotation =
            this.ingameState.core.root.hud.parts.buildingPlacer.currentBaseRotation;

        const mousePosition = this.ingameState.core.root.app.mousePosition;
        if (!mousePosition) {
            this.user.mouseTile = null;
        } else {
            this.user.worldPos = this.ingameState.core.root.camera.screenToWorld(mousePosition);
            this.user.mouseTile = this.user.worldPos.toTileSpace();
        }

        MultiplayerPacket.sendPacket(
            this.socket,
            receiverId,
            new TextPacket(TextPacketTypes.USER_UPDATE, JSON.stringify(this.user))
        );
    }

    signalPacketHandler(packet) {
        packet.args = MultiplayerPacket.deserialize(packet.args, this.ingameState.core.root);

        // Send packets to other players if host
        if (this.ingameState.isHost()) {
            for (let i = 0; i < this.connections.length; i++) {
                MultiplayerPacket.sendPacket(
                    this.socket,
                    this.connections[i].id,
                    new SignalPacket(packet.signal, packet.args),
                    this.connections
                );
            }
        }

        // Handle packets
        if (packet.signal === SignalPacketSignals.setTile) {
            const origin = new Vector(packet.args[0].x, packet.args[0].y);

            const originalRotation = packet.args[1];
            const rotation = packet.args[2];
            const buildingData = getBuildingDataFromCode(packet.args[3]);

            const entity = this.builder.findByOrigin(this.ingameState.core.root.entityMgr, origin);
            if (entity !== null) {
                this.builder.freeEntityAreaBeforeBuild(entity, true);
            }

            if (originalRotation && rotation && buildingData) {
                this.builder.tryPlaceCurrentBuildingAt(origin, {
                    origin: origin,
                    originalRotation: originalRotation,
                    rotation: rotation,
                    rotationVariant: buildingData.rotationVariant,
                    variant: buildingData.variant,
                    building: buildingData.metaInstance,
                });
            }
        } else if (packet.signal === SignalPacketSignals.entityAdded) {
            const origin = new Vector(packet.args[0].x, packet.args[0].y);
            const originalRotation = packet.args[1];
            const rotation = packet.args[2];
            const buildingData = getBuildingDataFromCode(packet.args[3]);

            this.multiplayerPlace.push(origin);
            if (
                !this.builder.tryPlaceCurrentBuildingAt(origin, {
                    origin: origin,
                    originalRotation: originalRotation,
                    rotation: rotation,
                    rotationVariant: buildingData.rotationVariant,
                    variant: buildingData.variant,
                    building: buildingData.metaInstance,
                }) &&
                this.ingameState.isHost()
            ) {
                const entity = this.builder.findByOrigin(this.ingameState.core.root.entityMgr, origin);
                this.resetTileTo(origin, entity);
            }
        } else if (packet.signal === SignalPacketSignals.entityDestroyed) {
            const origin = new Vector(packet.args[0].x, packet.args[0].y);
            const entity = this.builder.findByOrigin(this.ingameState.core.root.entityMgr, origin);

            if (entity !== null) {
                this.multiplayerDestroy.push(origin);
                if (
                    !this.ingameState.core.root.logic.tryDeleteBuilding(entity) &&
                    this.ingameState.isHost()
                ) {
                    this.resetTileTo(origin, entity);
                }
            } else if (this.ingameState.isHost()) {
                this.resetTileTo(origin);
            }
        } else if (packet.signal === SignalPacketSignals.entityComponentChanged) {
            const entity = this.builder.findByOrigin(this.ingameState.core.root.entityMgr, packet.args[0]);

            const component = packet.args[1];
            if (entity === null) return;

            const id = component.constructor.getId();
            if (id === "ConstantSignal") {
                this.multiplayerConstantSignalChange.push(entity.components.StaticMapEntity.origin);
            } else if (id === "ColorCoded") {
                this.multiplayerColorCodedChange.push(entity.components.StaticMapEntity.origin);
            }

            for (const key in component) {
                if (!component.hasOwnProperty(key)) continue;
                entity.components[id][key] = component[key];
            }
        } else if (packet.signal === SignalPacketSignals.upgradePurchased) {
            this.multipalyerUnlockUpgrade.push(packet.args[0].value);
            this.ingameState.core.root.hubGoals.tryUnlockUpgrade(packet.args[0].value);
        }
    }

    textPacketHandler(packet, socketId) {
        packet.text = TextPacket.decompress(packet.text);
        if (packet.textType === TextPacketTypes.USER_JOINED) {
            const user = JSON.parse(packet.text);

            //Send to other clients
            if (this.ingameState.isHost()) {
                for (let i = 0; i < this.connections.length; i++) {
                    if (this.connections[i].id === socketId) continue;
                    MultiplayerPacket.sendPacket(
                        this.socket,
                        this.connections[i].id,
                        new TextPacket(TextPacketTypes.USER_JOINED, packet.text),
                        this.connections
                    );
                }

                MultiplayerPacket.sendPacket(
                    this.socket,
                    socketId,
                    new TextPacket(TextPacketTypes.HOST_USER, JSON.stringify(this.user)),
                    this.connections
                );
            }

            if (this.ingameState.isHost()) {
                this.connections.find(x => x.id === socketId).user = user;

                // Get colors
                const userColors = this.users.map(x => x.color);
                const colors = Object.values(enumColors);

                // Find unused color
                let color = null;
                for (let i = 0; i < colors.length; i++) {
                    const currentColor = colors[i];
                    if (this.user.color === currentColor || userColors.includes(currentColor)) {
                        continue;
                    }

                    color = currentColor;
                    break;
                }

                // All colors taken choose random
                if (color === null) {
                    color = colors[Math.floor(Math.random() * colors.length)];
                }

                // Set color
                user.color = color;

                // Send user update
                for (let i = 0; i < this.connections.length; i++) {
                    MultiplayerPacket.sendPacket(
                        this.socket,
                        this.connections[i].id,
                        new TextPacket(TextPacketTypes.USER_UPDATE, JSON.stringify(user)),
                        this.connections
                    );
                }
            }

            //Add user
            this.users.push(user);

            this.ingameState.core.root.hud.parts["notifications"].internalShowNotification(
                T.multiplayer.user.joined.replaceAll("<username>", user.username),
                enumNotificationType.success
            );
        } else if (packet.textType === TextPacketTypes.USER_DISCONNECTED) {
            const { user, socketId } = JSON.parse(packet.text);
            this.ingameState.core.root.hud.parts["notifications"].internalShowNotification(
                T.multiplayer.user.disconnected.replaceAll("<username>", user.username),
                enumNotificationType.success
            );
            this.users.splice(this.users.indexOf(user), 1);

            if (this.ingameState.isHost()) {
                const connection = this.connections.find(x => x.id === socketId);
                if (!connection) return;

                // Handle user disconnect
                if (
                    connection.user &&
                    this.ingameState &&
                    this.ingameState.core &&
                    this.ingameState.core.root
                ) {
                    // Send disconnect packets
                    for (let i = 0; i < this.connections.length; i++) {
                        if (this.connections[i].id === socketId) continue;
                        MultiplayerPacket.sendPacket(
                            this.socket,
                            this.connections[i].id,
                            new TextPacket(
                                TextPacketTypes.USER_DISCONNECTED,
                                JSON.stringify(connection.user)
                            ),
                            this.connections
                        );
                    }
                }
                this.connections.splice(this.connections.indexOf(connection), 1);
            }
        } else if (packet.textType === TextPacketTypes.HOST_USER) {
            const user = JSON.parse(packet.text);

            //Add user
            this.users.push(user);
        } else if (packet.textType === TextPacketTypes.USER_UPDATE) {
            const user = JSON.parse(packet.text);

            //Send to other clients
            if (this.ingameState.isHost()) {
                for (let i = 0; i < this.connections.length; i++) {
                    if (this.connections[i].id === socketId) continue;
                    MultiplayerPacket.sendPacket(
                        this.socket,
                        this.connections[i].id,
                        new TextPacket(TextPacketTypes.USER_UPDATE, packet.text),
                        this.connections
                    );
                }
            }

            //Update user
            if (this.user._id === user._id) {
                this.user = user;
            } else {
                const index = this.users.findIndex(x => x._id === user._id);
                if (index >= 0) {
                    for (const key in user) {
                        this.users[index][key] = user[key];
                    }
                } else {
                    this.users.push(user);
                }
            }

            if (this.ingameState.isHost()) {
                this.connections.find(x => x.id === socketId).user = user;
            }
        } else if (packet.textType === TextPacketTypes.MESSAGE) {
            this.ingameState.core.root.hud.parts["notifications"].internalShowNotification(
                packet.text,
                // @ts-ignore
                enumNotificationType.message
            );
        }
    }
}
