import { createLogger } from "shapez/core/logging";
import { GameCore } from "shapez/game/core";
import { MultiplayerPeer } from "../multiplayer/multiplayer_peer";
import { MultiplayerSavegame } from "../multiplayer/multiplayer_savegame";

const logger = createLogger("state/ingame");
import { ModInterface } from "shapez/mods/mod_interface";
import { GameCreationPayload, InGameState } from "shapez/states/ingame";
import { HUDSettingsMenu } from "shapez/game/hud/parts/settings_menu";
import { HUDModalDialogs } from "shapez/game/hud/parts/modal_dialogs";
import { io } from "socket.io-client";
import { T } from "shapez/translations";
import {
    FlagPacketFlags,
    MultiplayerPacket,
    MultiplayerPacketTypes,
    setupHandleComponentsSignals,
    TextPacket,
    TextPacketTypes,
} from "../multiplayer/multiplayer_packets";
import { Dialog } from "shapez/core/modal_dialog_elements";
import { MODS } from "shapez/mods/modloader";

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
    /**
     * @param {String} id
     * @param {import("../multiplayer/multiplayer_peer").SocketInfo} socket
     * @param {object} gameData
     * @param {String} host
     */
    constructor(id, socket, gameData, host) {
        /** @type {String} */
        this.id = id;

        /** @type {import("../multiplayer/multiplayer_peer").SocketInfo} */
        this.socket = socket;

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
 *      socket: MultiplayerPeer|undefined,
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
        async function () {
            if (this.switchStage(stages.s3_createCore)) {
                logger.log("Creating new game core");
                this.core = new GameCore(this.app);

                if (this.isMultiplayer() && !this.isHost()) {
                    // Reopen connection
                    if (!this.creationPayload.connection.socket.socket.connected) {
                        this.creationPayload.connection = await new Promise(resolve => {
                            const socket = io(this.creationPayload.connection.host, {
                                transports: ["websocket"],
                            });
                            let socketId = undefined;
                            let hostSocketId = undefined;

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
                                    socket.emit(
                                        "joinRoom",
                                        this.creationPayload.connection.socket.connectionId,
                                        socketId
                                    );
                                });
                                socket.on("error", () => {
                                    this.loadingOverlay.removeIfAttached();
                                    this.dialogs.showWarning(
                                        T.multiplayer.multiplayerGameError.title,
                                        T.multiplayer.multiplayerGameError.desc + "<br><br>"
                                    );
                                });

                                socket.on("signal", signalData => {
                                    if (socketId !== signalData.receiverId) return;

                                    hostSocketId = signalData.senderId;
                                    onMessage(signalData.signal);
                                });

                                let gameDataState = -1;
                                let gameData = "";

                                const canceled = (title, description) => {
                                    socket.disconnect();
                                    this.loadingOverlay.removeIfAttached();

                                    //Show error message of room
                                    const dialog = new Dialog({
                                        app: this.app,
                                        title: title,
                                        contentHTML: description,
                                        buttons: ["ok:good"],
                                    });
                                    this.dialogs.internalShowDialog(dialog);

                                    // @ts-ignore
                                    dialog.buttonSignals.ok.add(() => {
                                        this.moveToState("MainMenuState");
                                        resolve(null);
                                    });
                                };

                                const onMessage = data => {
                                    const packet = JSON.parse(data);

                                    //When data ends
                                    if (
                                        packet.type === MultiplayerPacketTypes.FLAG &&
                                        packet.flag === FlagPacketFlags.ENDDATA
                                    ) {
                                        gameDataState = 1;
                                        let gameDataJson = JSON.parse(gameData);
                                        console.log(gameDataJson);

                                        for (let i = 0; i < MODS.mods.length; i++) {
                                            const mod = MODS.mods[i];
                                            if (!gameDataJson.mods.includes(mod.metadata.id))
                                                return canceled(
                                                    T.multiplayer.notSameMods.title,
                                                    T.multiplayer.notSameMods.desc
                                                );
                                        }
                                        for (let i = 0; i < gameDataJson.mods.length; i++) {
                                            const modId = gameDataJson.mods[i];
                                            if (!MODS.mods.some(x => x.metadata.id === modId))
                                                return canceled(
                                                    T.multiplayer.notSameMods.title,
                                                    T.multiplayer.notSameMods.desc
                                                );
                                        }

                                        const connection = new MultiplayerConnection(
                                            this.creationPayload.connection.socket.connectionId,
                                            {
                                                socket,
                                                connectionId:
                                                    this.creationPayload.connection.socket.connectionId,
                                                id: socketId,
                                                hostSocketId,
                                            },
                                            gameDataJson,
                                            this.creationPayload.connection.host
                                        );
                                        resolve(connection);
                                    }

                                    //When data recieved
                                    if (packet.type === MultiplayerPacketTypes.DATA && gameDataState === 0)
                                        gameData = gameData + packet.data;

                                    //When start data
                                    if (
                                        packet.type === MultiplayerPacketTypes.FLAG &&
                                        packet.flag === FlagPacketFlags.STARTDATA
                                    ) {
                                        gameDataState = 0;
                                    }
                                };
                                setTimeout(() => {
                                    if (gameDataState === 1) return;
                                    canceled(
                                        T.multiplayer.multiplayerGameError.multiplayerGameConnectionError,
                                        T.multiplayer.multiplayerGameError.multiplayerGameConnectionError.replace(
                                            "<host>",
                                            this.creationPayload.connection.host + ": Connection timed out"
                                        )
                                    );
                                }, 1000 * 60);
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
                this.socket = new MultiplayerPeer(this);
            } else {
                this.socket = new MultiplayerPeer(this, this.creationPayload.connection.socket);
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
            if (this.isMultiplayer() && this.socket) {
                //Disconnect
                if (this.socket.socket.hostSocketId) {
                    MultiplayerPacket.sendPacket(
                        this.socket.socket,
                        this.socket.socket.hostSocketId,
                        new TextPacket(
                            TextPacketTypes.USER_DISCONNECTED,
                            JSON.stringify({ user: this.socket.user, socketId: this.socket.socket.id })
                        )
                    );
                } else {
                    this.socket.socket.socket.emit("destroyRoom", this.socket.socket.connectionId);
                }

                this.socket.leaving = true;
                this.socket.socket.socket.disconnect();
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
