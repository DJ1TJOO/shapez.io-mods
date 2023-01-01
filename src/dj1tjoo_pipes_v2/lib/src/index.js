/** @type {{MODS: import("shapez/mods/modloader").ModLoader}} */
const { MODS } = shapez;

const ENERGY_MOD_ID = "dj1tjoo_pipes";

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
        return this.getMod()?.gFluidRegistry || null;
    }

    static get typeFluidSingleton() {
        return this.getMod()?.typeFluidSingleton || null;
    }

    static get BaseFluid() {
        return this.getMod()?.BaseFluid || null;
    }

    static get PipeConnectorComponent() {
        return this.getMod()?.PipeConnectorComponent || null;
    }

    static get PipePinComponent() {
        return this.getMod()?.PipePinComponent || null;
    }

    static enableDebug() {
        this.getMod()["debug"] = true;
    }

    static disableDebug() {
        this.getMod()["debug"] = false;
    }

    /**
     * Shows a dialog on the main menu when the pipes mod is not installed
     */
    static requireInstalled() {
        MODS.signals.stateEntered.add(state => {
            if (this.isInstalled()) return;

            if (state.key !== "MainMenuState") return;

            /** @type {import("shapez/game/hud/parts/modal_dialogs").HUDModalDialogs | null} */
            const dialogs = MODS.app.stateMgr.currentState["dialogs"];
            if (!dialogs) return;

            const title = "Pipes Not Found!";
            if (dialogs.dialogStack.some(x => x.title === title)) return;

            dialogs.showWarning(
                title,
                "The Pipes mod was not found. This mod is required by other mods you installed."
            );
        });
    }

    /**
     * Returns if the pipes mod is installed
     * @returns {boolean}
     */
    static isInstalled() {
        return MODS.mods.some(x => x.metadata.id === ENERGY_MOD_ID);
    }

    /**
     * Returns the pipes mod instance
     * @returns {?PipesMod}
     */
    static getMod() {
        return /** @type {PipesMod} */ (MODS.mods.find(x => x.metadata.id === ENERGY_MOD_ID)) || null;
    }

    /**
     * Returns the version of the pipes mod instance
     * @returns {?string}
     */
    static getVersion() {
        const mod = this.getMod();
        if (!mod) return null;

        return mod.metadata.version;
    }
}
