import { Pipes } from "@dj1tjoo/shapez-pipes";
import { Mod } from "shapez/mods/mod";
import { MetaBlastFurnaceBuilding, setupBlastFurnace } from "./buildings/blast_furnace";
import { MetaHeaterBuilding, setupHeater } from "./buildings/heater";
import { EnergyPinRendererComponent } from "../../shared/components/energy_pin_renderer";
import { config } from "./config";
import { MaterialItem } from "./items/materials";
import { EnergyPinRendererSystem } from "../../shared/systems/energy_pin_renderer";
import { PipePinRendererSystem } from "../../shared/systems/pipe_pin_renderer";
import { registerComponentShared, registerSystemShared } from "../../shared/registerShared";
import { PipePinRendererComponent } from "../../shared/components/pipe_pin_renderer";
import { ToolbarSwitcher } from "@dj1tjoo/shapez-toolbar-switcher";
import { MaterialsToolbar } from "./toolbars/materials_toolbar";
import { MetaWaterSprayerBuilding, setupWaterSprayer } from "./buildings/water_sprayer";
import { MetaPipeConnectorBuilding } from "./buildings/pipe_connector";
import { MetaPipeTunnelBuilding } from "./buildings/pipe_tunnel";
import { setupPump, MetaPumpBuilding } from "./buildings/pump";
import { PipeConnectorRendererSystem } from "./systems/pipe_connector_renderer";
import { PipeConnectorRendererComponent } from "./components/pipe_connector_renderer";
import { MapChunk } from "shapez/game/map_chunk";
import { Water } from "../../shared/fluids/water";

class ModImpl extends Mod {
    init() {
        this.config = config();

        this.materialSingletons = {};

        Pipes.requireInstalled();
        Pipes.enableDebug();

        this.modInterface.registerItem(MaterialItem, itemData => this.materialSingletons[itemData]);

        this.registerMaterialSingeltons();

        this.registerToolbar();
        this.registerComponents();
        this.registerSystems();
        this.registerBuildings();
        this.registerPatches();
    }

    registerPatches() {
        this.modInterface.runAfterMethod(MapChunk, "generatePatches", function ({ rng }) {
            if (rng.next() < 0.05) {
                this.internalGeneratePatch(rng, 2, Water.SINGLETON);
            }
        });

        const sand = this.materialSingletons["sand"];
        this.modInterface.runAfterMethod(
            MapChunk,
            "generatePatches",
            function ({ rng, distanceToOriginInChunks }) {
                if (distanceToOriginInChunks < 3 && rng.next() < 0.5) {
                    this.internalGeneratePatch(rng, 1, sand);
                } else if (rng.next() < 0.05) {
                    this.internalGeneratePatch(rng, 2, sand);
                }
            }
        );
    }

    registerComponents() {
        registerComponentShared.bind(this)(EnergyPinRendererComponent);
        registerComponentShared.bind(this)(PipePinRendererComponent);
        this.modInterface.registerComponent(PipeConnectorRendererComponent);
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
        this.modInterface.registerGameSystem({
            id: "pipe_connector_renderer",
            systemClass: PipeConnectorRendererSystem,
            before: "end",
            drawHooks: ["staticBefore"],
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
        setupWaterSprayer.apply(this);
        this.modInterface.registerNewBuilding({
            metaClass: MetaWaterSprayerBuilding,
        });

        this.modInterface.registerNewBuilding({
            metaClass: MetaPipeConnectorBuilding,
        });
        this.modInterface.registerNewBuilding({
            metaClass: MetaPipeTunnelBuilding,
        });
        setupPump.apply(this);
        this.modInterface.registerNewBuilding({
            metaClass: MetaPumpBuilding,
        });

        const buildings = [MetaBlastFurnaceBuilding, MetaHeaterBuilding, MetaWaterSprayerBuilding];
        const temp = [MetaPipeTunnelBuilding, MetaPipeConnectorBuilding, MetaPumpBuilding];

        const register = [...buildings, ...temp].forEach(x =>
            ToolbarSwitcher.addNewBuildingToToolbar({
                location: "primary",
                toolbar: "materialsToolbar",
                metaClass: x,
                fallback: "regular",
            })
        );
    }

    registerMaterialSingeltons() {
        for (const type in config().materials) {
            if (this.materialSingletons[type]) continue;

            this.materialSingletons[type] = new MaterialItem(type);
        }
    }

    registerMaterial(type, backgroundColorAsResource) {
        config().materials[type] = backgroundColorAsResource;
        this.registerMaterialSingeltons();
        return this.materialSingletons[type];
    }

    registerToolbar() {
        ToolbarSwitcher.registerToolbar("materialsToolbar", MaterialsToolbar);
    }
}

export { ModImpl };
