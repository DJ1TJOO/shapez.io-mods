import { Factory } from "shapez/core/factory";
import { GameRoot } from "shapez/game/root";
import { BasicSerializableObject, types } from "shapez/savegame/serialization";

export let gFluidRegistry = new Factory("fluid");

/**
 * Resolves items so we share instances
 * @param {GameRoot} root
 * @param {{$: string, data: any }} data
 */
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

    static resolver(data) {
        return {};
    }

    getFluidType() {
        return "water";
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
    equalsImpl(other) {
        return false;
    }

    getBackgroundColorAsResource() {
        return "";
    }
}
