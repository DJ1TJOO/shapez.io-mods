import { Vector, enumDirection } from "shapez/core/vector";
import { Component } from "shapez/game/component";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { types } from "shapez/savegame/serialization";

export const curvedPipeLength = /* Math.PI / 4 */ 0.78;

/** @enum {string} */
export const enumPipeVariant = {
    pipe: "pipe",
    industrial: "industrial",
};

export const enumMaxValueByVariant = {
    [defaultBuildingVariant]: 80,
    [enumPipeVariant.industrial]: 320,
};

export const FAKE_PIPE_ACCEPTOR_SLOT = {
    pos: new Vector(0, 0),
    directions: [enumDirection.bottom],
};

export const FAKE_PIPE_EJECTOR_SLOT_BY_DIRECTION = {
    [enumDirection.top]: {
        pos: new Vector(0, 0),
        direction: enumDirection.top,
    },

    [enumDirection.right]: {
        pos: new Vector(0, 0),
        direction: enumDirection.right,
    },

    [enumDirection.left]: {
        pos: new Vector(0, 0),
        direction: enumDirection.left,
    },
};

export class PipeComponent extends Component {
    static getId() {
        return "Pipe";
    }

    static getSchema() {
        return {
            currentAmount: types.ufloat,
        };
    }

    /**
     * @param {object} param0
     * @param {enumPipeVariant=} param0.variant
     */
    constructor({ variant = defaultBuildingVariant }) {
        super();
        // this.type = type;
        this.direction = enumDirection.top;

        /**
         * The variant of the wire, different variants do not connect
         * @type {enumPipeVariant}
         */
        this.variant = variant;

        /**
         * @type {import("shapez/core/global_registries").BaseItem}
         */
        this.currentValue = null;

        this.currentAmount = 0;
        this.currentPressure = 0;
        this.maxPressure = 100;

        /**
         * The variant of the wire, different variants do not connect
         * @type {Array<import("shapez/savegame/savegame_typedefs").Entity>}
         */
        this.connections = [];
    }

    /**
     * Returns the effective length of this pipe in tile space
     * @returns {number}
     */
    getEffectiveLengthTiles() {
        return this.direction === enumDirection.top ? 1.0 : curvedPipeLength;
    }

    /**
     * Returns fake acceptor slot used for matching
     */
    getFakeAcceptorSlot() {
        return FAKE_PIPE_ACCEPTOR_SLOT;
    }

    /**
     * Returns fake acceptor slot used for matching
     */
    getFakeEjectorSlot() {
        return FAKE_PIPE_EJECTOR_SLOT_BY_DIRECTION[this.direction];
    }

    getMaxValue() {
        return enumMaxValueByVariant[this.variant] * (this.currentPressure / this.maxPressure);
    }

    /**
     * Converts from pipe space (0 = start of pipe ... 1 = end of pipe) to the local
     * pipe coordinates (-0.5|-0.5 to 0.5|0.5)
     * @param {number} progress
     * @returns {Vector}
     */
    transformPipeToLocalSpace(progress) {
        assert(progress >= 0.0, "Invalid progress ( < 0): " + progress);
        switch (this.direction) {
            case enumDirection.top:
                assert(progress <= 1.02, "Invalid progress: " + progress);
                return new Vector(0, 0.5 - progress);

            case enumDirection.right: {
                assert(progress <= curvedPipeLength + 0.02, "Invalid progress 2: " + progress);
                const arcProgress = (progress / curvedPipeLength) * 0.5 * Math.PI;
                return new Vector(0.5 - 0.5 * Math.cos(arcProgress), 0.5 - 0.5 * Math.sin(arcProgress));
            }
            case enumDirection.left: {
                assert(progress <= curvedPipeLength + 0.02, "Invalid progress 3: " + progress);
                const arcProgress = (progress / curvedPipeLength) * 0.5 * Math.PI;
                return new Vector(-0.5 + 0.5 * Math.cos(arcProgress), 0.5 - 0.5 * Math.sin(arcProgress));
            }
            default:
                assertAlways(false, "Invalid pipe direction: " + this.direction);
                return new Vector(0, 0);
        }
    }
}
