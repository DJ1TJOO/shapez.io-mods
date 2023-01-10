/** @type {{MODS: import("shapez/mods/modloader").ModLoader}} */
const { MODS } = shapez;

const MOD_ID = "dj1tjoo_pipes";

/**
 * @typedef {import("shapez/mods/mod").Mod & {
 *  PipeConnectorComponent: typeof import("../../js/components/pipe_connector").PipeConnectorComponent
 *  PipePinComponent: typeof import("../../js/components/pipe_pin").PipePinComponent
 *  PipeTunnelComponent: typeof import("../../js/components/pipe_tunnel").PipeTunnelComponent
 *  BaseFluid: typeof import("../../js/items/base_fluid").BaseFluid
 *  typeFluidSingleton: typeof import("../../js/items/base_fluid").typeFluidSingleton
 *  gFluidRegistry: typeof import("../../js/items/base_fluid").gFluidRegistry
 * }} PipesMod
 */

export class Pipes {
    static isLoadedComplete = false;
    static isLoaded = [];
    static loadedUid = 0;

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

    static get PipeTunnelComponent() {
        return this.getMod()?.PipeTunnelComponent || null;
    }

    /**
     * Registers a new fluid from the given class callback
     * @param {() => typeof this.BaseFluid} createFluidClass
     * @returns
     */
    static registerFluid(createFluidClass) {
        let fluidClass = null;
        let singleton = null;
        class Fluid {
            static get SINGLETON() {
                if (singleton) return singleton;
                return (singleton = new this.Class());
            }

            static get Class() {
                if (fluidClass) return fluidClass;

                fluidClass = createFluidClass();
                fluidClass.resolver = () => this.SINGLETON;
                return fluidClass;
            }
        }

        this.onLoaded(installed => {
            if (!installed) return;

            if (this.gFluidRegistry.hasId(Fluid.Class.getId()))
                return console.error(
                    "Couldn't register '" + Fluid.Class.getId() + "', because it already exists"
                );
            this.gFluidRegistry.register(Fluid.Class);
        });

        return Fluid;
    }

    /**
     * Shows a dialog on the main menu when the pipes mod is not installed
     */
    static requireInstalled() {
        this.onLoaded(installed => {
            if (installed) return;

            MODS.signals.stateEntered.add(gameState => {
                if (gameState.getKey() !== "MainMenuState") return;
                /** @type {import("shapez/game/hud/parts/modal_dialogs").HUDModalDialogs | null} */
                const dialogs = gameState["dialogs"];
                if (!dialogs) return;

                const title = "Pipes Not Found!";
                if (dialogs.dialogStack.some(x => x.title === title)) return;

                dialogs.showWarning(
                    title,
                    "The Pipes mod was not found. This mod is required by other mods you installed."
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
     * Register to run callback on pipes loaded
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
     * Returns if the pipes mod is installed
     * @returns {boolean}
     */
    static isInstalled() {
        return MODS.mods.some(x => x.metadata.id === MOD_ID);
    }

    /**
     * Returns the pipes mod instance
     * @returns {?PipesMod}
     */
    static getMod() {
        return /** @type {PipesMod} */ (MODS.mods.find(x => x.metadata.id === MOD_ID)) || null;
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
