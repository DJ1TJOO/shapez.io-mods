/** @type {{MODS: import("shapez/mods/modloader").ModLoader}} */
const { MODS } = shapez;
const MOD_ID = "dj1tjoo_pipes";
/**
 * @typedef {import("shapez/mods/mod").Mod & {
 *  PipeConnectorComponent: typeof import("../../js/components/pipe_connector").PipeConnectorComponent
 *  PipePinComponent: typeof import("../../js/components/pipe_pin").PipePinComponent
 *  BaseFluid: typeof import("../../js/items/base_fluid").BaseFluid
 *  typeFluidSingleton: typeof import("../../js/items/base_fluid").typeFluidSingleton
 *  gFluidRegistry: typeof import("../../js/items/base_fluid").gFluidRegistry
 * }} PipesMod
 */
export class Pipe {
    static get gFluidRegistry() {
        var _a;
        return ((_a = this.getMod()) === null || _a === void 0 ? void 0 : _a.gFluidRegistry) || null;
    }
    static get typeFluidSingleton() {
        var _a;
        return ((_a = this.getMod()) === null || _a === void 0 ? void 0 : _a.typeFluidSingleton) || null;
    }
    static get BaseFluid() {
        var _a;
        return ((_a = this.getMod()) === null || _a === void 0 ? void 0 : _a.BaseFluid) || null;
    }
    static get PipeConnectorComponent() {
        var _a;
        return ((_a = this.getMod()) === null || _a === void 0 ? void 0 : _a.PipeConnectorComponent) || null;
    }
    static get PipePinComponent() {
        var _a;
        return ((_a = this.getMod()) === null || _a === void 0 ? void 0 : _a.PipePinComponent) || null;
    }
    static enableDebug() {
        this.onLoaded(() => (this.getMod()["debug"] = true));
    }
    static disableDebug() {
        this.onLoaded(() => (this.getMod()["debug"] = false));
    }
    /**
     * Register to run callback on pipes loaded
     * @param {(installed: boolean) => void} cb
     */
    static onLoaded(cb) {
        if (this.isLoadedComlete) {
            return cb(this.isInstalled());
        }
        const uid = this.loadedUid++;
        MODS.signals.stateEntered.add(state => {
            if (this.isLoaded.includes(uid))
                return;
            if (state.key !== "MainMenuState")
                return;
            this.isLoadedComlete = true;
            this.isLoaded.push(uid);
            cb(this.isInstalled());
        });
    }
    /**
     * Shows a dialog on the main menu when the pipes mod is not installed
     */
    static requireInstalled() {
        this.onLoaded(installed => {
            if (installed)
                return;
            /** @type {import("shapez/game/hud/parts/modal_dialogs").HUDModalDialogs | null} */
            const dialogs = MODS.app.stateMgr.currentState["dialogs"];
            if (!dialogs)
                return;
            const title = "Pipes Not Found!";
            if (dialogs.dialogStack.some(x => x.title === title))
                return;
            dialogs.showWarning(title, "The Pipes mod was not found. This mod is required by other mods you installed.");
        });
    }
    /**
     * Returns if the pipes mod is installed
     * @returns {boolean}
     */
    static isInstalled() {
        return MODS.mods.some(x => x.metadata.id === MOD_ID);
    }
    /**
     * Returns the pipes mod instance
     * @returns {?PipesMod}
     */
    static getMod() {
        return /** @type {PipesMod} */ (MODS.mods.find(x => x.metadata.id === MOD_ID)) || null;
    }
    /**
     * Returns the version of the pipes mod instance
     * @returns {?string}
     */
    static getVersion() {
        const mod = this.getMod();
        if (!mod)
            return null;
        return mod.metadata.version;
    }
}
Pipe.isLoadedComlete = false;
Pipe.isLoaded = [];
Pipe.loadedUid = 0;
