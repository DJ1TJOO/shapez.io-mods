import { getLogoSprite } from "shapez/core/background_resources_loader";
import { cachebust } from "shapez/core/cachebust";
import { GameState } from "shapez/core/game_state";
import { BUILD_OPTIONS } from "shapez/core/globals";
import { DialogWithForm, Dialog } from "shapez/core/modal_dialog_elements";
import { FormElementInput } from "shapez/core/modal_dialog_forms";
import {
    isSupportedBrowser,
    removeAllChildren,
    makeDivElement,
    makeButton,
    makeDiv,
    formatSecondsToTimeAgo,
} from "shapez/core/utils";
import { GameLoadingOverlay } from "shapez/game/game_loading_overlay";
import { HUDModalDialogs } from "shapez/game/hud/parts/modal_dialogs";
import { T } from "shapez/translations";
import user from "../user";
import io from "socket.io-client";
import wrtc from "wrtc";
import Peer from "simple-peer";
import { MODS } from "shapez/mods/modloader";
import { MultiplayerPacketTypes, FlagPacketFlags } from "../multiplayer/multiplayer_packets";
import { MultiplayerConnection } from "./multiplayer_ingame";

export class MultiplayerState extends GameState {
    constructor() {
        super("MultiplayerState");
    }

    getInnerHTML() {
        const showLanguageIcon = !BUILD_OPTIONS.CHINA_VERSION && !BUILD_OPTIONS.WEGAME_VERSION;
        const showExitAppButton = BUILD_OPTIONS.IS_STANDALONE;
        const showUpdateLabel = !BUILD_OPTIONS.WEGAME_VERSION;
        const showBrowserWarning = !BUILD_OPTIONS.IS_STANDALONE && !isSupportedBrowser();

        return `
            <div class="topButtons">
                ${
                    showLanguageIcon
                        ? `<button class="languageChoose" data-languageicon="${this.app.settings.getLanguage()}"></button>`
                        : ""
                }

                <button class="settingsButton"></button>
                ${showExitAppButton ? `<button class="exitAppButton"></button>` : ""}
            </div>

            <video autoplay muted loop class="fullscreenBackgroundVideo">
                <source src="${cachebust("res/bg_render.webm")}" type="video/webm">
            </video>

            <div class="logo">
                <img src="${cachebust("res/" + getLogoSprite())}" alt="shapez.io Logo">
                ${showUpdateLabel ? `<span class="updateLabel">MODS UPDATE!</span>` : ""}
            </div>

            <div class="mainWrapper" data-columns="1">
                <div class="mainContainer">
                    ${
                        showBrowserWarning
                            ? `<div class="browserWarning">${T.mainMenu.browserWarning}</div>`
                            : ""
                    }
                    <div class="buttons"></div>
                </div>
            </div>
            <div class="footer"></div>
        `;
    }

    onEnter(payload) {
        this.dialogs = new HUDModalDialogs(null, this.app);
        const dialogsElement = document.body.querySelector(".modalDialogParent");
        this.dialogs.initializeToElement(dialogsElement);

        if (payload.loadError) {
            this.dialogs.showWarning(
                T.dialogs.gameLoadFailure.title,
                T.dialogs.gameLoadFailure.text + "<br><br>" + payload.loadError
            );
        }

        // Initialize video
        this.videoElement = this.htmlElement.querySelector("video");
        this.videoElement.playbackRate = 0.9;
        this.videoElement.addEventListener("canplay", () => {
            if (this.videoElement) {
                this.videoElement.classList.add("loaded");
            }
        });

        const clickHandling = {
            ".settingsButton": this.onSettingsButtonClicked,
            ".languageChoose": this.onLanguageChooseClicked,
            ".exitAppButton": this.onExitAppButtonClicked,
        };

        for (const key in clickHandling) {
            const handler = clickHandling[key];
            const element = this.htmlElement.querySelector(key);
            if (element) {
                this.trackClicks(element, handler, { preventClick: true });
            }
        }

        this.renderMainMenu();
        this.renderSavegames();
    }

