import { createLogger } from "shapez/core/logging";
import { Signal } from "shapez/core/signal";
import { GameCore } from "shapez/game/core";
import { MultiplayerPeer } from "../multiplayer/multiplayer_peer";
import { MultiplayerSavegame } from "../multiplayer/multiplayer_savegame";

const logger = createLogger("state/ingame");
import Peer from "simple-peer";
import { ModInterface } from "shapez/mods/mod_interface";
import { GameCreationPayload, GAME_LOADING_STATES, InGameState } from "shapez/states/ingame";
import { HUDSettingsMenu } from "shapez/game/hud/parts/settings_menu";
import { HUDModalDialogs } from "shapez/game/hud/parts/modal_dialogs";
import { wrtc } from "wrtc";
import { config } from "../multiplayer/multiplayer_peer_config";
import { io } from "socket.io-client";
import { T } from "shapez/translations";
import { setupHandleComponentsSignals } from "../multiplayer/multiplayer_packets";

// Different sub-states
const stages = {
    s3_createCore: "s3_createCore",
    s4_A_initEmptyGame: "s4_A_initEmptyGame",
    s4_B_resumeGame: "s4_B_resumeGame",

    s5_firstUpdate: "s5_firstUpdate",
    s6_postLoadHook: "s6_postLoadHook",
    s7_warmup: "s7_warmup",

    s10_gameRunning: "s10_gameRunning",

    leaving: "leaving",
    destroyed: "destroyed",
    initFailed: "initFailed",
};

export const gameCreationAction = {
    new: "new-game",
    resume: "resume-game",
};

// Typehints
export class MultiplayerConnection {
    constructor(id, peer, gameData, host) {
        /** @type {String} */
        this.id = id;

        /** @type {Peer.Instance} */
        this.peer = peer;

        /** @type {object} */
        this.gameData = gameData;

        /**
         * @type {string}*/
        this.host = host;
    }
}

/**
 * @typedef {GameCreationPayload & {
 *      connection: MultiplayerConnection|undefined,
 *      host: String|undefined,
 * }} MultiplayerGameCreationPayload
 *
 * @typedef {InGameState & {
 *      creationPayload: MultiplayerGameCreationPayload,
 *      peer: MultiplayerPeer|undefined,
 *      isMultiplayer:() => boolean,
 *      isHost:() =>  boolean,
 * }} InMultiplayerGameState
 */

/**
 * @param {ModInterface} modInterface
 */
