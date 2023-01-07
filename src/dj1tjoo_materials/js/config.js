import { MODS } from "shapez/mods/modloader";

export const defaultConfig = {
    materials: {
        stone: "#918E85",
        basalt: "#201C2C",
        granite: "#B87366",
        onyx: "#242834",
        marble: "#F3FFFF",
        clean_marble: "#FAFBFB",
        travertine: "#CDCABB",
    },
    blast_furnace: {
        energy: 100,
    },
    heater: {
        magma: 100,
        energy: 100,
    },
};

/**
 * @returns {Record<keyof typeof defaultConfig.materials, keyof typeof defaultConfig.materials>}
 */
export const materialsEnum = () => {
    return /** @type {Record<keyof typeof defaultConfig.materials, keyof typeof defaultConfig.materials>} */ (
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
