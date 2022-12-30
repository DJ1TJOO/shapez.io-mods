/**
 * @typedef {import("shapez/mods/mod").Mod & {
 *  EnergyConnectorComponent: import("../../js/components/energy_connector").EnergyConnectorComponent
 *  EnergyPinComponent: import("../../js/components/energy_pin").EnergyPinComponent
 * }} AdvancedEnergyMod
 */
export class AdvancedEnergy {
    static get EnergyConnectorComponent(): import("../../js/components/energy_connector").EnergyConnectorComponent;
    static get EnergyPinComponent(): import("../../js/components/energy_pin").EnergyPinComponent;
    /**
     * Shows a dialog on the main menu when the energy mod is not installed
     */
    static requireInstalled(): void;
    /**
     * Returns if the energy mod is installed
     * @returns {boolean}
     */
    static isInstalled(): boolean;
    /**
     * Returns the energy mod instance
     * @returns {?AdvancedEnergyMod}
     */
    static getMod(): AdvancedEnergyMod | null;
    /**
     * Returns the version of the energy mod instance
     * @returns {?string}
     */
    static getVersion(): string | null;
}
export type AdvancedEnergyMod = import("shapez/mods/mod").Mod & {
    EnergyConnectorComponent: import("../../js/components/energy_connector").EnergyConnectorComponent;
    EnergyPinComponent: import("../../js/components/energy_pin").EnergyPinComponent;
};
