/** @type {{MODS: import("shapez/mods/modloader").ModLoader}} */
const { MODS } = shapez;

const MOD_ID = "dj1tjoo_advanced_energy";

/**
 * @typedef {import("shapez/mods/mod").Mod & {
 *  EnergyConnectorComponent: typeof import("../../js/components/energy_connector").EnergyConnectorComponent
 *  EnergyPinComponent: typeof import("../../js/components/energy_pin").EnergyPinComponent
 *  EnergyTunnelComponent: typeof import("../../js/components/energy_tunnel").EnergyTunnelComponent
 * }} AdvancedEnergyMod
 */

export class AdvancedEnergy {
    static isLoadedComplete = false;
    static isLoaded = [];
    static loadedUid = 0;

    static get EnergyConnectorComponent() {
        return this.getMod()?.EnergyConnectorComponent || null;
    }

    static get EnergyPinComponent() {
        return this.getMod()?.EnergyPinComponent || null;
    }

    static get EnergyTunnelComponent() {
        return this.getMod()?.EnergyTunnelComponent || null;
    }
    /**
     * Shows a dialog on the main menu when the energy mod is not installed
     */
    static requireInstalled() {
        this.onLoaded(installed => {
            if (installed) return;

            MODS.signals.stateEntered.add(gameState => {
                if (gameState.getKey() !== "MainMenuState") return;
                /** @type {import("shapez/game/hud/parts/modal_dialogs").HUDModalDialogs | null} */
                const dialogs = gameState["dialogs"];
                if (!dialogs) return;

                const title = "Advanced Energy Not Found!";
                if (dialogs.dialogStack.some(x => x.title === title)) return;

                dialogs.showWarning(
                    title,
                    "The Advanced Energy mod was not found. This mod is required by other mods you installed."
                );
            });
        });
    }

    static enableDebug() {
        this.onLoaded(() => (this.getMod()["debug"] = true));
    }

    static disableDebug() {
        this.onLoaded(() => (this.getMod()["debug"] = false));
    }

    /**
     * Register to run callback on energy mod loaded
     * @param {(installed: boolean) => void} cb
     */
    static onLoaded(cb) {
        if (this.isLoadedComplete) {
            return cb(this.isInstalled());
        }

        const uid = this.loadedUid++;
        MODS.signals.appBooted.add(() => {
            if (this.isLoaded.includes(uid)) return;

            this.isLoadedComplete = true;
            this.isLoaded.push(uid);
            cb(this.isInstalled());
        });
    }

    /**
     * Returns if the energy mod is installed
     * @returns {boolean}
     */
    static isInstalled() {
        return MODS.mods.some(x => x.metadata.id === MOD_ID);
    }

    /**
     * Returns the energy mod instance
     * @returns {?AdvancedEnergyMod}
     */
    static getMod() {
        return /** @type {AdvancedEnergyMod} */ (MODS.mods.find(x => x.metadata.id === MOD_ID)) || null;
    }

    /**
     * Returns the version of the energy mod instance
     * @returns {?string}
     */
    static getVersion() {
        const mod = this.getMod();
        if (!mod) return null;

        return mod.metadata.version;
    }
}
