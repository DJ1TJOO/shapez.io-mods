/**
 * @typedef {import("shapez/mods/mod").Mod} ToolbarSwitcherMod
 * @typedef {import("../../js/toolbarManager").ToolbarManager} ToolbarManager
 */
export class ToolbarSwitcher {
    static isLoadedComlete: boolean;
    static isLoaded: any[];
    static loadedUid: number;
    static toolbarsToRegister: any[];
    /**
     * Registers a new building to a toolbar
     * @param {object} param0
     * @param {string} param0.toolbar
     * @param {"primary"|"secondary"} param0.location
     * @param {typeof import("shapez/game/meta_building").MetaBuilding} param0.metaClass
     * @param {"regular" | "wires"} param0.fallback When the toolbar switcher mod is not available where to add
     */
    static addNewBuildingToToolbar({ toolbar, location, metaClass, fallback }: {
        toolbar: string;
        location: "primary" | "secondary";
        metaClass: typeof import("shapez/game/meta_building").MetaBuilding;
        fallback: "regular" | "wires";
    }): void;
    /**
     * Registers a new toolbar if the toolbar switcher mod is installed
     * @param {string} id
     * @param {typeof import("shapez/game/hud/parts/base_toolbar").HUDBaseToolbar} toolbar
     * @param {boolean?} isVisible
     * @returns {void}
     */
    static registerToolbar(id: string, toolbar: typeof import("shapez/game/hud/parts/base_toolbar").HUDBaseToolbar, isVisible?: boolean | null): void;
    /**
     * Shows a dialog on the main menu when the toolbar switcher mod is not installed
     */
    static requireInstalled(): void;
    static enableDebug(): void;
    static disableDebug(): void;
    /**
     * Register to run callback on toolbar switcher loaded
     * @param {(installed: boolean) => void} cb
     */
    static onLoaded(cb: (installed: boolean) => void): void;
    /**
     * Returns if the toolbar switcher mod is installed
     * @returns {boolean}
     */
    static isInstalled(): boolean;
    /**
     * Returns the toolbar switcher mod instance
     * @returns {?ToolbarSwitcherMod}
     */
    static getMod(): ToolbarSwitcherMod | null;
    /**
     * Returns the version of the toolbar switcher mod instance
     * @returns {?string}
     */
    static getVersion(): string | null;
}
export type ToolbarSwitcherMod = import("shapez/mods/mod").Mod;
export type ToolbarManager = import("../../js/toolbarManager").ToolbarManager;
