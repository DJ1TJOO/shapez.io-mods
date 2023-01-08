import { MODS } from "shapez/mods/modloader";

const defaultConfig = {
    rotater: {
        default: 50,
        ccw: 50,
        rotate180: 50,
    },
    cutter: {
        default: 100,
        quad: 100,
    },
    stacker: {
        default: 100,
    },
    mixer: {
        default: 50,
    },
    painter: {
        default: 100,
        mirrored: 100,
        double: 100,
        quad: 100,
    },
};

/**
 * @returns {defaultConfig}
 */
export const config = () => {
    return MODS.mods.find(x => x.metadata.id === "dj1tjoo_energized")?.["config"] || defaultConfig;
};
