import { Mod } from "shapez/mods/mod";
import { AdvancedEnergy } from "@dj1tjoo/shapez-advanced-energy";

class ModImpl extends Mod {
    init() {
        const energy = new AdvancedEnergy();
    }
}
