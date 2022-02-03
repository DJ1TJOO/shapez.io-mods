import { globalConfig } from "shapez/core/config";
import { BaseItem } from "shapez/game/base_item";

/**
 * Define which sand types there are
 * @enum { String }
 */
export const enumSandType = {
    sand: "sand",
    red: "red",
};

// Define which color they should have on the map
export const sandColors = {
    [enumSandType.sand]: "#C2B280",
    [enumSandType.red]: "#A33B21",
};

// The sand item class (also see ColorItem and ShapeItem)
export class SandItem extends BaseItem {
    static getId() {
        return "sand";
    }

    static getSchema() {
        return shapez.types.enum(enumSandType);
    }

    // @ts-ignore
    serialize() {
        return this.sandType;
    }

    deserialize(data) {
        this.sandType = data;
    }

    getItemType() {
        return "sand";
    }

    /**
     * @returns {string}
     */
    getAsCopyableKey() {
        return this.sandType;
    }

    /**
     * @param {import("shapez/core/global_registries").BaseItem} other
     */
    equalsImpl(other) {
        //@ts-ignore
        return this.sandType === /** @type {SandItem} */ (other).sandType;
    }

    /**
     * @param {enumSandType} sandType
     */
    constructor(sandType) {
        super();
        this.sandType = sandType;
    }

    getBackgroundColorAsResource() {
        return sandColors[this.sandType];
    }

    /**
     * Draws the item to a canvas
     * @param {CanvasRenderingContext2D} context
     * @param {number} size
     */
    drawFullSizeOnCanvas(context, size) {
        if (!this.cachedSprite) {
            this.cachedSprite = shapez.Loader.getSprite(`sprites/sands/${this.sandType}.png`);
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
            this.cachedSprite = shapez.Loader.getSprite(`sprites/sands/${this.sandType}.png`);
        }
        this.cachedSprite.drawCachedCentered(parameters, x, y, realDiameter);
    }
}

/**
 * Singleton instances.
 *
 * NOTICE: The game tries to instantiate as few instances as possible.
 * Which means that if you have two types of sands in this case, there should
 * ONLY be 2 instances of SandItem at *any* time.
 *
 * This works by having a map from sand type to the SandItem singleton.
 * Additionally, all items are and should be immutable.
 * @type {Object<enumSandType, SandItem>}
 */
export const SAND_ITEM_SINGLETONS = {};

for (const sandType in enumSandType) {
    SAND_ITEM_SINGLETONS[sandType] = new SandItem(sandType);
}
