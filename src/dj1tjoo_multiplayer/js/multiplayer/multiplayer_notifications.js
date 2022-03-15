import { InputReceiver } from "shapez/core/input_receiver";
import { makeDiv } from "shapez/core/utils";
import { enumNotificationType, HUDNotifications } from "shapez/game/hud/parts/notifications";
import { KeyActionMapper, KEYMAPPINGS } from "shapez/game/key_action_mapper";
import { ModInterface } from "shapez/mods/mod_interface";
import { T } from "shapez/translations";
import { MultiplayerCommandsHandler } from "./multiplayer_commands";
import { MultiplayerPacket, TextPacket, TextPacketTypes } from "./multiplayer_packets";
import { MultiplayerPeer } from "./multiplayer_peer";
import { makeDivAfter } from "./utils";

const notificationDuration = 3;

/**
 * @typedef { HUDNotifications & {
 * visibleNotificationElements: Array<Number>,
 * inputReciever: InputReceiver,
 * keyActionMapper: KeyActionMapper,
 * sendMessage: function(): void,
 * commandHandler: MultiplayerCommandsHandler,
 * inputElement: HTMLDivElement
 * }} MultiplayerHUDNotifications
 */

/**
 * @param {ModInterface} modInterface
 */
export function multiplayerNotifications(modInterface) {
    modInterface.extendObject(enumNotificationType, ({ $super, $old }) => ({
        message: "message",
    }));

    modInterface.runAfterMethod(
        HUDNotifications,
        "initialize",
        /** @this {MultiplayerHUDNotifications}*/
        function () {
            this.visibleNotificationElements = [];

            //To disable other inputs when typing
            this.inputReciever = new InputReceiver("notifications");
            this.keyActionMapper = new KeyActionMapper(this.root, this.inputReciever);

            // @ts-ignore
            this.keyActionMapper.getBinding(KEYMAPPINGS.general.confirm).add(this.sendMessage, this);

            this.commandHandler = new MultiplayerCommandsHandler(this.root);
        }
    );

    modInterface.replaceMethod(
        HUDNotifications,
        "createElements",
        /**
         * @param {DocumentFragment} parent
         * @this {MultiplayerHUDNotifications}
         */
        function (original, [parent]) {
            if (!document.getElementById("ingame_HUD_Notifications")) {
                this.element = makeDiv(parent, "ingame_HUD_Notifications", [], ``);
            } else {
                this.element = /**@type {HTMLDivElement}*/ (
                    document.getElementById("ingame_HUD_Notifications")
                );
            }

            const multiplayer = /** @type {import("../states/multiplayer_ingame").InMultiplayerGameState}*/ (
                this.root.app.stateMgr.getCurrentState()
            ).isMultiplayer();

            this.inputElement = makeDiv(
                this.element,
                "notificationInput",
                [],
                multiplayer
                    ? `<input type="text" class="notificationInput" placeholder="Message">`
                    : `<div></div>`
            );

            this.inputElement.addEventListener("focusin", e => {
                this.root.app.inputMgr.makeSureAttachedAndOnTop(this.inputReciever);
            });

            this.inputElement.addEventListener("focusout", e => {
                this.root.app.inputMgr.makeSureDetached(this.inputReciever);
            });

            this.inputElement.addEventListener("blur", e => {
                this.root.app.inputMgr.makeSureDetached(this.inputReciever);
            });

            this.element.addEventListener("mouseleave", e => {
                this.root.app.inputMgr.makeSureDetached(this.inputReciever);
                this.inputElement.blur();
                // @ts-ignore
                this.blurAll();
            });
        }
    );

    modInterface.replaceMethod(
        HUDNotifications,
        "internalShowNotification",
        /**
         * @param {string} message
         * @param {enumNotificationType} type
         * @this {MultiplayerHUDNotifications}
         */
        // @ts-ignore
        function (original, [message, type]) {
            const element = makeDivAfter(this.inputElement, null, ["notification", "type-" + type], message);
            element.setAttribute("data-icon", "icons/notification_" + type + ".png");

            const notification = {
                element,
                expireAt: this.root.time.realtimeNow() + notificationDuration,
            };
            this.visibleNotificationElements.push(this.notificationElements.push(notification) - 1);
        }
    );

    modInterface.replaceMethod(
        HUDNotifications,
        "update",
        /**
         * @this {MultiplayerHUDNotifications}
         */
        function () {
            const now = this.root.time.realtimeNow();
            for (let i = 0; i < this.visibleNotificationElements.length; ++i) {
                const handle = this.notificationElements[this.visibleNotificationElements[i]];
                if (handle.expireAt <= now) {
                    this.visibleNotificationElements.splice(i, 1);
                }
            }
        }
    );

    modInterface.extendClass(HUDNotifications, ({ $super, $old }) => ({
        /** @this {MultiplayerHUDNotifications}*/
        sendMessage() {
            /** @type {MultiplayerPeer} */
            // @ts-ignore
            const peer = this.root.gameState.socket;
            if (!peer) return;

            const value = /** @type {HTMLInputElement} */ (
                this.inputElement.getElementsByClassName("notificationInput")[0]
            ).value;
            if (this.commandHandler.isCommandString(value)) {
                const command = this.commandHandler.getCommandFromCommandString(value);
                if (command && this.commandHandler.isCommand(command.cmd)) {
                    if (this.commandHandler.executeCommand(command.cmd, command.args) === false)
                        this.internalShowNotification(
                            T.multiplayer.commands.error.replaceAll("<cmd>", command.cmd),
                            enumNotificationType.error
                        );
                } else {
                    this.internalShowNotification(
                        T.multiplayer.commands.doesNotExist.replaceAll("<cmd>", command.cmd),
                        enumNotificationType.error
                    );
                }
            } else {
                if (value.length < 1) return;
                const message = peer.user.username + ": " + value;
                if (
                    /** @type {import("../states/multiplayer_ingame").InMultiplayerGameState} */ (
                        this.root.gameState
                    ).isHost()
                ) {
                    for (let i = 0; i < peer.connections.length; i++) {
                        MultiplayerPacket.sendPacket(
                            peer.socket,
                            peer.connections[i].id,
                            new TextPacket(TextPacketTypes.MESSAGE, message)
                        );
                    }
                } else if (peer.socket.hostSocketId) {
                    MultiplayerPacket.sendPacket(
                        peer.socket,
                        peer.socket.hostSocketId,
                        new TextPacket(TextPacketTypes.MESSAGE, message)
                    );
                }
                // @ts-ignore
                this.internalShowNotification(message, enumNotificationType.message);
            }
            /** @type {HTMLInputElement} */ (
                this.inputElement.getElementsByClassName("notificationInput")[0]
            ).value = "";
        },

        blurAll() {
            const tmp = document.createElement("input");
            document.body.appendChild(tmp);
            tmp.focus();
            document.body.removeChild(tmp);
        },
    }));
}
