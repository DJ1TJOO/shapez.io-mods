import { Mod } from "shapez/mods/mod";
import { AdvancedEnergy } from "@dj1tjoo/shapez-advanced-energy";

import { MetaBasicConsumerBuilding, setupBasicConsumer } from "./buildings/basic_consumer";
import { MetaBasicConnectorBuilding } from "./buildings/basic_connector";
import { MetaBasicGeneratorBuilding, setupBasicGenerator } from "./buildings/basic_generator";
import { BasicGeneratorComponent } from "./components/basic_generator";
import { BasicGeneratorSystem } from "./systems/basic_generator";
import { BasicConnectorRendererSystem } from "./systems/basic_connector_renderer";
import { BasicConnectorRendererComponent } from "./components/basic_connector_renderer";

class ModImpl extends Mod {
    init() {
        AdvancedEnergy.requireInstalled();
        // AdvancedEnergy.enableDebug();

        this.registerBuildings();
        this.registerComponents();
        this.registerSystems();
    }

    registerComponents() {
        this.modInterface.registerComponent(BasicGeneratorComponent);
        this.modInterface.registerComponent(BasicConnectorRendererComponent);
    }

    registerSystems() {
        this.modInterface.registerGameSystem({
            id: "basic_generator",
            systemClass: BasicGeneratorSystem,
            before: "end",
            drawHooks: ["staticAfter"],
        });
        this.modInterface.registerGameSystem({
            id: "basic_connectorRenderer",
            systemClass: BasicConnectorRendererSystem,
            before: "end",
            drawHooks: ["staticBefore"],
        });
    }

    registerBuildings() {
        setupBasicConsumer.apply(this);
        this.modInterface.registerNewBuilding({
            metaClass: MetaBasicConsumerBuilding,
        });
        setupBasicGenerator.apply(this);
        this.modInterface.registerNewBuilding({
            metaClass: MetaBasicGeneratorBuilding,
        });
        this.modInterface.registerNewBuilding({
            metaClass: MetaBasicConnectorBuilding,
        });

        this.modLoader.signals.hudElementInitialized.add(element => {
            if (element.constructor.name === "HUDBuildingsToolbar") {
                element.primaryBuildings.push(MetaBasicConsumerBuilding);
                element.primaryBuildings.push(MetaBasicGeneratorBuilding);
                element.primaryBuildings.push(MetaBasicConnectorBuilding);
            }
        });
    }
}
