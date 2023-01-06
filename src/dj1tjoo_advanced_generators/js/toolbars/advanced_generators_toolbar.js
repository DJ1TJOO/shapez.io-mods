import { HUDBaseToolbar } from "shapez/game/hud/parts/base_toolbar";

export class AdvancedGeneratorsToolbar extends HUDBaseToolbar {
    constructor(root) {
        super(root, {
            primaryBuildings: [],
            secondaryBuildings: [],
            visibilityCondition: () =>
                !this.root.camera.getIsMapOverlayActive() && this.root.currentLayer === "regular",
            htmlElementId: "ingame_HUD_advanced_generators_toolbar",
        });
    }
}
