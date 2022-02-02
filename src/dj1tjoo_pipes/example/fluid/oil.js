import { Loader } from "shapez/core/loader";
import { MODS } from "shapez/mods/modloader";
import { types } from "shapez/savegame/serialization";

export const enumOilTypes = {
    oil: "oil",
    red: "red",
};

// Call on init
export function registerOil() {
    // @ts-ignore
    const { BaseFluid, gFluidRegistry } = MODS.mods.find(x => x.metadata.id === "dj1tjoo_pipes");
    class OilFluid extends BaseFluid {
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

        /**
         * Draws the item to a canvas
         * @param {CanvasRenderingContext2D} context
         * @param {number} size
         */
        drawFullSizeOnCanvas(context, size) {
            if (!this.cachedSprite) {
                this.cachedSprite = Loader.getSprite("sprites/fluids/oil-" + this.type + ".png");
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
                this.cachedSprite = Loader.getSprite("sprites/fluids/oil-" + this.type + ".png");
            }
            this.cachedSprite.drawCachedCentered(parameters, x, y, realDiameter);
        }

        getBackgroundColorAsResource() {
            return "#DFD855";
        }
    }

    gFluidRegistry.register(OilFluid);

    const OIL_SINGLETONS = {};
    for (const type in enumOilTypes) {
        OIL_SINGLETONS[type] = new OilFluid(type);
    }
    return { OIL_SINGLETONS, OilFluid };
}
