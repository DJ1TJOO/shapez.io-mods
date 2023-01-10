import { AdvancedEnergy } from "@dj1tjoo/shapez-advanced-energy";
import { Mod } from "shapez/mods/mod";
import { cutter } from "./buildings/cutter";
import { mixer } from "./buildings/mixer";
import { painter } from "./buildings/painter";
import { rotater } from "./buildings/rotater";
import { stacker } from "./buildings/stacker";
import { config } from "./config";
import { registerSystemShared, registerComponentShared } from "../../shared/registerShared";
import { EnergyPinRendererSystem } from "../../shared/systems/energy_pin_renderer";
import { EnergyPinRendererComponent } from "../../shared/components/energy_pin_renderer";

import icon from "../../../energized-icon.png";
import banner from "../../../energized.png";

class ModImpl extends Mod {
    init() {
        this.config = config();

        AdvancedEnergy.requireInstalled();

        this.registerComponents();
        this.registerSystems();
        this.addEnergyPins();

        // Add mod extra's metadata
        this.metadata["extra"] = {
            library: false,
            authors: [
                {
                    name: "DJ1TJOO",
                    icon: "https://avatars.githubusercontent.com/u/44841260?s=64",
                },
            ],
            source: "https://github.com/DJ1TJOO/shapez.io-mods/",
            icon: icon,
            changelog: {
                "1.0.0": ["Added energy pins to vanilla processing buildings"],
            },
            readme: `<table> 
                        <thead> 
                            <tr> 
                                <th align="center">
                                    <img src="${banner}" alt="Energized">
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td align="center">
                                    <h2>Energized</h2>
                                </td> 
                            </tr> 
                            <tr> 
                                <td align="center">Adds energy to vanilla processing buildings.</td>
                            </tr>
                        </tbody>
                        </table> 
                        <hr> 
                        <h3 id="name-does-it-all">Energy requirements:</h3> 
                        <hr> 
                        <ul> 
                            <li>
                                <strong>ROTATER</strong>: 50AE/t.
                            </li>
                            <li>
                                <strong>CUTTER</strong>: 100AE/t.
                            </li>
                            <li>
                                <strong>STACKER</strong>: 100AE/t.
                            </li>
                            <li>
                                <strong>MIXER</strong>: 50AE/t.
                            </li>
                            <li>
                                <strong>PAINTER</strong>: 100AE/t.
                            </li>
                        </ul>`,
        };
    }

    addEnergyPins() {
        rotater(this);
        cutter(this);
        stacker(this);
        mixer(this);
        painter(this);
    }

    registerSystems() {
        registerSystemShared.bind(this)({
            id: "energy_pin_renderer",
            systemClass: EnergyPinRendererSystem,
            before: "end",
            drawHooks: ["staticAfter"],
        });
    }

    registerComponents() {
        registerComponentShared.bind(this)(EnergyPinRendererComponent);
    }
}
