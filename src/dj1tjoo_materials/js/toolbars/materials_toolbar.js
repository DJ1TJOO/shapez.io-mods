import { HUDBaseToolbar } from "shapez/game/hud/parts/base_toolbar";

export class MaterialsToolbar extends HUDBaseToolbar {
    constructor(root) {
        super(root, {
            primaryBuildings: [],
            secondaryBuildings: [],
            visibilityCondition: () =>
                !this.root.camera.getIsMapOverlayActive() && this.root.currentLayer === "regular",
            htmlElementId: "ingame_HUD_materials_toolbar",
        });
    }
}
