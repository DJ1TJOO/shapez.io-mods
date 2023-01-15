import { MODS } from "shapez/mods/modloader";

export const defaultConfig = {
    materials: {
        stone: "#918E85",
        sand: "#C2B280",
        steel: "#71797E",
    },
    blast_furnace: {
        energy: 100,
    },
    heater: {
        magma: 100,
        energy: 100,
    },
    water_sprayer: {
        water: 100,
        energy: 100,
    },
    pump: {
        water: 100,
        energy: 100,
    },
    pipe: {
        volume: 2000,
        maxThroughputPerTick: -1000, // Inifinit
    },
};

/**
 * @template {keyof typeof defaultConfig.materials} material
 * @returns {Record<material, material>}
 */
export const materialsEnum = () => {
    return /** @type {Record<material, material>} */ (
        Object.keys(config().materials).reduce((enumObject, curr) => {
            enumObject[curr] = curr;
            return enumObject;
        }, {})
    );
};
/**
 * @returns {defaultConfig}
 */
export const config = () => {
    return MODS.mods.find(x => x.metadata.id === "dj1tjoo_materials")?.["config"] || defaultConfig;
};
