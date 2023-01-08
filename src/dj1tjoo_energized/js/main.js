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

class ModImpl extends Mod {
    init() {
        this.config = config();

        AdvancedEnergy.requireInstalled();

        this.registerComponents();
        this.registerSystems();
        this.addEnergyPins();
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
