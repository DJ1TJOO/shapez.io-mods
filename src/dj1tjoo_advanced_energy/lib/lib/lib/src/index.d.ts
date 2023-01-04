/**
 * @typedef {import("shapez/mods/mod").Mod & {
 *  EnergyConnectorComponent: typeof import("../../js/components/energy_connector").EnergyConnectorComponent
 *  EnergyPinComponent: typeof import("../../js/components/energy_pin").EnergyPinComponent
 *  EnergyTunnelComponent: typeof import("../../js/components/energy_tunnel").EnergyTunnelComponent
 * }} AdvancedEnergyMod
 */
export class AdvancedEnergy {
    static isLoadedComlete: boolean;
    static isLoaded: any[];
    static loadedUid: number;
    static get EnergyConnectorComponent(): typeof import("../../js/components/energy_connector").EnergyConnectorComponent;
    static get EnergyPinComponent(): typeof import("../../js/components/energy_pin").EnergyPinComponent;
    static get EnergyTunnelComponent(): typeof import("../../js/components/energy_tunnel").EnergyTunnelComponent;
    /**
     * Shows a dialog on the main menu when the energy mod is not installed
     */
    static requireInstalled(): void;
    static enableDebug(): void;
    static disableDebug(): void;
    /**
     * Register to run callback on energy mod loaded
     * @param {(installed: boolean) => void} cb
     */
    static onLoaded(cb: (installed: boolean) => void): void;
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
    EnergyConnectorComponent: typeof import("../../js/components/energy_connector").EnergyConnectorComponent;
    EnergyPinComponent: typeof import("../../js/components/energy_pin").EnergyPinComponent;
    EnergyTunnelComponent: typeof import("../../js/components/energy_tunnel").EnergyTunnelComponent;
};
