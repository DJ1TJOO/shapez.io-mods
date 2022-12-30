import { Mod } from "shapez/mods/mod";
import { MetaBasicConsumerBuilding, setupBasicConsumer } from "./buildings/basic_consumer";
import { MetaBasicGeneratorBuilding, setupBasicGenerator } from "./buildings/basic_generator";
import { MetaFluxPipeBuilding } from "./buildings/flux_pipe";
import { MetaFluxPipeTypeBuilding } from "./buildings/flux_pipe_type";
import { MetaFluxStorageBuilding } from "./buildings/flux_storage";
import { MetaFluxInsulatorBuilding } from "./buildings/insulator";
import { EnergyConnectorComponent } from "./components/energy_connector";
import { EnergyPinComponent } from "./components/energy_pin";
import { EnergySystem } from "./systems/energy";

class ModImpl extends Mod {
    init() {
        // Register parts
        this.registerComponents();
        this.registerSystems();

        // Make components public
        this.exposeComponents();

        // Temporary test buildings
        setupBasicGenerator.apply(this);
        this.modInterface.registerNewBuilding({
            metaClass: MetaBasicGeneratorBuilding,
        });

        this.modInterface.registerNewBuilding({
            metaClass: MetaFluxPipeBuilding,
        });
        this.modInterface.registerNewBuilding({
            metaClass: MetaFluxPipeTypeBuilding,
        });
        this.modInterface.registerNewBuilding({
            metaClass: MetaFluxInsulatorBuilding,
        });
        this.modInterface.registerNewBuilding({
            metaClass: MetaFluxStorageBuilding,
        });

        setupBasicConsumer();
        this.modInterface.registerNewBuilding({
            metaClass: MetaBasicConsumerBuilding,
        });

        this.modLoader.signals.hudElementInitialized.add(element => {
            if (element.constructor.name === "HUDBuildingsToolbar") {
                element.primaryBuildings.push(MetaBasicGeneratorBuilding);
                element.primaryBuildings.push(MetaBasicConsumerBuilding);
                element.primaryBuildings.push(MetaFluxPipeBuilding);
                element.primaryBuildings.push(MetaFluxPipeTypeBuilding);
                element.primaryBuildings.push(MetaFluxInsulatorBuilding);
                element.primaryBuildings.push(MetaFluxStorageBuilding);
            }
        });
    }

    registerComponents() {
        this.modInterface.registerComponent(EnergyConnectorComponent);
        this.modInterface.registerComponent(EnergyPinComponent);
    }

    registerSystems() {
        this.modInterface.registerGameSystem({
            id: "djtjoo@energy",
            before: "end",
            systemClass: EnergySystem,
            drawHooks: ["staticAfter"],
        });
    }

    exposeComponents() {
        this.EnergyConnectorComponent = EnergyConnectorComponent;
        this.EnergyPinComponent = EnergyPinComponent;
    }
}
