import { MODS_ADDITIONAL_STORAGE_ITEM_RESOLVER } from "shapez/game/components/storage";
import { MapChunk } from "shapez/game/map_chunk";
import { Mod } from "shapez/mods/mod";
import { MetaBlastFurnaceBuilding, setupBlastFurnace } from "./buildings/blast_furnace";
import { MetaCoolerBuilding, setupCooler } from "./buildings/cooler";
import { MetaHeaterBuilding, setupHeater } from "./buildings/heater";
import { MetaWaterSprayerBuilding, setupWaterSprayer } from "./buildings/water_sprayer";
import { registerMagma } from "./fluids/magma";
import { enumSandType, SandItem, SAND_ITEM_SINGLETONS } from "./items/sand";
import { enumStoneType, StoneItem, STONE_ITEM_SINGLETONS } from "./items/stone";

class ModImpl extends Mod {
    init() {
        this.checkSettings();

        // Register fluids
        const { MAGMA_SINGLETONS } = registerMagma();
        this.MAGMA_SINGLETONS = MAGMA_SINGLETONS;

        // Register items
        this.modInterface.runAfterMethod(
            MapChunk,
            "generatePatches",
            function ({ rng, chunkCenter, distanceToOriginInChunks }) {
                if (rng.next() < 0.1) {
                    const sandType = rng.choice(Array.from(Object.keys(enumSandType)));
                    this.internalGeneratePatch(rng, 3, SAND_ITEM_SINGLETONS[sandType]);
                }
            }
        );

        this.modInterface.registerItem(SandItem, itemData => SAND_ITEM_SINGLETONS[itemData]);
        this.modInterface.registerItem(StoneItem, itemData => STONE_ITEM_SINGLETONS[itemData]);

        // Add to storage
        MODS_ADDITIONAL_STORAGE_ITEM_RESOLVER["stone"] = function (item) {
            // @ts-ignore
            return this.storedItem.stoneType === item.stoneType;
        };
        MODS_ADDITIONAL_STORAGE_ITEM_RESOLVER["sand"] = function (item) {
            // @ts-ignore
            return this.storedItem.sandType === item.sandType;
        };

        // Register buildings
        setupBlastFurnace.apply(this);
        this.modInterface.registerNewBuilding({
            metaClass: MetaBlastFurnaceBuilding,
        });
        this.modInterface.addNewBuildingToToolbar({
            toolbar: "regular",
            location: "primary",
            metaClass: MetaBlastFurnaceBuilding,
        });

        setupHeater.apply(this);
        this.modInterface.registerNewBuilding({
            metaClass: MetaHeaterBuilding,
        });
        this.modInterface.addNewBuildingToToolbar({
            toolbar: "regular",
            location: "primary",
            metaClass: MetaHeaterBuilding,
        });

        setupCooler.apply(this);
        this.modInterface.registerNewBuilding({
            metaClass: MetaCoolerBuilding,
        });
        this.modInterface.addNewBuildingToToolbar({
            toolbar: "regular",
            location: "primary",
            metaClass: MetaCoolerBuilding,
        });

        setupWaterSprayer.apply(this);
        this.modInterface.registerNewBuilding({
            metaClass: MetaWaterSprayerBuilding,
        });
        this.modInterface.addNewBuildingToToolbar({
            toolbar: "regular",
            location: "primary",
            metaClass: MetaWaterSprayerBuilding,
        });

        /**
         * @TODO stones
         * marble: from stone with heat and pressure
         * granite: from extreme heat (magma) with different minerals
         * basalt: fast cooling from magma with magnesium and iron
         * onyx: washed basalt in zuurbad
         * travertine: high pressure water on marble and dry out
         * sand: stone with high pressure water
         *
         * Stone:
         *   Start: rect into stone
         *   Stone: heated up in heater to create stone magma
         *
         * Basalt:
         *   Stone Magma: Fast cooling in cooler with circles supplied creates basalt
         *   Basalt: heated up in heater to create basalt magma
         *
         * Granite:
         *   Basalt Magma: Fast cooling in cooler with different red shapez creates granite
         *
         * Onyx:
         *   Basalt: High pressure water in indsutrial water sprayer with full windmill
         *
         * Marble:
         *   Stone: High pressure water in indsutrial water sprayer with white shapez
         *   Marble: High pressure water in indsutrial water sprayer with cyan shapez creates cleaned marble
         *
         * Travertine:
         *   Cleaned Marble: in cooler with rects
         *
         * Sand:
         *   Stone: High pressure water in indsutrial water sprayer with yellow shapez
         */
    }

    checkSettings() {
        // Create default settings if corrupted
        if (!this.settings) {
            this.settings = {};
        }

        this.saveSettings();
    }
}
