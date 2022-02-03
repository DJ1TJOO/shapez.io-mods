import { MapChunk } from "shapez/game/map_chunk";
import { Mod } from "shapez/mods/mod";
import { MetaBlastFurnaceBuilding, setupBlastFurnace } from "./buildings/blast_furnace";
import { enumSandType, SandItem, SAND_ITEM_SINGLETONS } from "./items/sand";
import { enumStoneType, StoneItem, STONE_ITEM_SINGLETONS } from "./items/stone";

class ModImpl extends Mod {
    init() {
        this.checkSettings();

        setupBlastFurnace.apply(this);
        this.modInterface.registerNewBuilding({
            metaClass: MetaBlastFurnaceBuilding,
        });
        this.modInterface.addNewBuildingToToolbar({
            toolbar: "regular",
            location: "primary",
            metaClass: MetaBlastFurnaceBuilding,
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

        // Make the item spawn on the map
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
    }

    checkSettings() {
        // Create default settings if corrupted
        if (!this.settings) {
            this.settings = {};
        }

        this.saveSettings();
    }
}