export function createMultiplayerGameState(modInterface) {
    modInterface.extendClass(GameCreationPayload, () => ({
        /** @type {MultiplayerConnection|undefined} */
        connection: undefined,
        /** @type {String|undefined} */
        host: undefined,
    }));

    modInterface.extendClass(InGameState, () => ({
        /**
         * @this {InMultiplayerGameState}
         */
        isMultiplayer() {
            return !!this.creationPayload.host || !!this.creationPayload.connection;
        },

        /**
         * @this {InMultiplayerGameState}
         */
        isHost() {
            return !!this.creationPayload.host;
        },
    }));

    modInterface.replaceMethod(
        InGameState,
        "stage3CreateCore",
        /**
         * @this {InMultiplayerGameState}
         */
        function () {
            if (this.switchStage(stages.s3_createCore)) {
                logger.log("Creating new game core");
                this.core = new GameCore(this.app);

                if (this.isMultiplayer() && !this.isHost()) {
                    // Reopen connection
                    if (!this.creationPayload.connection.peer.writable) {
                        // TODO: get current world
                        const socket = io(this.creationPayload.connection.host, {
                            transports: ["websocket"],
                        });
                        let socketId = undefined;
                        let socketConnectionId = undefined;
                        let peerId = undefined;

                        socket.on("connect_error", () => {
                            this.loadingOverlay.removeIfAttached();
                            //Show error message of connection
                            this.dialogs.showWarning(
                                T.multiplayer.multiplayerGameConnectionError.title,
                                T.multiplayer.multiplayerGameConnectionError.desc.replace(
                                    "<host>",
                                    this.creationPayload.connection.host
                                )
                            );
                        });

                        socket.on("connect", () => {
                            console.log("Connected to the signalling server");
                            socket.on("id", id => {
                                socketId = id;
                                console.log("Got id: " + id);
                                socket.emit("joinRoom", this.creationPayload.connection.id, socketId);
                            });
                            socket.on("error", () => {
                                this.loadingOverlay.removeIfAttached();
                                this.dialogs.showWarning(
                                    T.multiplayer.multiplayerGameError.title,
                                    T.multiplayer.multiplayerGameError.desc + "<br><br>"
                                );
                            });

                            this.creationPayload.connection.peer = new Peer({
                                initiator: false,
                                wrtc: wrtc,
                                config: config,
                            });
                            socket.on("signal", signalData => {
                                if (socketId !== signalData.receiverId) return;
                                console.log("Received signal");
                                console.log(signalData);

                                peerId = signalData.peerId;
                                socketConnectionId = signalData.senderId;
                                this.creationPayload.connection.peer.signal(signalData.signal);
                            });
                            this.creationPayload.connection.peer.on("signal", signalData => {
                                console.log("Send signal");
                                console.log({
                                    receiverId: socketConnectionId,
                                    peerId: peerId,
                                    signal: signalData,
                                    senderId: socketId,
                                });
                                socket.emit("signal", {
                                    receiverId: socketConnectionId,
                                    peerId: peerId,
                                    signal: signalData,
                                    senderId: socketId,
                                });
                            });
                        });
                    }

                    const multiplayerSavegame = new MultiplayerSavegame(
                        this.app,
                        this.creationPayload.connection.gameData
                    );
                    // @ts-ignore
                    this.core.initializeRoot(this, multiplayerSavegame, this.creationPayload.gameModeId);

                    // No saving multiplayer game on remote
                    this.core.root.signals.gameSaved.removeAll();
                    this.core.root.signals.gameSaved.add(
                        this.core.root.hud.parts["gameMenu"].onGameSaved,
                        this
                    );

                    // Check if savegame is valid
                    if (multiplayerSavegame.hasGameDump()) {
                        this.stage4bResumeGame();
                    } else {
                        this.onInitializationFailure("The multiplayer game could not be loaded.");
                    }
                } else {
                    // Default and host
                    this.core.initializeRoot(this, this.savegame, this.gameModeId);

                    if (this.savegame.hasGameDump()) {
                        this.stage4bResumeGame();
                    } else {
                        this.app.gameAnalytics.handleGameStarted();
                        this.stage4aInitEmptyGame();
                    }
                }
            }
        }
    );

    modInterface.runAfterMethod(
        InGameState,
        "stage4bResumeGame",
        /**
         * @this {InMultiplayerGameState}
         */
        function () {
            setupHandleComponentsSignals(this.core.root);
        }
    );

    modInterface.runAfterMethod(
        InGameState,
        "stage10GameRunning",
        /**
         * @this {InMultiplayerGameState}
         */
        function () {
            if (!this.isMultiplayer()) return;

            //Connect
            if (this.isHost()) {
                this.peer = new MultiplayerPeer(this);
            } else {
                this.peer = new MultiplayerPeer(this, this.creationPayload.connection.peer);
            }
        }
    );

    modInterface.runAfterMethod(
        InGameState,
        "stageDestroyed",
        /**
         * @this {InMultiplayerGameState}
         */
        function () {
            if (this.isMultiplayer() && this.peer) {
                //Disconnect peers
                if (this.creationPayload.connection) {
                    this.creationPayload.connection.peer.destroy();
                } else {
                    for (let i = 0; i < this.peer.connections.length; i++) {
                        this.peer.connections[i].peer.destroy();
                    }
                }
            }
        }
    );

    modInterface.replaceMethod(
        HUDSettingsMenu,
        "shouldPauseGame",
        /**
         * @this {HUDSettingsMenu}
         */
        function () {
            if (/** @type {InMultiplayerGameState}*/ (this.root.gameState).isMultiplayer()) {
                return false;
            } else {
                return this.visible;
            }
        }
    );

    modInterface.replaceMethod(
        HUDSettingsMenu,
        "shouldPauseRendering",
        /**
         * @this {HUDSettingsMenu}
         */
        function () {
            if (/** @type {InMultiplayerGameState}*/ (this.root.gameState).isMultiplayer()) {
                return false;
            } else {
                return this.visible;
            }
        }
    );

    modInterface.replaceMethod(
        HUDModalDialogs,
        "shouldPauseRendering",
        /**
         * @this {HUDModalDialogs}
         */
        function () {
            if (/** @type {InMultiplayerGameState}*/ (this.root.gameState).isMultiplayer()) {
                return false;
            } else {
                return this.dialogStack.length > 0;
            }
        }
    );
}
