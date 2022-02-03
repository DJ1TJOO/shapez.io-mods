import { MapChunk } from "shapez/game/map_chunk";
import { Mod } from "shapez/mods/mod";
import { MetaBlastFurnaceBuilding, setupBlastFurnace } from "./buildings/blast_furnace";
import { MetaCoolerBuilding, setupCooler } from "./buildings/cooler";
import { MetaHeaterBuilding, setupHeater } from "./buildings/heater";
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

        // TODO: try make pipes work like belts
        // this.modInterface.replaceMethod(
        //     // @ts-ignore
        //     this.modLoader.mods.find(x => x.metadata.id === "dj1tjoo_pipes").PipeSystem,
        //     "findSurroundingPipeTargets",
        //     function ($super, [initialTile, directions, network, variantMask = null, distance = []]) {
        //         const results = $super(initialTile, directions, network, variantMask, distance);

        //         const initialPipe = network.pipes.find(x =>
        //             x.components.StaticMapEntity.origin.equals(initialTile)
        //         );

        //         if (!initialPipe) {
        //             return results;
        //         }

        //         const pipeComp = initialPipe.components.Pipe;
        //         const connections = [
        //             this.root.logic.computePipeEdgeStatus({
        //                 tile: initialTile,
        //                 pipeVariant: pipeComp.variant,
        //                 edge: enumDirection.top,
        //             }),
        //             this.root.logic.computePipeEdgeStatus({
        //                 tile: initialTile,
        //                 pipeVariant: pipeComp.variant,
        //                 edge: enumDirection.right,
        //             }),
        //             this.root.logic.computePipeEdgeStatus({
        //                 tile: initialTile,
        //                 pipeVariant: pipeComp.variant,
        //                 edge: enumDirection.bottom,
        //             }),
        //             this.root.logic.computePipeEdgeStatus({
        //                 tile: initialTile,
        //                 pipeVariant: pipeComp.variant,
        //                 edge: enumDirection.left,
        //             }),
        //         ];
        //         const connected = connections.filter(x => !!x).length;

        //         const newResults = [];
        //         for (let i = 0; i < results.length; i++) {
        //             const { entity, slot, distance } = results[i];
        //             if (slot) {
        //                 newResults.push({ entity, slot, distance });
        //                 continue;
        //             }

        //             // if (newResults.filter(x => !x.slot).length > 1) continue;
        //             // Get initialTile, check if connections, less than 2 push

        //             console.log(connected + newResults.filter(x => !x.slot).length);
        //             // If one or less connections connect
        //             if (connected + newResults.filter(x => !x.slot).length <= 1) {
        //                 newResults.push({ entity, slot, distance });
        //                 continue;
        //             }

        //             // newResults.push({ entity, slot, distance });
        //         }

        //         return newResults;
        //     }
        // );

        /**
         * @TODO stones
         * marble: from stone with heat and pressure
         * granite: from extreme heat (magma) with different minerals
         * basalt: fast cooling from magma with magnesium and iron
         * oxyn: washed basalt in zuurbad
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
         * Oxyn:
         *   Basalt: High pressure water in indsutrial water sprayer with full windmill
         *
         * Marble:
         *   Stone: High pressure water in indsutrial water sprayer with white shapez
         *
         * Travertine:
         *   Marble: High pressure water in indsutrial water sprayer creates cleaned marble
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
