import { Pipes } from "@dj1tjoo/shapez-pipes";
import { Loader } from "shapez/core/loader";

export const StoneMagma = Pipes.registerFluid(
    () =>
        class StoneMagmaFluid extends Pipes.BaseFluid {
            static getId() {
                return "stone_magma_fluid";
            }

            equalsImpl() {
                return true;
            }

            /**
             * Draws the item to a canvas
             * @param {CanvasRenderingContext2D} context
             * @param {number} size
             */
            drawFullSizeOnCanvas(context, size) {
                if (!this.cachedSprite) {
                    this.cachedSprite = Loader.getSprite("sprites/fluids/magma-stone_magma.png");
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
                    this.cachedSprite = Loader.getSprite("sprites/fluids/magma-stone_magma.png");
                }
                this.cachedSprite.drawCachedCentered(parameters, x, y, realDiameter);
            }

            getBackgroundColorAsResource() {
                return "#e5541e";
            }
        }
);

export const BasaltMagma = Pipes.registerFluid(
    () =>
        class BasaltMagmaFluid extends Pipes.BaseFluid {
            static getId() {
                return "basalt_magma_fluid";
            }

            equalsImpl() {
                return true;
            }

            /**
             * Draws the item to a canvas
             * @param {CanvasRenderingContext2D} context
             * @param {number} size
             */
            drawFullSizeOnCanvas(context, size) {
                if (!this.cachedSprite) {
                    this.cachedSprite = Loader.getSprite("sprites/fluids/magma-basalt_magma.png");
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
                    this.cachedSprite = Loader.getSprite("sprites/fluids/magma-basalt_magma.png");
                }
                this.cachedSprite.drawCachedCentered(parameters, x, y, realDiameter);
            }

            getBackgroundColorAsResource() {
                return "#5D3C4E";
            }
        }
);
