import { Pipes } from "@dj1tjoo/shapez-pipes";
import { globalConfig } from "shapez/core/config";
import { Loader } from "shapez/core/loader";

export const Water = Pipes.registerFluid(
    () =>
        class WaterFluid extends Pipes.BaseFluid {
            static getId() {
                return "water_fluid";
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
                    this.cachedSprite = Loader.getSprite("sprites/fluids/water.png");
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
                    this.cachedSprite = Loader.getSprite("sprites/fluids/water.png");
                }
                this.cachedSprite.drawCachedCentered(parameters, x, y, realDiameter);
            }

            getBackgroundColorAsResource() {
                return "#2389DA";
            }
        }
);
