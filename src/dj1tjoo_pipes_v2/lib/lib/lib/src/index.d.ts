/// <reference path="../../../types.d.ts" />
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
    static isLoaded: any[];
    static loadedUid: number;
    static get gFluidRegistry(): import("shapez/core/factory").Factory;
    static get typeFluidSingleton(): import("shapez/savegame/serialization_data_types").TypeClass;
    static get BaseFluid(): typeof import("../../js/items/base_fluid").BaseFluid;
    static get PipeConnectorComponent(): typeof import("../../js/components/pipe_connector").PipeConnectorComponent;
    static get PipePinComponent(): typeof import("../../js/components/pipe_pin").PipePinComponent;
    static enableDebug(): void;
    static disableDebug(): void;
    /**
     * Register to run callback on pipes loaded
     * @param {(installed: boolean) => void} cb
     */
    static onLoaded(cb: (installed: boolean) => void): void;
    /**
     * Shows a dialog on the main menu when the pipes mod is not installed
     */
    static requireInstalled(): void;
    /**
     * Returns if the pipes mod is installed
     * @returns {boolean}
     */
    static isInstalled(): boolean;
    /**
     * Returns the pipes mod instance
     * @returns {?PipesMod}
     */
    static getMod(): PipesMod | null;
    /**
     * Returns the version of the pipes mod instance
     * @returns {?string}
     */
    static getVersion(): string | null;
}
export type PipesMod = import("shapez/mods/mod").Mod & {
    PipeConnectorComponent: typeof import("../../js/components/pipe_connector").PipeConnectorComponent;
    PipePinComponent: typeof import("../../js/components/pipe_pin").PipePinComponent;
    BaseFluid: typeof import("../../js/items/base_fluid").BaseFluid;
    typeFluidSingleton: typeof import("../../js/items/base_fluid").typeFluidSingleton;
    gFluidRegistry: typeof import("../../js/items/base_fluid").gFluidRegistry;
};
