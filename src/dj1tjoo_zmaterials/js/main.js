import { enumDirectionToVector, enumInvertedDirections } from "shapez/core/vector";
import { GameLogic } from "shapez/game/logic";
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

        // TODO: try make pipes work like belts
        this.modInterface.replaceMethod(
            // @ts-ignore
            this.modLoader.mods.find(x => x.metadata.id === "dj1tjoo_pipes").PipeSystem,
            "findSurroundingPipeTargets",
            function ($super, [initialTile, directions, network, variantMask = null, distance = []]) {
                const results = $super(initialTile, directions, network, variantMask, distance);

                const newResults = [];
                for (let i = 0; i < results.length; i++) {
                    const { entity, slot, distance } = results[i];
                    if (slot) newResults.push({ entity, slot, distance });

                    // if (newResults.filter(x => !x.slot).length > 1) continue;
                    // Get neigbours, check if connections, less than 2 push

                    newResults.push({ entity, slot, distance });
                }

                return newResults;
            }
        );

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
