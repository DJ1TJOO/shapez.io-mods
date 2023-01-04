import { MODS } from "shapez/mods/modloader";

const defaultConfig = {
    // Connectors
    energy: {
        volume: 2000,
        maxThroughputPerTick: 1000,
    },
    pipe: {
        volume: 2000,
        maxThroughputPerTick: 1000,
    },

    // Generators
    steam_generator: {
        water: 150,
        energy: 2500,
        steam: 100,
    },
    turbine: {
        maxConnections: {
            steam_intake: 3,
            fuel_intake: 5,
            energy_outlet: 2,
        },

        maxBuffers: {
            steam_intake: 2000,
            energy_outlet: 1000000,
        },
        maxArea: 200,
        tier1: { shape: "CuCuCuCu", items: 3, energy: 5000, steam: 100 }, //"CuRuCuRu"
        tier2: { shape: "CgRyCgRy:CyRbCyRb", items: 5, energy: 22500, steam: 300 },
        tier3: { shape: "SyCcSyCc:ScCyScCy:CwRcCwRc", items: 9, energy: 70000, steam: 700 },
        tier4: { shape: "CgSyCgSy:SpCySpCy:--RcCwRc:Cy------", items: 15, energy: 137500, steam: 1100 },
    },
    pump: {
        water: 100,
        energy: 100,
    },
    basic_generator: {
        default: { energy: 50, magma: 0 },
        basic_magma: { energy: 125, magma: 100 },
    },

    // Consumers
    basic_consumer: {
        energy: 200,
    },
};

/**
 * @returns {defaultConfig}
 */
export const config = () => {
    return MODS.mods.find(x => x.metadata.id === "dj1tjoo_advanced_generators")?.["config"] || defaultConfig;
};
