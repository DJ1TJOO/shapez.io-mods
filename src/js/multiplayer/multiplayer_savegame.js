import { ExplainedResult } from "shapez/core/explained_result";
import { createLogger } from "shapez/core/logging";
import { Savegame } from "shapez/savegame/savegame";
import { BaseSavegameInterface } from "shapez/savegame/savegame_interface";
import { savegameInterfaces, getSavegameInterface } from "shapez/savegame/savegame_interface_registry";
import { SavegameSerializer } from "shapez/savegame/savegame_serializer";

const logger = createLogger("savegame");

export class MultiplayerSavegame {
    constructor(app, gameData) {
        this.app = app;

        this.currentData = gameData;

        assert(
            savegameInterfaces[Savegame.getCurrentVersion()],
            "Savegame interface not defined: " + Savegame.getCurrentVersion()
        );
    }

    //////// RW Proxy Impl //////////

    /**
     * @returns {number}
     */
    static getCurrentVersion() {
        return Savegame.getCurrentVersion();
    }

    /**
     * @returns {typeof BaseSavegameInterface}
     */
    static getReaderClass() {
        return savegameInterfaces[Savegame.getCurrentVersion()];
    }

    /**
     * @returns {number}
     */
    getCurrentVersion() {
        return /** @type {typeof MultiplayerSavegame} */ (this.constructor).getCurrentVersion();
    }

    /**
     * Returns the savegames default data
     */
    getDefaultData() {
        return {
            version: this.getCurrentVersion(),
            dump: null,
            stats: {},
            lastUpdate: Date.now(),
        };
    }

    /**
     * Verifies the savegames data
     */
    verify(data) {
        if (!data.dump) {
            // Well, guess that works
            return ExplainedResult.good();
        }

        if (!this.getDumpReaderForExternalData(data).validate()) {
            return ExplainedResult.bad("dump-reader-failed-validation");
        }
        return ExplainedResult.good();
    }

    //////// Subclasses interface  ////////

    /**
     * Returns if this game can be saved on disc
     * @returns {boolean}
     */
    isSaveable() {
        return false;
    }

    /**
     * Returns the statistics of the savegame
     */
    getStatistics() {
        return this.currentData.stats;
    }

    /**
     * Returns the *real* last update of the savegame, not the one of the metadata
     * which could also be the servers one
     */
    getRealLastUpdate() {
        return this.currentData.lastUpdate;
    }

    /**
     * Returns if this game has a serialized game dump
     */
    hasGameDump() {
        return !!this.currentData.dump && this.currentData.dump.entities.length > 0;
    }

    /**
     * Returns the current game dump
     */
    getCurrentDump() {
        return this.currentData.dump;
    }

    /**
     * Returns a reader to access the data
     * @returns {BaseSavegameInterface}
     */
    getDumpReader() {
        if (!this.currentData.dump) {
            logger.warn("Getting reader on null-savegame dump");
        }

        const cls = /** @type {typeof MultiplayerSavegame} */ (this.constructor).getReaderClass();
        return new cls(this.currentData);
    }

    /**
     * Returns a reader to access external data
     * @returns {BaseSavegameInterface}
     */
    getDumpReaderForExternalData(data) {
        assert(data.version, "External data contains no version");
        return getSavegameInterface(data);
    }

    ///////// Public Interface ///////////

    /**
     * Updates the last update field so we can send the savegame to the server,
     * WITHOUT Saving!
     */
    setLastUpdate(time) {
        this.currentData.lastUpdate = time;
    }

    updateData(root) {
        // Construct a new serializer
        const serializer = new SavegameSerializer();

        // let timer = performance.now();
        const dump = serializer.generateDumpFromGameRoot(root);
        if (!dump) {
            return false;
        }

        const shadowData = Object.assign({}, this.currentData);
        shadowData.dump = dump;
        shadowData.lastUpdate = new Date().getTime();
        shadowData.version = this.getCurrentVersion();

        const reader = this.getDumpReaderForExternalData(shadowData);

        // Save data
        this.currentData = shadowData;
    }
}
