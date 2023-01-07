import { globalConfig } from "shapez/core/config";
import { makeDiv } from "shapez/core/utils";
import { BaseHUDPart } from "shapez/game/hud/base_hud_part";
import { DynamicDomAttach } from "shapez/game/hud/dynamic_dom_attach";

export class HUDToolbarSwitcher extends BaseHUDPart {
    createElements(parent) {
        this.element = makeDiv(parent, "ingame_HUD_Toolbar_Switcher");
        const row = makeDiv(this.element, null, ["items"]);

        const itemContainer = makeDiv(row, null, ["item"]);
        itemContainer.setAttribute("data-icon", "icons/toolbar_changer.png");

        const icon = makeDiv(itemContainer, null, ["icon"]);
        makeDiv(icon, null, ["switcher"]);

        this.trackClicks(icon, this.cycleToolbar);
    }

    initialize() {
        this.domAttach = new DynamicDomAttach(this.root, this.element, {
            timeToKeepSeconds: 0.12,
            attachClass: "visible",
        });
    }

    update() {
        /** @type {import("./toolbarManager").ToolbarManager} */
        const toolbarManager = globalConfig["toolbarManager"];

        this.visible =
            !this.root.camera.getIsMapOverlayActive() &&
            Object.keys(toolbarManager.idToToolbar).filter(
                x => toolbarManager.getToolbarByID(x).layer === this.root.currentLayer
            ).length > 1;

        this.domAttach.update(this.visible);

        if (this.visible) {
            const uiScale = parseFloat(document.documentElement.style.getPropertyValue("--ui-scale"));

            /** @type {import("./toolbarManager").ToolbarManager} */
            const toolbarManager = globalConfig["toolbarManager"];
            const toolbarWidth = Math.max(
                ...Object.values(toolbarManager.idToToolbar)
                    .filter(x => x.mtForceVisible)
                    .map(
                        x =>
                            document.getElementById(x.htmlElementId)?.querySelector(".primary")
                                ?.clientWidth || 0
                    )
            );

            const padding =
                (document.getElementById("ingame_HUD_Toolbar_Switcher")?.getBoundingClientRect().width || 0) *
                    2 +
                10 * uiScale;

            const totalWidth = toolbarWidth + padding + "px";

            if (this.element.style.getPropertyValue("--toolbar-switcher-length") !== totalWidth) {
                this.element.style.setProperty("--toolbar-switcher-length", totalWidth);
            }
        }
    }

    cycleToolbar() {
        /** @type {import("./toolbarManager").ToolbarManager} */
        const toolbarManager = globalConfig["toolbarManager"];

        const toolbarIds = Object.keys(toolbarManager.idToToolbar).filter(
            x => toolbarManager.getToolbarByID(x).layer === this.root.currentLayer
        );

        let activeIndex = toolbarIds.findIndex(x => toolbarManager.getToolbarByID(x).mtForceVisible) + 1;
        if (activeIndex >= toolbarIds.length) {
            activeIndex = 0;
        }

        for (let i = 0; i < toolbarIds.length; i++) {
            const toolbar = toolbarManager.getToolbarByID(toolbarIds[i]);

            if (activeIndex === i) {
                toolbar.mtForceEnable();
            } else {
                toolbar.mtForceDisable();
            }
        }
    }
}
