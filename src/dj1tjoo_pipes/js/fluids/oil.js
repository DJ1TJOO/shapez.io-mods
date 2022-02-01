import { types } from "shapez/savegame/serialization";
import { BaseFluid, gFluidRegistry } from "../base_fluid";

export const enumOilTypes = {
    oil: "oil",
    red: "red",
};

export class OilFluid extends BaseFluid {
    static getId() {
        return "oil_fluid";
    }

    static getSchema() {
        return types.string;
    }

    // @ts-ignore
    serialize() {
        return this.type;
    }

    deserialize(data) {
        this.type = data;
    }

    /** @returns {"oil"} **/
    getFluidType() {
        return "oil";
    }

    /**
     * @returns {string}
     */
    getAsCopyableKey() {
        return this.getFluidType();
    }

    /**
     * @param {string} type
     */
    constructor(type) {
        super();
        this.type = type;
    }

    equalsImpl(other) {
        return this.type === /** @type {OilFluid} */ (other).type;
    }

    static resolver(data) {
        return OIL_SINGLETONS[data];
    }

    getBackgroundColorAsResource() {
        return "#DFD855";
    }
}

gFluidRegistry.register(OilFluid);
export const OIL_SINGLETONS = {};
for (const type in enumOilTypes) {
    OIL_SINGLETONS[type] = new OilFluid(type);
}
