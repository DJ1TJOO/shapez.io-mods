import { Mod } from "shapez/mods/mod";
import { MetaCustomPipeBuilding } from "./buildings/custom_pipe";
import { MetaExtractorBuilding } from "./buildings/extractor";
import { CustomPipeRendererComponent } from "./components/custom_pipe_renderer";
import { ExtractorComponent } from "./components/extractor";
import { registerOil } from "./fluid/oil";
import { CustomPipeRendererSystem } from "./systems/custom_pipe_renderer";
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
        this.modInterface.addNewBuildingToToolbar({
            toolbar: "regular",
            location: "primary",
            metaClass: MetaExtractorBuilding,
        });

        this.modInterface.registerNewBuilding({
            metaClass: MetaCustomPipeBuilding,
        });
        this.modInterface.addNewBuildingToToolbar({
            toolbar: "regular",
            location: "primary",
            metaClass: MetaCustomPipeBuilding,
        });

        this.modInterface.registerComponent(CustomPipeRendererComponent);

        this.modInterface.registerGameSystem({
            id: "customPipeRenderer",
            before: "staticMapEntities",
            systemClass: CustomPipeRendererSystem,
            drawHooks: ["staticBefore"],
        });

        registerOil();
    }

    checkSettings() {
        // Create default settings if corrupted
        if (!this.settings) {
            this.settings = {};
        }

        this.saveSettings();
    }
}
