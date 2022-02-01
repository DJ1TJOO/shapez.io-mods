import { Mod } from "shapez/mods/mod";
import { MetaExtractorBuilding } from "./buildings/extractor";
import { ExtractorComponent } from "./components/extractor";
import { ExtractorSystem } from "./systems/extractor";

class ModImpl extends Mod {
    init() {
        this.checkSettings();

        this.modInterface.registerNewBuilding({
            metaClass: MetaExtractorBuilding,
        });
        this.modInterface.registerComponent(ExtractorComponent);
        this.modInterface.registerGameSystem({
            id: "extractor",
            before: "end",
            systemClass: ExtractorSystem,
        });
    }

    checkSettings() {
        // Create default settings if corrupted
        if (!this.settings) {
            this.settings = {};
        }

        this.saveSettings();
    }
}
