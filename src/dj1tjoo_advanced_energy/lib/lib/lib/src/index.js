/** @type {{MODS: import("shapez/mods/modloader").ModLoader}} */
const { MODS } = shapez;
const ENERGY_MOD_ID = "dj1tjoo_advanced_energy";
/**
 * @typedef {import("shapez/mods/mod").Mod & {
 *  EnergyConnectorComponent: import("../../js/components/energy_connector").EnergyConnectorComponent
 *  EnergyPinComponent: import("../../js/components/energy_pin").EnergyPinComponent
 * }} AdvancedEnergyMod
 */
export class AdvancedEnergy {
    constructor() { }
    get EnergyConnectorComponent() {
        var _a;
        return ((_a = this.getMod()) === null || _a === void 0 ? void 0 : _a.EnergyConnectorComponent) || null;
    }
    get EnergyPinComponent() {
        var _a;
        return ((_a = this.getMod()) === null || _a === void 0 ? void 0 : _a.EnergyPinComponent) || null;
    }
    // TODO: single warning when mod is not installed
    requireInstalled() {
        MODS.signals.stateEntered.add(state => {
            if (this.isInstalled())
                return;
            if (state.key !== "MainMenuState")
                return;
            /** @type {import("shapez/game/hud/parts/modal_dialogs").HUDModalDialogs | null} */
            const dialogs = MODS.app.stateMgr.currentState["dialogs"];
            if (!dialogs)
                return;
            const title = "Advanced Energy Not Found!";
            if (dialogs.dialogStack.some(x => x.title === title))
                return;
            dialogs.showWarning(title, "The Advanced Energy mod was not found. This mod is required by other mods you installed.");
        });
    }
    /**
     * Check if the energy mod is installed
     * @returns {boolean}
     */
    isInstalled() {
        return MODS.mods.some(x => x.metadata.id === ENERGY_MOD_ID);
    }
    /**
     * Returns the energy mod instance
     * @returns {?AdvancedEnergyMod}
     */
    getMod() {
        return (
        /** @type {AdvancedEnergyMod} */ (MODS.mods.find(x => x.metadata.id === ENERGY_MOD_ID)) || null);
    }
    /**
     * Returns the version of the energy mod instance
     * @returns {?string}
     */
    getVersion() {
        const mod = this.getMod();
        if (!mod)
            return null;
        return mod.metadata.version;
    }
}