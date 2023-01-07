import { HUDBaseToolbar } from "shapez/game/hud/parts/base_toolbar";

export class AdvancedGeneratorsToolbarWires extends HUDBaseToolbar {
    constructor(root) {
        super(root, {
            primaryBuildings: [],
            secondaryBuildings: [],
            visibilityCondition: () =>
                !this.root.camera.getIsMapOverlayActive() && this.root.currentLayer === "wires",
            htmlElementId: "ingame_HUD_advanced_generators_toolbar",
            layer: "wires",
        });
    }
}
