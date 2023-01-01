import { Mod } from "shapez/mods/mod";
import { AdvancedEnergy } from "@dj1tjoo/shapez-advanced-energy";

import { MetaBasicConsumerBuilding, setupBasicConsumer } from "./buildings/basic_consumer";
import { MetaBasicConnectorBuilding } from "./buildings/connector";
import { MetaBasicGeneratorBuilding, setupBasicGenerator } from "./buildings/basic_generator";
import { BasicGeneratorComponent } from "./components/basic_generator";
import { BasicGeneratorSystem } from "./systems/basic_generator";
import { ConnectorRendererSystem } from "./systems/connector_renderer";
import { ConnectorRendererComponent } from "./components/connector_renderer";
import { HUDConnectorInfo } from "./hud/connector_info";
import { GameHUD } from "shapez/game/hud/hud";

class ModImpl extends Mod {
    init() {
        AdvancedEnergy.requireInstalled();
        // AdvancedEnergy.enableDebug();

        this.registerHuds();
        this.registerBuildings();
        this.registerComponents();
        this.registerSystems();
    }

    registerHuds() {
        this.modInterface.registerHudElement("connectorInfo", HUDConnectorInfo);
        this.modInterface.runAfterMethod(GameHUD, "drawOverlays", function (parameters) {
            this.parts["connectorInfo"].drawOverlays(parameters);
        });
    }

    registerComponents() {
        this.modInterface.registerComponent(BasicGeneratorComponent);
        this.modInterface.registerComponent(ConnectorRendererComponent);
    }

    registerSystems() {
        this.modInterface.registerGameSystem({
            id: "basic_generator",
            systemClass: BasicGeneratorSystem,
            before: "end",
            drawHooks: ["staticAfter"],
        });
        this.modInterface.registerGameSystem({
            id: "connector_renderer",
            systemClass: ConnectorRendererSystem,
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
