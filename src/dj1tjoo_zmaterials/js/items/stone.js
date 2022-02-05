import { globalConfig } from "shapez/core/config";
import { BaseItem } from "shapez/game/base_item";
import { types } from "shapez/savegame/serialization";

/**
 * Define which stone types there are
 * @enum { String }
 */
/** @TODO better sprites */
export const enumStoneType = {
    stone: "stone",
    basalt: "basalt",
    granite: "granite",
    onyx: "onyx",
    marble: "marble",
    clean_marble: "clean_marble",
};

// Define which color they should have on the map
export const stoneColors = {
    [enumStoneType.stone]: "#918E85",
    [enumStoneType.basalt]: "#201C2C",
    [enumStoneType.granite]: "#B87366",
    [enumStoneType.onyx]: "#242834",
    [enumStoneType.marble]: "#F3FFFF",
    [enumStoneType.clean_marble]: "#FAFBFB",
};

// The stone item class (also see ColorItem and ShapeItem)
export class StoneItem extends BaseItem {
    static getId() {
        return "stone";
    }

    static getSchema() {
        return types.enum(enumStoneType);
    }

    // @ts-ignore
    serialize() {
        return this.stoneType;
    }

    deserialize(data) {
        this.stoneType = data;
    }

    getItemType() {
        return "stone";
    }

    /**
     * @returns {string}
     */
    getAsCopyableKey() {
        return this.stoneType;
    }

    /**
     * @param {import("shapez/core/global_registries").BaseItem} other
     */
    equalsImpl(other) {
        //@ts-ignore
        return this.stoneType === /** @type {StoneItem} */ (other).stoneType;
    }

    /**
     * @param {enumStoneType} stoneType
     */
    constructor(stoneType) {
        super();
        this.stoneType = stoneType;
    }

    getBackgroundColorAsResource() {
        return stoneColors[this.stoneType];
    }

    /**
     * Draws the item to a canvas
     * @param {CanvasRenderingContext2D} context
     * @param {number} size
     */
    drawFullSizeOnCanvas(context, size) {
        if (!this.cachedSprite) {
            this.cachedSprite = shapez.Loader.getSprite(`sprites/stones/${this.stoneType}.png`);
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
    drawItemCenteredClipped(x, y, parameters, diameter = globalConfig.defaultItemDiameter) {
        const realDiameter = diameter * 0.6;
        if (!this.cachedSprite) {
            this.cachedSprite = shapez.Loader.getSprite(`sprites/stones/${this.stoneType}.png`);
        }
        this.cachedSprite.drawCachedCentered(parameters, x, y, realDiameter);
    }
}

/**
 * Singleton instances.
 *
 * NOTICE: The game tries to instantiate as few instances as possible.
 * Which means that if you have two types of stones in this case, there should
 * ONLY be 2 instances of StoneItem at *any* time.
 *
 * This works by having a map from stone type to the StoneItem singleton.
 * Additionally, all items are and should be immutable.
 * @type {Object<enumStoneType, StoneItem>}
 */
export const STONE_ITEM_SINGLETONS = {};

for (const stoneType in enumStoneType) {
    STONE_ITEM_SINGLETONS[stoneType] = new StoneItem(stoneType);
}
