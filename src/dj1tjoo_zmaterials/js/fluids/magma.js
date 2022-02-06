import { Loader } from "shapez/core/loader";
import { MODS } from "shapez/mods/modloader";
import { types } from "shapez/savegame/serialization";

export const enumMagmaTypes = {
    stone_magma: "stone_magma",
    basalt_magma: "basalt_magma",
    cleaned_marble_magma: "cleaned_marble_magma",
};

export const magmaColors = {
    [enumMagmaTypes.stone_magma]: "#e5541e",
    [enumMagmaTypes.basalt_magma]: "#5D3C4E",
    [enumMagmaTypes.cleaned_marble_magma]: "#eb8660",
};
// Call on init
export function registerMagma() {
    // @ts-ignore
    const { BaseFluid, gFluidRegistry } = MODS.mods.find(x => x.metadata.id === "dj1tjoo_pipes");
    class MagmaFluid extends BaseFluid {
        static getId() {
            return "magma_fluid";
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

        /** @returns {"magma"} **/
        getFluidType() {
            return "magma";
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
            return this.type === /** @type {MagmaFluid} */ (other).type;
        }

        static resolver(data) {
            return MAGMA_SINGLETONS[data];
        }

        /**
         * Draws the item to a canvas
         * @param {CanvasRenderingContext2D} context
         * @param {number} size
         */
        drawFullSizeOnCanvas(context, size) {
            if (!this.cachedSprite) {
                this.cachedSprite = Loader.getSprite("sprites/fluids/magma-" + this.type + ".png");
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
                this.cachedSprite = Loader.getSprite("sprites/fluids/magma-" + this.type + ".png");
            }
            this.cachedSprite.drawCachedCentered(parameters, x, y, realDiameter);
        }

        getBackgroundColorAsResource() {
            return magmaColors[this.type];
        }
    }

    gFluidRegistry.register(MagmaFluid);

    const MAGMA_SINGLETONS = {};
    for (const type in enumMagmaTypes) {
        MAGMA_SINGLETONS[type] = new MagmaFluid(type);
    }
    return { MAGMA_SINGLETONS, MagmaFluid };
}