    renderMainMenu() {
        const buttonContainer = this.htmlElement.querySelector(".mainContainer .buttons");
        removeAllChildren(buttonContainer);

        const outerDiv = makeDivElement(null, ["outer"], null);

        // Import button
        this.trackClicks(makeButton(outerDiv, ["backButton", "styledButton"], T.multiplayer.back), () =>
            this.moveToState("MainMenuState")
        );

        // Join
        this.trackClicks(
            makeButton(buttonContainer, ["joinButton", "styledButton"], T.multiplayer.join),
            this.onJoinButtonClicked
        );

        buttonContainer.appendChild(outerDiv);
    }

    onExitAppButtonClicked() {
        this.app.platformWrapper.exitApp();
    }

    onLanguageChooseClicked() {
        this.app.analytics.trackUiClick("choose_language");
        const setting = /** @type {import("shapez/states/main_menu").EnumSetting} */ (
            this.app.settings.getSettingHandleById("language")
        );

        // @ts-ignore
        const { optionSelected } = this.dialogs.showOptionChooser(T.settings.labels.language.title, {
            active: this.app.settings.getLanguage(),
            options: setting.options.map(option => ({
                value: setting.valueGetter(option),
                text: setting.textGetter(option),
                desc: setting.descGetter(option),
                iconPrefix: setting.iconPrefix,
            })),
        });

        optionSelected.add(value => {
            this.app.settings.updateLanguage(value).then(() => {
                if (setting.restartRequired) {
                    if (this.app.platformWrapper.getSupportsRestart()) {
                        this.app.platformWrapper.performRestart();
                    } else {
                        this.dialogs.showInfo(
                            T.dialogs.restartRequired.title,
                            T.dialogs.restartRequired.text,
                            ["ok:good"]
                        );
                    }
                }

                if (setting.changeCb) {
                    setting.changeCb(this.app, value);
                }
            });

            // Update current icon
            this.htmlElement.querySelector("button.languageChoose").setAttribute("data-languageIcon", value);
        }, this);
    }

    get savedGames() {
        return this.app.savegameMgr.getSavegamesMetaData();
    }

    renderSavegames() {
        const oldContainer = this.htmlElement.querySelector(".mainContainer .savegames");
        if (oldContainer) {
            oldContainer.remove();
        }
        const games = this.savedGames;
        if (games.length > 0) {
            const parent = makeDiv(this.htmlElement.querySelector(".mainContainer"), null, ["savegames"]);

            for (let i = 0; i < games.length; ++i) {
                const elem = makeDiv(parent, null, ["savegame"]);

                makeDiv(
                    elem,
                    null,
                    ["playtime"],
                    formatSecondsToTimeAgo((new Date().getTime() - games[i].lastUpdate) / 1000.0)
                );

                makeDiv(
                    elem,
                    null,
                    ["level"],
                    games[i].level
                        ? T.mainMenu.savegameLevel.replace("<x>", "" + games[i].level)
                        : T.mainMenu.savegameLevelUnknown
                );

                const name = makeDiv(
                    elem,
                    null,
                    ["name"],
                    "<span>" + (games[i].name ? games[i].name : T.mainMenu.savegameUnnamed) + "</span>"
                );

                const nameButton = document.createElement("button");
                nameButton.classList.add("styledButton", "name");
                name.appendChild(nameButton);

                const resumeButton = document.createElement("button");
                resumeButton.classList.add("styledButton", "resumeGame");
                elem.appendChild(resumeButton);

                this.trackClicks(resumeButton, () => this.resumeGame(games[i]));
            }
        }
    }

    /**
     * @param {import("shapez/savegame/savegame_typedefs").SavegameMetadata} game
     */
    resumeGame(game) {
        this.app.analytics.trackUiClick("resume_game");
        // Get information for host
        const userInput = new FormElementInput({
            id: "userInput",
            label: T.multiplayer.joinMultiplayer.username,
            placeholder: "",
            defaultValue: user.name,
            validator: val => val.trim().length > 0,
        });
        const hostInput = new FormElementInput({
            id: "hostInput",
            label: T.multiplayer.joinMultiplayer.host,
            placeholder: "",
            defaultValue: "",
            validator: val => val.trim().length > 0,
        });

        const dialog = new DialogWithForm({
            app: this.app,
            title: T.multiplayer.joinMultiplayer.title,
            desc: "",
            formElements: [userInput, hostInput],
            buttons: ["cancel:bad:escape", "ok:good:enter"],
        });
        this.dialogs.internalShowDialog(dialog);

        //@ts-ignore
        dialog.buttonSignals.ok.add(() => {
            this.app.adProvider.showVideoAd().then(() => {
                user.name = userInput.getValue().trim();
                const host = hostInput.getValue().trim();
                this.app.analytics.trackUiClick("resume_game_adcomplete");
                const savegame = this.app.savegameMgr.getSavegameById(game.internalId);
                savegame
                    .readAsync()
                    .then(() => {
                        this.moveToState("InMultiplayerGameState", {
                            savegame,
                            host: host,
                        });
                    })
                    .catch(err => {
                        this.dialogs.showWarning(
                            T.dialogs.gameLoadFailure.title,
                            T.dialogs.gameLoadFailure.text + "<br><br>" + err
                        );
                    });
            });
        });
    }

