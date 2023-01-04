import { Pipes } from "@dj1tjoo/shapez-pipes";
import { Mod } from "shapez/mods/mod";
import { MetaBlastFurnaceBuilding, setupBlastFurnace } from "./buildings/blast_furnace";
import { MetaHeaterBuilding, setupHeater } from "./buildings/heater";
import { EnergyPinRendererComponent } from "../../shared/components/energy_pin_renderer";
import { config } from "./config";
import { MaterialItem } from "./fluids/items/materials";
import { EnergyPinRendererSystem } from "../../shared/systems/energy_pin_renderer";
import { PipePinRendererSystem } from "../../shared/systems/pipe_pin_renderer";
import { registerComponentShared, registerSystemShared } from "../../shared/registerShared";
import { PipePinRendererComponent } from "../../shared/components/pipe_pin_renderer";

class ModImpl extends Mod {
    init() {
        this.config = config();

        Pipes.requireInstalled();

        this.modInterface.registerItem(MaterialItem, itemData => this.materialSingletons[itemData]);

        this.registerMaterialSingeltons();

        this.registerComponents();
        this.registerSystems();
        this.registerBuildings();
    }

    registerComponents() {
        registerComponentShared.bind(this)(EnergyPinRendererComponent);
        registerComponentShared.bind(this)(PipePinRendererComponent);
    }

    registerSystems() {
        registerSystemShared.bind(this)({
            id: "pipe_pin_renderer",
            systemClass: PipePinRendererSystem,
            before: "end",
            drawHooks: ["staticAfter"],
        });
        registerSystemShared.bind(this)({
            id: "energy_pin_renderer",
            systemClass: EnergyPinRendererSystem,
            before: "end",
            drawHooks: ["staticAfter"],
        });
    }

    registerBuildings() {
        setupBlastFurnace.apply(this);
        this.modInterface.registerNewBuilding({
            metaClass: MetaBlastFurnaceBuilding,
        });
        setupHeater.apply(this);
        this.modInterface.registerNewBuilding({
            metaClass: MetaHeaterBuilding,
        });

        this.modLoader.signals.hudElementInitialized.add(element => {
            if (element.constructor.name === "HUDBuildingsToolbar") {
                element.primaryBuildings.push(MetaBlastFurnaceBuilding);
                element.primaryBuildings.push(MetaHeaterBuilding);
            }
        });
    }

    registerMaterialSingeltons() {
        if (!this.materialSingletons) this.materialSingletons = {};

        for (const type in config().materials) {
            if (this.materialSingletons[type]) continue;

            this.materialSingletons[type] = new MaterialItem(type);
        }
    }

    registerMaterial(type, backgroundColorAsResource) {
        config().materials[type] = backgroundColorAsResource;
        config().registerMaterialSingeltons();
    }
}

export { ModImpl };
