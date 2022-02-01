import { globalConfig } from "shapez/core/config";
import { Factory } from "shapez/core/factory";
import { GameRoot } from "shapez/game/root";
import { BasicSerializableObject, types } from "shapez/savegame/serialization";

export let gFluidRegistry = new Factory("fluid");

/**
 * Resolves items so we share instances
 * @param {GameRoot} root
 * @param {{$: string, data: any }} data
 */
// @ts-ignore
export function fluidResolverSingleton(root, data) {
    const itemType = data.$;
    const itemData = data.data;

    // @ts-ignore
    return gFluidRegistry.findById(itemType).resolver(itemData);
}

export const typeFluidSingleton = types.obj(gFluidRegistry, fluidResolverSingleton);

/**
 * Class for fluids in pipes. Not an entity for performance reasons
 */
export class BaseFluid extends BasicSerializableObject {
    constructor() {
        super();
        this._type = this.getFluidType();
    }

    static getId() {
        return "base_fluid";
    }

    /** @returns {object} */
    static getSchema() {
        return {};
    }

    // @ts-ignore
    static resolver(data) {
        return {};
    }

    getFluidType() {
        return "water";
    }

    getItemType() {
        return "fluid";
    }

    /**
     * Returns a string id of the item
     * @returns {string}
     */
    getAsCopyableKey() {
        return this.getFluidType();
    }

    /**
     * Returns if the item equals the other itme
     * @param {BaseFluid} other
     * @returns {boolean}
     */
    equals(other) {
        if (this.getFluidType() !== other.getFluidType()) {
            return false;
        }
        return this.equalsImpl(other);
    }

    /**
     * Override for custom comparison
     * @abstract
     * @param {BaseFluid} other
     * @returns {boolean}
     */
    // @ts-ignore
    equalsImpl(other) {
        return false;
    }

    /**
     * Draws the item to a canvas
     * @param {CanvasRenderingContext2D} context
     * @param {number} size
     */
    // @ts-ignore
    drawFullSizeOnCanvas(context, size) {
        throw "Abstract";
    }

    /**
     * Draws the item at the given position
     * @param {number} x
     * @param {number} y
     * @param {import("shapez/core/draw_utils").DrawParameters} parameters
     * @param {number=} diameter
     */
    // @ts-ignore
    drawItemCenteredClipped(x, y, parameters, diameter = globalConfig.defaultItemDiameter) {
        if (parameters.visibleRect.containsCircle(x, y, diameter / 2)) {
            this.drawItemCenteredImpl(x, y, parameters, diameter);
        }
    }

    /**
     * INTERNAL
     * @param {number} x
     * @param {number} y
     * @param {import("shapez/core/draw_utils").DrawParameters} parameters
     * @param {number=} diameter
     */
    // @ts-ignore
    drawItemCenteredImpl(x, y, parameters, diameter = globalConfig.defaultItemDiameter) {
        throw "Abstract";
    }

    getBackgroundColorAsResource() {
        throw "Abstract";
    }
}
