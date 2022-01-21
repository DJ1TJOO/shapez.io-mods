import { gComponentRegistry } from "shapez/core/global_registries";
import { makeDivElement, makeButton } from "shapez/core/utils";
import { Mod } from "shapez/mods/mod";
import { SerializerInternal } from "shapez/savegame/serializer_internal";
import { MainMenuState } from "shapez/states/main_menu";
import { T } from "shapez/translations";
import { createHud } from "./multiplayer/multiplayer_hud";
import { multiplayerNotifications } from "./multiplayer/multiplayer_notifications";
import { handleComponents, MultiplayerPacketSerializableObject } from "./multiplayer/multiplayer_packets";
import { MultiplayerState } from "./states/multiplayer";
import { createMultiplayerGameState, InMultiplayerGameState } from "./states/multiplayer_ingame";

class ModImpl extends Mod {
    init() {
        this.checkSettings();

        // Register states
        this.signals.appBooted.add(() => {
            this.app.stateMgr.register(MultiplayerState);
        });

        // Edit ingame state to add multiplayer
        createMultiplayerGameState(this.modInterface);

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
                handleComponents(entity, root);
            }
        );

        this.signals.gameInitialized.add(createHud, this);
        this.signals.gameInitialized.add(() => {
            const coloredMod = this.modLoader.mods.some(x => x.metadata.id === "dengr1065:colorcoded");
            if (coloredMod) {
                const ColoredComponent = gComponentRegistry.findById("ColorCoded");
                MultiplayerPacketSerializableObject[ColoredComponent.name] = ColoredComponent;
            }
        });
    }

    checkSettings() {
        // Create default settings if corrupted
        if (!this.settings) {
            this.settings = {};
        }
        if (!this.settings.showOtherPlayers) {
            this.settings.showOtherPlayers = true;
        }
        if (!this.settings.user) {
            this.settings.user = {
                name: "",
                lastServer: "",
            };
        }

        this.saveSettings();
    }
}
//gulp-reload!
