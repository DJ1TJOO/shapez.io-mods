export class AdvancedEnergy {
    get EnergyConnectorComponent(): import("../../js/components/energy_connector").EnergyConnectorComponent;
    get EnergyPinComponent(): import("../../js/components/energy_pin").EnergyPinComponent;
    /**
     * Check if the energy mod is installed
     * @returns {boolean}
     */
    isInstalled(): boolean;
    /**
     * Returns the energy mod instance
     * @returns {?(import("shapez/mods/mod").Mod & {
     *  EnergyConnectorComponent: import("../../js/components/energy_connector").EnergyConnectorComponent
     *  EnergyPinComponent: import("../../js/components/energy_pin").EnergyPinComponent
     * })}
     */
    getMod(): (import("shapez/mods/mod").Mod & {
        EnergyConnectorComponent: import("../../js/components/energy_connector").EnergyConnectorComponent;
        EnergyPinComponent: import("../../js/components/energy_pin").EnergyPinComponent;
    }) | null;
    /**
     * Returns the version of the energy mod instance
     * @returns {?string}
     */
    getVersion(): string | null;
}
