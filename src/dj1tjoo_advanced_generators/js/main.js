import { Mod } from "shapez/mods/mod";
import { AdvancedEnergy } from "@dj1tjoo/shapez-advanced-energy";

import { MetaBasicConsumerBuilding, setupBasicConsumer } from "./buildings/basic_consumer";
import { MetaEnergyConnectorBuilding } from "./buildings/energy_connector";
import { MetaBasicGeneratorBuilding, setupBasicGenerator } from "./buildings/basic_generator";
import { BasicGeneratorComponent } from "./components/basic_generator";
import { BasicGeneratorSystem } from "./systems/basic_generator";
import { EnergyConnectorRendererSystem } from "./systems/energy_connector_renderer";
import { EnergyConnectorRendererComponent } from "./components/energy_connector_renderer";
import { HUDConnectorInfo } from "./hud/connector_info";
import { GameHUD } from "shapez/game/hud/hud";
import { PipeConnectorRendererComponent } from "./components/pipe_connector_renderer";
import { PipeConnectorRendererSystem } from "./systems/pipe_connector_renderer";
import { MetaPipeConnectorBuilding } from "./buildings/pipe_connector";
import { MetaPumpBuilding, setupPump } from "./buildings/pump";
import { Pipes } from "@dj1tjoo/shapez-pipes";
import { MapChunk } from "shapez/game/map_chunk";
import { MetaSteamGeneratorBuilding, setupSteamGenerator } from "./buildings/steam_generator";
import { config } from "./config";
import { Water } from "../../shared/fluids/water";
import { EnergyPinRendererSystem } from "../../shared/systems/energy_pin_renderer";
import { EnergyPinRendererComponent } from "../../shared/components/energy_pin_renderer";
import { registerComponentShared, registerSystemShared } from "../../shared/registerShared";
import { MetaTurbineBuilding, setupTurbine } from "./buildings/turbine";
import { TurbineComponent } from "./components/turbine";
import { TurbineSystem } from "./systems/turbine";
import { PipePinRendererSystem } from "../../shared/systems/pipe_pin_renderer";
import { PipePinRendererComponent } from "../../shared/components/pipe_pin_renderer";
import { MetaEnergyTunnelBuilding } from "./buildings/energy_tunnel";
import { MetaPipeTunnelBuilding } from "./buildings/pipe_tunnel";
import { globalConfig } from "shapez/core/config";
import { AdvancedGeneratorsToolbar } from "./toolbars/advanced_generators_toolbar";
import { HUDToolbarSwitcher } from "./hud/toolbar_switcher";
import { rewards } from "./reward";

/**
 * @typedef {import("shapez/game/hud/parts/base_toolbar").HUDBaseToolbar & {
 *  mtForceVisible: boolean
 *  mtForceToggle: () => void
 *  mtForceEnable: () => void
 *  mtForceDisable: () => void
 * }} HUDBaseToolbarMT
 */

/**
 * @typedef {Object} ToolbarManager
 * @property {Record<string, HUDBaseToolbarMT>} idToToolbar
 * @property {(id: string, toolbar: import("shapez/game/hud/parts/base_toolbar").HUDBaseToolbar) => void} registerToolbar Register a new toolbar.
 * @property {(id: string) => void} toggleToolbar Toggle the visibility of the toolbar with the given id.
 * @property {(id: string) => void} enableToolbar Force show toolbarID.
 * @property {(id: string) => void} disableToolbar Force hide toolbarID.
 * @property {(id: string) => HUDBaseToolbarMT} getToolbarByID Get the toolbar with the given id.
 */

/**
 * @typedef {(id: string, toolbar: typeof import("shapez/game/hud/parts/base_toolbar").HUDBaseToolbar, isVisible?: boolean) => void} registerToolbar
 */

class ModImpl extends Mod {
    init() {
        this.config = config();

        AdvancedEnergy.requireInstalled();
        Pipes.requireInstalled();

        // AdvancedEnergy.enableDebug();
        // Pipes.enableDebug();

        this.registerHuds();
        this.registerToolbar();
        this.registerBuildings();
        this.registerComponents();
        this.registerSystems();
        this.registerPatches();

        this.signals.modifyLevelDefinitions.add(
            /**
             * @param { {
             * shape: string;
             * required: number;
             * reward: string;
             * }[]} levelDefinitions
             */
            levelDefinitions => {
                let levelsAdded = 0;
                levelDefinitions.splice(5 + levelsAdded++, 0, {
                    required: 170,
                    reward: rewards.advanced_energy_tunnels,
                    shape: "--CuCu--",
                });
                levelDefinitions.splice(10 + levelsAdded++, 0, {
                    required: 900,
                    reward: rewards.advanced_energy_fluids,
                    shape: "ScSpSpSc",
                });
                levelDefinitions.splice(18 + levelsAdded++, 0, {
                    required: 22000,
                    reward: rewards.advanced_energy_steam_turbine,
                    shape: "RpRpCyCy:CyCySwSw",
                });
            }
        );
    }

