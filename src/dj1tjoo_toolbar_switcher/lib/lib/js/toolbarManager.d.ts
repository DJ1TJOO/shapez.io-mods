/**
 * @typedef {import("shapez/game/hud/parts/base_toolbar").HUDBaseToolbar & {
 *  mtForceVisible: boolean
 *  mtForceToggle: () => void
 *  mtForceEnable: () => void
 *  mtForceDisable: () => void
 * }} HUDBaseToolbarMT
 */
export class ToolbarManager {
    idToToolbar: {};
    /**
     * @param {string} id
     * @param {HUDBaseToolbarMT} toolbar
     */
    registerToolbar(id: string, toolbar: HUDBaseToolbarMT): void;
    /**
     * Get the toolbar with the given id.
     * @param {string} toolbarID
     * @returns {HUDBaseToolbarMT}
     */
    getToolbarByID(toolbarID: string): HUDBaseToolbarMT;
    /**
     * Toggle the visibility of the toolbar with the given id.
     * @param {string} toolbarID
     */
    toggleToolbar(toolbarID: string): void;
    /**
     * Force show toolbarID
     * @param {string} toolbarID
     */
    enableToolbar(toolbarID: string): void;
    /**
     * Force hide toolbarID
     * @param {string} toolbarID
     */
    disableToolbar(toolbarID: string): void;
}
export type HUDBaseToolbarMT = import("shapez/game/hud/parts/base_toolbar").HUDBaseToolbar & {
    mtForceVisible: boolean;
    mtForceToggle: () => void;
    mtForceEnable: () => void;
    mtForceDisable: () => void;
};
