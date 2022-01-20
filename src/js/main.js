import { globalConfig } from "shapez/core/config";
import { makeDivElement, makeButton } from "shapez/core/utils";
import { GameHUD } from "shapez/game/hud/hud";
import { Mod } from "shapez/mods/mod";
import { SerializerInternal } from "shapez/savegame/serializer_internal";
import { MainMenuState } from "shapez/states/main_menu";
import { T } from "shapez/translations";
import { createHud, MultiplayerHUD } from "./multiplayer/multiplayer_hud";
import { multiplayerNotifications } from "./multiplayer/multiplayer_notifications";
import { MultiplayerState } from "./states/multiplayer";
import { InMultiplayerGameState } from "./states/multiplayer_ingame";

class ModImpl extends Mod {
    init() {
        this.checkSettings();

        // Register states
        this.signals.appBooted.add(() => {
            this.app.stateMgr.register(MultiplayerState);
            this.modInterface.registerGameState(InMultiplayerGameState);
        });

        // Add multiplayer notifications
        multiplayerNotifications(this.modInterface);

        // Add multiplayer button to main menu
        this.modInterface.runAfterMethod(
            MainMenuState,
            "renderMainMenu",
            /**
             * @this {MainMenuState}
             */
            function () {
                const buttons = this.htmlElement.querySelector(".mainContainer .buttons");
                const outerDiv = makeDivElement(null, ["outer"], null);
                buttons.append(outerDiv);

                // Import button
                this.trackClicks(
                    makeButton(outerDiv, ["multiplayerButton", "styledButton"], T.multiplayer.name),
                    () => {
                        this.moveToState("MultiplayerState");
                    }
                );
            }
        );

        // Add constant signal Proxy
        this.modInterface.runAfterMethod(
            SerializerInternal,
            "deserializeComponents",
            /**
             * @this { SerializerInternal }
             */
            function (root, entity, data) {
                for (const componentId in data) {
                    if (componentId === "ConstantSignal") {
                        const component = new Proxy(entity.components[componentId], {
                            set: (target, key, value) => {
                                target[key] = value;
                                root.signals.constantSignalChange.dispatch(entity, target);
                                return true;
                            },
                        });
                        entity.components[componentId] = component;
                    }
                }
            }
        );

        this.signals.gameInitialized.add(createHud, this);
    }

    checkSettings() {
        // Create default settings if corrupted
        if (!this.settings) {
            this.settings = {};
        }
        if (!this.settings.showOtherPlayers) {
            this.settings.showOtherPlayers = true;
            this.saveSettings();
        }
    }
}
//gulp-reload!
