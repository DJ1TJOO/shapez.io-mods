import { Dialog } from "shapez/core/modal_dialog_elements";
import { enumNotificationType } from "shapez/game/hud/parts/notifications";
import { GameRoot } from "shapez/game/root";
import { T } from "shapez/translations";
import { getMod } from "../getMod";
import { MultiplayerPacket, TextPacket, TextPacketTypes } from "./multiplayer_packets";
import { MultiplayerPeer } from "./multiplayer_peer";

export class MultiplayerCommandsHandler {
    constructor(root) {
        /** @type {GameRoot} */
        this.root = root;
        // @ts-ignore
        this.commands = getMod().commands;
    }

    isCommandString(str) {
        const settings = getMod().settings;
        return str.startsWith(settings.prefix);
    }

    isCommand(cmd) {
        return !!this.commands[cmd];
    }

    getCommandFromCommandString(str) {
        if (!this.isCommandString(str)) return null;

        const regex = new RegExp('"[^"]+"|[\\S]+', "g");
        const args = [];
        const matches = str.match(regex);
        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            if (!match) continue;
            args.push(match.replace(/"/g, ""));
        }

        const cmd = args.splice(0, 1)[0].substring(1);
        return { cmd, args };
    }

    executeCommandFromCommandString(str) {
        const command = this.getCommandFromCommandString(str);
        if (!command || !this.isCommand(command.cmd)) return false;
        return this.executeCommand(command.cmd, command.args);
    }

    executeCommand(cmd, args) {
        // @ts-ignore
        cmd = cmd.toLowerCase();
        if (!this.commands[cmd]) return false;
        return this.commands[cmd](
            this.root,
            /** @type {import("../states/multiplayer_ingame").InMultiplayerGameState} */ (this.root.gameState)
                .socket.user,
            /** @type {import("../states/multiplayer_ingame").InMultiplayerGameState} */ (this.root.gameState)
                .socket,
            cmd,
            args
        );
    }

    static getDefaultsCommands() {
        return {
            /**
             * @param {GameRoot} root
             * @param {Object} user
             * @param {MultiplayerPeer} multiplayerPeer
             * @param {string} cmd
             * @param {Array<string>} args
             */
            gamecode: (root, user, multiplayerPeer, cmd, args) => {
                if (multiplayerPeer.ingameState.isHost()) {
                    //Show uuid of room
                    const dialog = new Dialog({
                        app: multiplayerPeer.ingameState.app,
                        title: T.multiplayer.shareCode,
                        contentHTML: `
            <a id="share-connection-${multiplayerPeer.socket.connectionId}" onclick="function fallbackCopyTextToClipboard(o){var e=document.createElement('textarea');e.value=o,e.style.top='0',e.style.left='0',e.style.position='fixed',document.body.appendChild(e),e.focus(),e.select();try{document.execCommand('copy')}catch(o){console.error('Fallback: Oops, unable to copy',o)}document.body.removeChild(e)}event.preventDefault();let copyTextToClipboard=o=>{navigator.clipboard?navigator.clipboard.writeText(o).then(function(){},function(o){console.error('Async: Could not copy text: ',o)}):fallbackCopyTextToClipboard(o)};copyTextToClipboard('${multiplayerPeer.socket.connectionId}');">${multiplayerPeer.socket.connectionId}</a>
                  `,
                        buttons: ["ok:good"],
                    });
                    root.hud.parts.dialogs.internalShowDialog(dialog);
                } else {
                    root.hud.parts["notifications"].internalShowNotification(
                        T.multiplayer.hostOnly,
                        enumNotificationType.error
                    );
                }
                return true;
            },
            /**
             * @param {GameRoot} root
             * @param {Object} user
             * @param {MultiplayerPeer} multiplayerPeer
             * @param {string} cmd
             * @param {Array<string>} args
             */
            kick: (root, user, multiplayerPeer, cmd, args) => {
                if (multiplayerPeer.ingameState.isHost()) {
                    const currentUser = multiplayerPeer.users.find(x => x.username === args[0]);
                    if (!currentUser) {
                        return root.hud.parts["notifications"].internalShowNotification(
                            T.multiplayer.user.notFound.replaceAll("<username>", args[0]),
                            enumNotificationType.error
                        );
                    }

                    const socketId = multiplayerPeer.connections.find(x => x.user._id === currentUser._id).id;
                    if (!socketId) {
                        return root.hud.parts["notifications"].internalShowNotification(
                            T.multiplayer.user.notFound.replaceAll("<username>", args[0]),
                            enumNotificationType.error
                        );
                    }

                    root.hud.parts["notifications"].internalShowNotification(
                        T.multiplayer.user.disconnected.replaceAll("<username>", currentUser.username),
                        enumNotificationType.success
                    );
                    multiplayerPeer.users.splice(multiplayerPeer.users.indexOf(currentUser), 1);

                    for (let i = 0; i < multiplayerPeer.connections.length; i++) {
                        const connection = multiplayerPeer.connections[i];

                        MultiplayerPacket.sendPacket(
                            multiplayerPeer.socket,
                            connection.id,
                            new TextPacket(
                                TextPacketTypes.USER_DISCONNECTED,
                                JSON.stringify({ user: currentUser, socketId })
                            )
                        );
                    }
                    multiplayerPeer.socket.socket.emit("kick", socketId);
                } else {
                    root.hud.parts["notifications"].internalShowNotification(
                        T.multiplayer.hostOnly,
                        enumNotificationType.error
                    );
                }
                return true;
            },
        };
    }
}
