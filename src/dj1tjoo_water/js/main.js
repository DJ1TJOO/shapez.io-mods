import { Mod } from "shapez/mods/mod";

class ModImpl extends Mod {
    init() {
        this.checkSettings();
    }

    checkSettings() {
        // Create default settings if corrupted
        if (!this.settings) {
            this.settings = {};
        }

        this.saveSettings();
    }
}
