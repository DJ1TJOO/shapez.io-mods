import { Dialog } from "shapez/core/modal_dialog_elements";
import { enumNotificationType } from "shapez/game/hud/parts/notifications";
import { T } from "shapez/translations";

export class MultiplayerCommandsHandler {
    constructor(root) {
        this.root = root;
    }

    isCommandString(str) {
        return str.startsWith(MultiplayerCommandsHandler.prefix);
    }

    isCommand(cmd) {
        return !!MultiplayerCommandsHandler.commands[cmd];
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
        cmd = cmd.toLowerCase();
        if (!MultiplayerCommandsHandler.commands[cmd]) return false;
        return MultiplayerCommandsHandler.commands[cmd](
            this.root,
            this.root.gameState.peer.user,
            this.root.gameState.peer,
            cmd,
            args
        );
    }
}

MultiplayerCommandsHandler.commands = {
    gamecode: (root, user, multiplayerPeer, cmd, args) => {
        if (multiplayerPeer.host) {
            //Show uuid of room
            const dialog = new Dialog({
                app: multiplayerPeer.ingameState.app,
                title: T.multiplayer.shareCode,
                contentHTML: `
            <a id="share-connection-${multiplayerPeer.connectionId}" onclick="function fallbackCopyTextToClipboard(o){var e=document.createElement('textarea');e.value=o,e.style.top='0',e.style.left='0',e.style.position='fixed',document.body.appendChild(e),e.focus(),e.select();try{document.execCommand('copy')}catch(o){console.error('Fallback: Oops, unable to copy',o)}document.body.removeChild(e)}event.preventDefault();let copyTextToClipboard=o=>{navigator.clipboard?navigator.clipboard.writeText(o).then(function(){},function(o){console.error('Async: Could not copy text: ',o)}):fallbackCopyTextToClipboard(o)};copyTextToClipboard('${multiplayerPeer.connectionId}');">${multiplayerPeer.connectionId}</a>
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

MultiplayerCommandsHandler.prefix = "/";