    onJoinButtonClicked() {
        // Get information for host
        const userInput = new FormElementInput({
            id: "userInput",
            label: T.multiplayer.joinMultiplayer.username,
            placeholder: "",
            defaultValue: user.name,
            validator: val => val.trim().length > 0,
        });
        const hostInput = new FormElementInput({
            id: "hostInput",
            label: T.multiplayer.joinMultiplayer.host,
            placeholder: "",
            defaultValue: "",
            validator: val => val.trim().length > 0,
        });

        //UUID v4 regex
        const uuid = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
        const connectIdInput = new FormElementInput({
            id: "connectIdInput",
            label: T.multiplayer.joinMultiplayer.id,
            placeholder: "",
            defaultValue: "",
            validator: val => val.match(uuid) && val.trim().length > 0,
        });

        const dialog = new DialogWithForm({
            app: this.app,
            title: T.multiplayer.joinMultiplayer.title,
            desc: "",
            formElements: [userInput, hostInput, connectIdInput],
            buttons: ["cancel:bad:escape", "ok:good:enter"],
        });
        this.dialogs.internalShowDialog(dialog);

        // When confirmed, create connection
        // @ts-ignore
        dialog.buttonSignals.ok.add(() => {
            user.name = userInput.getValue().trim();
            const host = hostInput.getValue().trim();
            const connectionId = connectIdInput.getValue().trim();

            this.loadingOverlay = new GameLoadingOverlay(this.app, this.getDivElement());
            this.loadingOverlay.showBasic();

            const socket = io(host, {
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
                    T.multiplayer.multiplayerGameConnectionError.desc.replace("<host>", host)
                );
            });

            socket.on("connect", () => {
                console.log("Connected to the signalling server");
                socket.on("id", id => {
                    socketId = id;
                    console.log("Got id: " + id);
                    socket.emit("joinRoom", connectionId, socketId);
                });
                socket.on("error", () => {
                    this.loadingOverlay.removeIfAttached();
                    this.dialogs.showWarning(
                        T.multiplayer.multiplayerGameError.title,
                        T.multiplayer.multiplayerGameError.desc + "<br><br>"
                    );
                });

                const config = {
                    iceServers: [
                        {
                            urls: "stun:stun.1.google.com:19302",
                        },
                        {
                            urls: "turn:numb.viagenie.ca",
                            credential: "muazkh",
                            username: "webrtc@live.com",
                        },
                    ],
                };
                const pc = new Peer({
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
                    pc.signal(signalData.signal);
                });
                pc.on("signal", signalData => {
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

                let gameDataState = -1;
                let gameData = "";

                const canceled = (title, description) => {
                    pc.destroy();
                    this.loadingOverlay.removeIfAttached();

                    //Show error message of room
                    const dialog = new Dialog({
                        app: this.app,
                        title: title,
                        contentHTML: description,
                        buttons: ["ok:good"],
                    });
                    this.dialogs.internalShowDialog(dialog);
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

                        const connection = new MultiplayerConnection(pc, gameDataJson);
                        this.moveToState("InMultiplayerGameState", {
                            connection,
                            connectionId,
                        });
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
                            host + ": Connection timed out"
                        )
                    );
                }, 1000 * 60);

                pc.on("data", onMessage);
            });
        });
    }

    onSettingsButtonClicked() {
        this.moveToState("SettingsState", {
            backToStateId: this.key,
            backToStatePayload: {
                backToStateId: this.key,
            },
        });
    }

    onLeave() {
        this.dialogs.cleanup();
    }
}
