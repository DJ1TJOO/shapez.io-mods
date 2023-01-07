/**
 * @typedef {import("shapez/game/hud/parts/base_toolbar").HUDBaseToolbar & {
 *  mtForceVisible: boolean
 *  mtForceToggle: () => void
 *  mtForceEnable: () => void
 *  mtForceDisable: () => void
 * }} HUDBaseToolbarMT
 */

export class ToolbarManager {
    constructor() {
        this.idToToolbar = {};
    }

    /**
     * @param {string} id
     * @param {HUDBaseToolbarMT} toolbar
     */
    registerToolbar(id, toolbar) {
        this.idToToolbar[id] = toolbar;
    }

    /**
     * Get the toolbar with the given id.
     * @param {string} toolbarID
     * @returns {HUDBaseToolbarMT}
     */
    getToolbarByID(toolbarID) {
        return this.idToToolbar[toolbarID];
    }

    /**
     * Toggle the visibility of the toolbar with the given id.
     * @param {string} toolbarID
     */
    toggleToolbar(toolbarID) {
        this.idToToolbar[toolbarID].mtForceToggle();
    }

    /**
     * Force show toolbarID
     * @param {string} toolbarID
     */
    enableToolbar(toolbarID) {
        this.idToToolbar[toolbarID].mtForceEnable();
    }

    /**
     * Force hide toolbarID
     * @param {string} toolbarID
     */
    disableToolbar(toolbarID) {
        this.idToToolbar[toolbarID].mtForceDisable();
    }
}
