import { types } from "shapez/savegame/serialization";
import { BaseFluid, gFluidRegistry } from "../base_fluid";

export class WaterFluid extends BaseFluid {
    static getId() {
        return "water_fluid";
    }

    /** @returns {"water"} **/
    getFluidType() {
        return "water";
    }

    /**
     * @returns {string}
     */
    getAsCopyableKey() {
        return this.getFluidType();
    }

    constructor() {
        super();
    }

    equalsImpl() {
        return true;
    }

    static resolver() {
        return WATER_SINGLETON;
    }

    getBackgroundColorAsResource() {
        return "#2389DA";
    }
}

gFluidRegistry.register(WaterFluid);
export const WATER_SINGLETON = new WaterFluid();
