/** @type {{MODS: import("shapez/mods/modloader").ModLoader}} */
const { MODS } = shapez;

const MOD_ID = "dj1tjoo_toolbar_switcher";

/**
 * @typedef {import("shapez/mods/mod").Mod} ToolbarSwitcherMod
 * @typedef {import("../../js/toolbarManager").ToolbarManager} ToolbarManager
 */

export class ToolbarSwitcher {
    static isLoadedComplete = false;
    static isLoaded = [];
    static loadedUid = 0;
    static toolbarsToRegister = [];

    /**
     * Registers a new building to a toolbar
     * @param {object} param0
     * @param {string} param0.toolbar
     * @param {"primary"|"secondary"} param0.location
     * @param {typeof import("shapez/game/meta_building").MetaBuilding} param0.metaClass
     * @param {"regular" | "wires"} param0.fallback When the toolbar switcher mod is not available where to add
     */
    static addNewBuildingToToolbar({ toolbar, location = "primary", metaClass, fallback = "regular" }) {
        const register = installed => {
            this.getMod().modInterface.addNewBuildingToToolbar({
                location,
                // @ts-expect-error Modinterface doesn't allow multiple toolbars, but that method has been replaced
                toolbar: installed ? toolbar : fallback,
                metaClass,
            });
        };

        this.onLoaded(installed => {
            if (this.toolbarsToRegister.includes(toolbar)) {
                const timeout = setInterval(() => {
                    if (this.toolbarsToRegister.includes(toolbar)) return;
                    clearInterval(timeout);
                    register(installed);
                }, 100);
            } else {
                register(installed);
            }
        });
    }

    /**
     * Registers a new toolbar if the toolbar switcher mod is installed
     * @param {string} id
     * @param {typeof import("shapez/game/hud/parts/base_toolbar").HUDBaseToolbar} toolbar
     * @param {boolean?} isVisible
     * @returns {void}
     */
    static registerToolbar(id, toolbar, isVisible = false) {
        this.toolbarsToRegister.push(id);
        this.onLoaded(installed => {
            if (!installed) return;

            const registerToolbar = this.getMod().modInterface["registerToolbar"];
            registerToolbar.apply(this.getMod().modInterface, [id, toolbar, isVisible]);
            this.toolbarsToRegister.splice(this.toolbarsToRegister.indexOf(id), 1);
        });
    }

    /**
     * Shows a dialog on the main menu when the toolbar switcher mod is not installed
     */
    static requireInstalled() {
        this.onLoaded(installed => {
            if (installed) return;

            MODS.signals.stateEntered.add(gameState => {
                if (gameState.getKey() !== "MainMenuState") return;
                /** @type {import("shapez/game/hud/parts/modal_dialogs").HUDModalDialogs | null} */
                const dialogs = gameState["dialogs"];
                if (!dialogs) return;

                const title = "Toolbar Switcher Not Found!";
                if (dialogs.dialogStack.some(x => x.title === title)) return;

                dialogs.showWarning(
                    title,
                    "The Toolbar Switcher mod was not found. This mod is required by other mods you installed."
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
     * Register to run callback on toolbar switcher loaded
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
     * Returns if the toolbar switcher mod is installed
     * @returns {boolean}
     */
    static isInstalled() {
        return MODS.mods.some(x => x.metadata.id === MOD_ID);
    }

    /**
     * Returns the toolbar switcher mod instance
     * @returns {?ToolbarSwitcherMod}
     */
    static getMod() {
        return /** @type {ToolbarSwitcherMod} */ (MODS.mods.find(x => x.metadata.id === MOD_ID)) || null;
    }

    /**
     * Returns the version of the toolbar switcher mod instance
     * @returns {?string}
     */
    static getVersion() {
        const mod = this.getMod();
        if (!mod) return null;

        return mod.metadata.version;
    }
}
