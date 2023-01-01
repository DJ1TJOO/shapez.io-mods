import { Mod } from "shapez/mods/mod";
import { PipeConnectorComponent } from "./components/pipe_connector";
import { PipePinComponent } from "./components/pipe_pin";
import { BaseFluid, gFluidRegistry, typeFluidSingleton } from "./items/base_fluid";
import { PipeSystem } from "./systems/pipe";

class ModImpl extends Mod {
    init() {
        // Register parts
        this.registerComponents();
        this.registerSystems();

        // Make components public
        this.exposeComponents();
    }

    registerComponents() {
        this.modInterface.registerComponent(PipeConnectorComponent);
        this.modInterface.registerComponent(PipePinComponent);
    }

    registerSystems() {
        this.modInterface.registerGameSystem({
            id: "pipeAPI",
            before: "end",
            systemClass: PipeSystem,
            drawHooks: ["staticAfter"],
        });
    }

    exposeComponents() {
        this.PipeConnectorComponent = PipeConnectorComponent;
        this.PipePinComponent = PipePinComponent;
        this.BaseFluid = BaseFluid;
        this.gFluidRegistry = gFluidRegistry;
        this.typeFluidSingleton = typeFluidSingleton;
    }
}
