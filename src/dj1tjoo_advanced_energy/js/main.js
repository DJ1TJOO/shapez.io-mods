import { Mod } from "shapez/mods/mod";
import { EnergyConnectorComponent } from "./components/energy_connector";
import { EnergyPinComponent } from "./components/energy_pin";
import { EnergyTickerComponent } from "./components/energy_ticker";
import { EnergySystem } from "./systems/energy";
import { EnergyTickerSystem } from "./systems/energy_ticker";

class ModImpl extends Mod {
    init() {
        // Register parts
        this.registerComponents();
        this.registerSystems();

        // Make components public
        this.exposeComponents();
    }

    registerComponents() {
        this.modInterface.registerComponent(EnergyConnectorComponent);
        this.modInterface.registerComponent(EnergyPinComponent);
        this.modInterface.registerComponent(EnergyTickerComponent);
    }

    registerSystems() {
        this.modInterface.registerGameSystem({
            id: "energy_ticker",
            systemClass: EnergyTickerSystem,
            before: "end",
        });
        this.modInterface.registerGameSystem({
            id: "energyAPI",
            before: "end",
            systemClass: EnergySystem,
            drawHooks: ["staticAfter"],
        });
    }

    exposeComponents() {
        this.EnergyConnectorComponent = EnergyConnectorComponent;
        this.EnergyPinComponent = EnergyPinComponent;
        this.EnergyTickerComponent = EnergyTickerComponent;
    }
}
