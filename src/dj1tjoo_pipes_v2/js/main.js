import { Mod } from "shapez/mods/mod";
import { PipeConnectorComponent } from "./components/pipe_connector";
import { PipePinComponent } from "./components/pipe_pin";
import { PipeTunnelComponent } from "./components/pipe_tunnel";
import { BaseFluid, gFluidRegistry, typeFluidSingleton } from "./items/base_fluid";
import { PipeSystem } from "./systems/pipe";

import icon from "../../../pipesv2-icon.png";
import banner from "../../../pipesv2.png";

class ModImpl extends Mod {
    init() {
        // Register parts
        this.registerComponents();
        this.registerSystems();

        // Make components public
        this.exposeComponents();

        // Add mod extra's metadata
        this.metadata["extra"] = {
            library: true,
            authors: [
                {
                    name: "DJ1TJOO",
                    icon: "https://avatars.githubusercontent.com/u/44841260?s=64",
                },
            ],
            source: "https://github.com/DJ1TJOO/shapez.io-mods/",
            icon: icon,
            changelog: {
                "1.0.1": ["Added SkUpdate support and Mod Extra's"],
                "1.0.0": ["Added energy pins to vanilla processing buildings"],
            },
            readme: `<table> 
                        <thead> 
                            <tr> 
                                <th align="center">
                                    <img src="${banner}" alt="Pipes">
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td align="center">
                                    <h2>Pipes</h2>
                                </td> 
                            </tr> 
                            <tr> 
                                <td align="center">Pipes allows mods to share a pipe network containing fluids. Mods can add their own pipes, fluids, and buildings that generate and use them! This api makes use of a network system. All transfers within a network are instant.</td>
                            </tr>
                        </tbody>
                        </table>`,
        };
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
        this.PipeTunnelComponent = PipeTunnelComponent;
        this.BaseFluid = BaseFluid;
        this.gFluidRegistry = gFluidRegistry;
        this.typeFluidSingleton = typeFluidSingleton;
    }
}
