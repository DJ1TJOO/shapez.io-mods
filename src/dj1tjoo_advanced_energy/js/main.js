import { Mod } from "shapez/mods/mod";
import { EnergyConnectorComponent } from "./components/energy_connector";
import { EnergyPinComponent } from "./components/energy_pin";
import { EnergyTunnelComponent } from "./components/energy_tunnel";
import { EnergySystem } from "./systems/energy";

import icon from "../../../energy-icon.png";
import banner from "../../../energy.png";

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
                                    <img src="${banner}" alt="Advanced Energy">
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td align="center">
                                    <h2>Advanced Energy</h2>
                                </td> 
                            </tr> 
                            <tr> 
                                <td align="center">Advanced Energy allows mods to share an energy network. Mods can add their own connectors, and buildings that generates and uses energy! This api makes use of a network system. All transfers within a network are instant.</td>
                            </tr>
                        </tbody>
                        </table>`,
        };
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
