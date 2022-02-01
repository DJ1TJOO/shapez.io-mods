import { Vector, enumDirectionToVector, enumDirection, enumInvertedDirections } from "shapez/core/vector";
import { GameLogic } from "shapez/game/logic";
import { Mod } from "shapez/mods/mod";
import { MetaExtractorBuilding } from "./buildings/extractor";
import { MetaPipeBuilding } from "./buildings/pipe";
import { MetaPumpBuilding } from "./buildings/pump";
import { ExtractorComponent } from "./components/extractor";
import { enumPipeVariant, PipeComponent } from "./components/pipe";
import { PipedPinsComponent } from "./components/pipe_pins";
import { PumpComponent } from "./components/pump";
import { ExtractorSystem } from "./systems/extractor";
import { PipeSystem } from "./systems/pipe";
import { PipedPinsSystem } from "./systems/pipe_pins";
import { PumpSystem } from "./systems/pump";

class ModImpl extends Mod {
    init() {
        this.checkSettings();

        this.modInterface.registerNewBuilding({
            metaClass: MetaPipeBuilding,
        });
        this.modInterface.addNewBuildingToToolbar({
            toolbar: "regular",
            location: "primary",
            metaClass: MetaPipeBuilding,
        });
        this.modInterface.registerNewBuilding({
            metaClass: MetaPumpBuilding,
        });
        this.modInterface.addNewBuildingToToolbar({
            toolbar: "regular",
            location: "primary",
            metaClass: MetaPumpBuilding,
        });
        this.modInterface.registerNewBuilding({
            metaClass: MetaExtractorBuilding,
        });
        this.modInterface.addNewBuildingToToolbar({
            toolbar: "regular",
            location: "primary",
            metaClass: MetaExtractorBuilding,
        });

        // this.modInterface.registerComponent(FluidAcceptorComponent);
        // this.modInterface.registerComponent(FluidEjectorComponent);
        // this.modInterface.registerComponent(PumpComponent);
        this.modInterface.registerComponent(PipeComponent);
        this.modInterface.registerComponent(PipedPinsComponent);
        this.modInterface.registerComponent(PumpComponent);
        this.modInterface.registerComponent(ExtractorComponent);

        // this.modInterface.registerGameSystem({
        //     id: "fluidAcceptor",
        //     systemClass: FluidAcceptorSystem,
        //     before: "pipe",
        //     drawHooks: ["foregroundDynamicAfter"],
        // });

        this.modInterface.registerGameSystem({
            id: "pipe",
            before: "pipedPins",
            systemClass: PipeSystem,
            drawHooks: ["staticAfter"],
        });

        this.modInterface.registerGameSystem({
            id: "pipedPins",
            before: "itemProcessorOverlays",
            systemClass: PipedPinsSystem,
            drawHooks: ["staticAfter"],
        });

        this.modInterface.registerGameSystem({
            id: "pump",
            before: "end",
            systemClass: PumpSystem,
        });
        this.modInterface.registerGameSystem({
            id: "extractor",
            before: "end",
            systemClass: ExtractorSystem,
        });
        // this.modInterface.registerGameSystem({
        //     id: "pump",
        //     systemClass: PumpSystem,
        //     before: "fluidEjector",
        //     drawHooks: ["staticAfter"],
        // });

        // this.modInterface.registerGameSystem({
        //     id: "fluidEjector",
        //     systemClass: FluidEjectorSystem,
        //     before: "constantProducer",
        //     drawHooks: ["foregroundDynamicAfter"],
        // });

        this.modInterface.extendClass(GameLogic, () => ({
            /**
             *
             * Computes the flag for a given tile
             * @param {object} param0
             * @param {enumPipeVariant} param0.pipeVariant
             * @param {Vector} param0.tile The tile to check at
             * @param {enumDirection} param0.edge The edge to check for
             * @this {GameLogic}
             */
            computePipeEdgeStatus({ pipeVariant, tile, edge }) {
                const offset = enumDirectionToVector[edge];
                const targetTile = tile.add(offset);

                // Search for relevant pins
                const pinEntities = this.root.map.getLayersContentsMultipleXY(targetTile.x, targetTile.y);

                // Go over all entities which could have a pin
                for (let i = 0; i < pinEntities.length; ++i) {
                    const pinEntity = pinEntities[i];
                    // @ts-ignore
                    const pinComp = /** @type {PipedPinsComponent} */ (pinEntity.components.PipedPins);
                    const staticComp = pinEntity.components.StaticMapEntity;

                    // Skip those who don't have pins
                    if (!pinComp) {
                        continue;
                    }

                    // Go over all pins
                    const pins = pinComp.slots;
                    for (let k = 0; k < pinComp.slots.length; ++k) {
                        const pinSlot = pins[k];
                        const pinLocation = staticComp.localTileToWorld(pinSlot.pos);
                        const pinDirection = staticComp.localDirectionToWorld(pinSlot.direction);

                        // Check if the pin has a network
                        if (!pinSlot.linkedNetwork) {
                            continue;
                        }

                        // Check if the pin has the right location
                        if (!pinLocation.equals(targetTile)) {
                            continue;
                        }

                        // Check if the pin has the right direction
                        if (pinDirection !== enumInvertedDirections[edge]) {
                            continue;
                        }

                        // Found a pin!
                        return true;
                    }
                }

                // Now check if there's a connectable entity on the pipes layer
                const targetEntity = this.root.map.getTileContent(targetTile, "regular");
                if (!targetEntity) {
                    return false;
                }

                const targetStaticComp = targetEntity.components.StaticMapEntity;

                // Check if its a pipe
                // @ts-ignore
                const pipesComp = targetEntity.components.Pipe;
                if (!pipesComp) {
                    return false;
                }

                // It's connected if its the same variant
                return pipesComp.variant === pipeVariant;
            },
        }));
    }

    checkSettings() {
        // Create default settings if corrupted
        if (!this.settings) {
            this.settings = {};
        }

        this.saveSettings();
    }
}