    registerToolbar() {
        this.signals.appBooted.add(() => {
            if (!globalConfig["toolbarManager"]) return;

            /** @type {registerToolbar} */
            const registerToolbar = this.modInterface["registerToolbar"];

            registerToolbar.apply(this.modInterface, [
                "advancedGeneratorsToolbar",
                AdvancedGeneratorsToolbar,
            ]);

            this.modInterface.registerHudElement("toolbarSwitcher", HUDToolbarSwitcher);
        });
    }

    registerPatches() {
        this.modInterface.runAfterMethod(MapChunk, "generatePatches", function ({ rng }) {
            if (rng.next() < 0.05) {
                this.internalGeneratePatch(rng, 2, Water.SINGLETON);
            }
        });
    }

    registerHuds() {
        this.modInterface.registerHudElement("connectorInfo", HUDConnectorInfo);
        this.modInterface.runAfterMethod(GameHUD, "drawOverlays", function (parameters) {
            this.parts["connectorInfo"].drawOverlays(parameters);
        });
    }

    registerComponents() {
        this.modInterface.registerComponent(BasicGeneratorComponent);
        this.modInterface.registerComponent(EnergyConnectorRendererComponent);
        this.modInterface.registerComponent(PipeConnectorRendererComponent);
        this.modInterface.registerComponent(TurbineComponent);

        registerComponentShared.bind(this)(EnergyPinRendererComponent);
        registerComponentShared.bind(this)(PipePinRendererComponent);
    }

    registerSystems() {
        this.modInterface.registerGameSystem({
            id: "basic_generator",
            systemClass: BasicGeneratorSystem,
            before: "end",
            drawHooks: ["staticAfter"],
        });
        this.modInterface.registerGameSystem({
            id: "energy_connector_renderer",
            systemClass: EnergyConnectorRendererSystem,
            before: "end",
            drawHooks: ["staticBefore"],
        });
        this.modInterface.registerGameSystem({
            id: "pipe_connector_renderer",
            systemClass: PipeConnectorRendererSystem,
            before: "end",
            drawHooks: ["staticBefore"],
        });
        this.modInterface.registerGameSystem({
            id: "turbine",
            systemClass: TurbineSystem,
            before: "end",
            drawHooks: ["staticAfter"],
        });
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
        setupBasicConsumer.apply(this);
        this.modInterface.registerNewBuilding({
            metaClass: MetaBasicConsumerBuilding,
        });
        setupBasicGenerator.apply(this);
        this.modInterface.registerNewBuilding({
            metaClass: MetaBasicGeneratorBuilding,
        });
        this.modInterface.registerNewBuilding({
            metaClass: MetaEnergyConnectorBuilding,
        });
        this.modInterface.registerNewBuilding({
            metaClass: MetaPipeConnectorBuilding,
        });
        this.modInterface.registerNewBuilding({
            metaClass: MetaEnergyTunnelBuilding,
        });
        this.modInterface.registerNewBuilding({
            metaClass: MetaPipeTunnelBuilding,
        });
        setupPump.apply(this);
        this.modInterface.registerNewBuilding({
            metaClass: MetaPumpBuilding,
        });
        setupSteamGenerator.apply(this);
        this.modInterface.registerNewBuilding({
            metaClass: MetaSteamGeneratorBuilding,
        });
        setupTurbine.apply(this);
        this.modInterface.registerNewBuilding({
            metaClass: MetaTurbineBuilding,
        });

        this.signals.appBooted.add(() => {
            const toolbar = !globalConfig["toolbarManager"] ? "regular" : "advancedGeneratorsToolbar";

            const buildings = [
                MetaBasicGeneratorBuilding,
                MetaBasicConsumerBuilding,
                MetaEnergyConnectorBuilding,
                MetaPipeConnectorBuilding,
                MetaPumpBuilding,
                MetaSteamGeneratorBuilding,
                MetaTurbineBuilding,
                MetaEnergyTunnelBuilding,
                MetaPipeTunnelBuilding,
            ];

            buildings.forEach(x =>
                this.modInterface.addNewBuildingToToolbar({
                    location: "primary",
                    // @ts-expect-error Types only allow for two default toolbars
                    toolbar,
                    metaClass: x,
                })
            );
        });
    }
}
