/**
 * @typedef {import("shapez/mods/mod").Mod & {
 *  PipeConnectorComponent: typeof import("../../js/components/pipe_connector").PipeConnectorComponent
 *  PipePinComponent: typeof import("../../js/components/pipe_pin").PipePinComponent
 *  BaseFluid: typeof import("../../js/items/base_fluid").BaseFluid
 * }} PipesMod
 */
export class Pipe {
    static get BaseFluid(): typeof import("../../js/items/base_fluid").BaseFluid;
    static get PipeConnectorComponent(): typeof import("../../js/components/pipe_connector").PipeConnectorComponent;
    static get PipePinComponent(): typeof import("../../js/components/pipe_pin").PipePinComponent;
    static enableDebug(): void;
    static disableDebug(): void;
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
};
