import { Mod } from "shapez/mods/mod";
import { EnergyConnectorComponent } from "./components/energy_connector";
import { EnergyPinComponent } from "./components/energy_pin";
import { EnergyTunnelComponent } from "./components/energy_tunnel";
import { EnergySystem } from "./systems/energy";

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
        this.modInterface.registerComponent(EnergyTunnelComponent);
    }

    registerSystems() {
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
        this.EnergyTunnelComponent = EnergyTunnelComponent;
    }
}
