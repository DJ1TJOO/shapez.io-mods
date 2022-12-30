const { MODS } = shapez;
const ENERGY_MOD_ID = "dj1tjoo_advanced_energy";
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
    /**
     * Check if the energy mod is installed
     * @returns {boolean}
     */
    isInstalled() {
        return MODS.mods.some(x => x.metadata.id === ENERGY_MOD_ID);
    }
    /**
     * Returns the energy mod instance
     * @returns {?(import("shapez/mods/mod").Mod & {
     *  EnergyConnectorComponent: import("../../js/components/energy_connector").EnergyConnectorComponent
     *  EnergyPinComponent: import("../../js/components/energy_pin").EnergyPinComponent
     * })}
     */
    getMod() {
        return MODS.mods.find(x => x.metadata.id === ENERGY_MOD_ID) || null;
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
