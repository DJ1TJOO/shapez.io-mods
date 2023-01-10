import { globalConfig } from "shapez/core/config";
import { HUDBaseToolbar } from "shapez/game/hud/parts/base_toolbar";
import { HUDBuildingsToolbar } from "shapez/game/hud/parts/buildings_toolbar";
import { HUDWiresToolbar } from "shapez/game/hud/parts/wires_toolbar";
import { Mod } from "shapez/mods/mod";
import { ToolbarManager } from "./toolbarManager";
import { HUDToolbarSwitcher } from "./toolbar_switcher";

import icon from "../../../toolbar-switcher-icon.png";
import banner from "../../../toolbar-switcher.png";

const toolbarManager = new ToolbarManager();
globalConfig["toolbarManager"] = toolbarManager;

/**
 * @param {string} id
 * @param {typeof import("shapez/game/hud/base_hud_part").BaseHUDPart} toolbar
 * @param {boolean?} isVisible
 * @returns {void}
 */
shapez.ModInterface.prototype.registerToolbar = function (id, toolbar, isVisible = false) {
    if (!this.toolbarToHUD) {
        this.toolbarToHUD = {};
    }

    this.toolbarToHUD[id] = toolbar.name;
    if (id == "regular" || id == "wires") {
        return;
    }

    /** @type {import("shapez/mods/modloader").ModLoader & {toolbarToHUD: Record<string, string>}} */
    const modLoader = this["modLoader"];

    modLoader.signals.hudInitializer.add(root => {
        // @ts-expect-error Absract class error from ts
        const hud = new toolbar(root);

        root.hud.parts[id] = hud;
        toolbarManager.registerToolbar(id, hud);
    });

    if (isVisible) {
        return;
    }

    modLoader.signals.hudElementFinalized.add(element => {
        if (element == toolbarManager.getToolbarByID(id)) {
            element.mtForceDisable();
        }
    });
};
shapez.ModInterface.prototype.registerToolbar("regular", HUDBuildingsToolbar);
shapez.ModInterface.prototype.registerToolbar("wires", HUDWiresToolbar);

shapez.ModInterface.prototype.addNewBuildingToToolbar = function ({ toolbar, location, metaClass }) {
    const hudElementName = this["toolbarToHUD"][toolbar] || "HUDBuildingsToolbar";
    const property = location === "secondary" ? "secondaryBuildings" : "primaryBuildings";

    this.modLoader.signals.hudElementInitialized.add(element => {
        if (element.constructor.name === hudElementName) {
            element[property].push(metaClass);
        }
    });
};

class ModImpl extends Mod {
    init() {
        this.modInterface.registerHudElement("toolbarSwitcher", HUDToolbarSwitcher);

        this.modLoader.signals.hudElementInitialized.add(element => {
            if (element.constructor.name === "HUDBuildingsToolbar") {
                toolbarManager.registerToolbar("regular", element);
                return;
            }

            if (element.constructor.name === "HUDWiresToolbar") {
                toolbarManager.registerToolbar("wires", element);
                return;
            }
        });

        this.modInterface.extendClass(HUDBaseToolbar, ({ $super, $old }) => ({
            initialize() {
                this.coreCondition = this.visibilityCondition;
                this.visibilityCondition = () => this.mtForceVisible && this.coreCondition();

                this.mtForceEnable();
                $old.initialize.call(this);
            },

            mtForceToggle() {
                this.mtForceVisible = !this.mtForceVisible;
            },

            mtForceEnable() {
                this.mtForceVisible = true;
            },

            mtForceDisable() {
                this.mtForceVisible = false;
            },
        }));

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
                "1.0.0": [
                    "Added support for registering new toolbars",
                    "Added support for swapping toolbars",
                ],
            },
            readme: `<table> 
                        <thead> 
                            <tr> 
                                <th align="center">
                                    <img src="${banner}" alt="Toolbar Switcher">
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td align="center">
                                    <h2>Toolbar Switcher</h2>
                                </td> 
                            </tr> 
                            <tr> 
                                <td align="center">To have less conflicts between mods and toolbars an api was created.</td>
                            </tr>
                        </tbody>
                        </table>`,
        };
    }
}
