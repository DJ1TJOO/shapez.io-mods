import { globalConfig } from "shapez/core/config";
import { BaseItem } from "shapez/game/base_item";
import { types } from "shapez/savegame/serialization";
import { config, materialsEnum } from "../config";

export class MaterialItem extends BaseItem {
    static getId() {
        return "material";
    }

    static getSchema() {
        return types.enum(materialsEnum());
    }

    // @ts-ignore
    serialize() {
        return this.type;
    }

    deserialize(data) {
        this.type = data;
    }

    getItemType() {
        return "material";
    }

    /**
     * @returns {string}
     */
    getAsCopyableKey() {
        return this.type;
    }

    /**
     * @param {import("shapez/core/global_registries").BaseItem} other
     */
    equalsImpl(other) {
        //@ts-ignore
        return this.type === /** @type {MaterialsItem} */ (other).type;
    }

    /**
     * @param {string} type
     */
    constructor(type) {
        super();
        this.type = type;
    }

    getBackgroundColorAsResource() {
        return config().materials[this.type];
    }

    /**
     * Draws the item to a canvas
     * @param {CanvasRenderingContext2D} context
     * @param {number} size
     */
    drawFullSizeOnCanvas(context, size) {
        if (!this.cachedSprite) {
            this.cachedSprite = shapez.Loader.getSprite(`sprites/materials/${this.type}.png`);
        }
        this.cachedSprite.drawCentered(context, size / 2, size / 2, size);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} diameter
     * @param {import("shapez/core/draw_utils").DrawParameters} parameters
     */
    // @ts-ignore
    drawItemCenteredImpl(x, y, parameters, diameter = globalConfig.defaultItemDiameter) {
        const realDiameter = diameter * 0.6;
        if (!this.cachedSprite) {
            this.cachedSprite = shapez.Loader.getSprite(`sprites/materials/${this.type}.png`);
        }
        this.cachedSprite.drawCachedCentered(parameters, x, y, realDiameter);
    }
}
