import { Dialog } from "shapez/core/modal_dialog_elements";
import { enumNotificationType } from "shapez/game/hud/parts/notifications";
import { GameRoot } from "shapez/game/root";
import { T } from "shapez/translations";
import { getMod } from "../getMod";
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
        const args = str.split(" ");
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
        };
    }
}
