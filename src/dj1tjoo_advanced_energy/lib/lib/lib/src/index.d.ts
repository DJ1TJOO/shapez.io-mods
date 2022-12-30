/**
 * @typedef {import("shapez/mods/mod").Mod & {
 *  EnergyConnectorComponent: import("../../js/components/energy_connector").EnergyConnectorComponent
 *  EnergyPinComponent: import("../../js/components/energy_pin").EnergyPinComponent
 * }} AdvancedEnergyMod
 */
export class AdvancedEnergy {
    get EnergyConnectorComponent(): import("../../js/components/energy_connector").EnergyConnectorComponent;
    get EnergyPinComponent(): import("../../js/components/energy_pin").EnergyPinComponent;
    requireInstalled(): void;
    /**
     * Check if the energy mod is installed
     * @returns {boolean}
     */
    isInstalled(): boolean;
    /**
     * Returns the energy mod instance
     * @returns {?AdvancedEnergyMod}
     */
    getMod(): AdvancedEnergyMod | null;
    /**
     * Returns the version of the energy mod instance
     * @returns {?string}
     */
    getVersion(): string | null;
}
export type AdvancedEnergyMod = import("shapez/mods/mod").Mod & {
    EnergyConnectorComponent: import("../../js/components/energy_connector").EnergyConnectorComponent;
    EnergyPinComponent: import("../../js/components/energy_pin").EnergyPinComponent;
};
