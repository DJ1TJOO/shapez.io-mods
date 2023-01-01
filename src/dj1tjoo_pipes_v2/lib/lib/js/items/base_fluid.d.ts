/// <reference path="../../../types.d.ts" />
/**
 * Resolves items so we share instances
 * @param {GameRoot} root
 * @param {{$: string, data: any }} data
 */
export function fluidResolverSingleton(root: GameRoot, data: {
    $: string;
    data: any;
}): any;
export let gFluidRegistry: Factory;
export const typeFluidSingleton: import("shapez/savegame/serialization_data_types").TypeClass;
/**
 * Class for fluids in pipes. Not an entity for performance reasons
 */
export class BaseFluid extends BasicSerializableObject {
    static getId(): string;
    static resolver(data: any): {};
    constructor();
    _type: string;
    getFluidType(): string;
    getItemType(): string;
    /**
     * Returns a string id of the item
     * @returns {string}
     */
    getAsCopyableKey(): string;
    /**
     * Returns if the item equals the other itme
     * @param {BaseFluid} other
     * @returns {boolean}
     */
    equals(other: BaseFluid): boolean;
    /**
     * Override for custom comparison
     * @abstract
     * @param {BaseFluid} other
     * @returns {boolean}
     */
    equalsImpl(other: BaseFluid): boolean;
    /**
     * Draws the item to a canvas
     * @param {CanvasRenderingContext2D} context
     * @param {number} size
     */
    drawFullSizeOnCanvas(context: CanvasRenderingContext2D, size: number): void;
    /**
     * Draws the item at the given position
     * @param {number} x
     * @param {number} y
     * @param {import("shapez/core/draw_utils").DrawParameters} parameters
     * @param {number=} diameter
     */
    drawItemCenteredClipped(x: number, y: number, parameters: import("shapez/core/draw_utils").DrawParameters, diameter?: number | undefined): void;
    /**
     * INTERNAL
     * @param {number} x
     * @param {number} y
     * @param {import("shapez/core/draw_utils").DrawParameters} parameters
     * @param {number=} diameter
     */
    drawItemCenteredImpl(x: number, y: number, parameters: import("shapez/core/draw_utils").DrawParameters, diameter?: number | undefined): void;
    /**
     * @returns {String}
     */
    getBackgroundColorAsResource(): string;
}
import { GameRoot } from "shapez/game/root";
import { Factory } from "shapez/core/factory";
import { BasicSerializableObject } from "shapez/savegame/serialization";
