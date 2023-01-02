import { Mod } from "shapez/mods/mod";
import { PipeConnectorComponent } from "./components/pipe_connector";
import { PipePinComponent } from "./components/pipe_pin";
import { PipeTickerComponent } from "./components/pipe_ticker";
import { BaseFluid, gFluidRegistry, typeFluidSingleton } from "./items/base_fluid";
import { PipeSystem } from "./systems/pipe";
import { PipeTickerSystem } from "./systems/pipe_ticker";

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
        this.modInterface.registerComponent(PipeTickerComponent);
    }

    registerSystems() {
        this.modInterface.registerGameSystem({
            id: "pipe_ticker",
            systemClass: PipeTickerSystem,
            before: "end",
        });
        this.modInterface.registerGameSystem({
            id: "pipeAPI",
            before: "end",
            systemClass: PipeSystem,
            drawHooks: ["staticAfter"],
        });
    }

    exposeComponents() {
        this.PipeConnectorComponent = PipeConnectorComponent;
        this.PipeTickerComponent = PipeTickerComponent;
        this.PipePinComponent = PipePinComponent;
        this.BaseFluid = BaseFluid;
        this.gFluidRegistry = gFluidRegistry;
        this.typeFluidSingleton = typeFluidSingleton;
    }
}
