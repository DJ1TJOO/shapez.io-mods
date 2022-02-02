import { Vector, enumDirectionToVector, enumDirection, enumInvertedDirections } from "shapez/core/vector";
import { GameLogic } from "shapez/game/logic";
import { Mod } from "shapez/mods/mod";
import { BaseFluid, gFluidRegistry, typeFluidSingleton } from "./base_fluid";
import { MetaPipeBuilding } from "./buildings/pipe";
import { MetaPumpBuilding } from "./buildings/pump";
import { DefaultPipeRendererComponent } from "./components/default_pipe_renderer";
import { enumPipeType, PipeComponent } from "./components/pipe";
import { enumPinSlotType, PipedPinsComponent } from "./components/pipe_pins";
import { PumpComponent } from "./components/pump";
import { WATER_SINGLETON } from "./fluids/water";
import { getMod } from "./getMod";
import { DefaultPipeRendererSystem } from "./systems/default_pipe_renderer";
import { arrayPipeRotationVariantToType, PipeSystem } from "./systems/pipe";
import { PipedPinsSystem } from "./systems/pipe_pins";
import { PumpSystem } from "./systems/pump";

class ModImpl extends Mod {
    init() {
        this.checkSettings();

        this.modInterface.registerNewBuilding({
            metaClass: MetaPipeBuilding,
        });

        this.modInterface.registerNewBuilding({
            metaClass: MetaPumpBuilding,
        });

        this.modLoader.signals.hudElementInitialized.add(element => {
            if (element.constructor.name === "HUDBuildingsToolbar") {
                if (this.settings.defaultPump) element.primaryBuildings.push(MetaPumpBuilding);
                if (this.settings.defaultPipes) element.primaryBuildings.push(MetaPipeBuilding);
            }
        });

        // Make the item spawn on the map
        this.modInterface.runAfterMethod(shapez.MapChunk, "generatePatches", function ({ rng }) {
            // Generate a simple patch
            if (rng.next() < 0.05 && getMod().settings.defaultWater) {
                this.internalGeneratePatch(rng, 3, WATER_SINGLETON);
            }
        });

        this.modInterface.registerComponent(PipeComponent);
        this.modInterface.registerComponent(PipedPinsComponent);
        this.modInterface.registerComponent(DefaultPipeRendererComponent);
        this.modInterface.registerComponent(PumpComponent);

        this.modInterface.registerGameSystem({
            id: "pipe",
            before: "pipedPins",
            systemClass: PipeSystem,
            drawHooks: ["staticAfter"],
        });

        this.modInterface.registerGameSystem({
            id: "pipedPins",
            before: "end",
            systemClass: PipedPinsSystem,
        });
        this.modInterface.registerGameSystem({
            id: "defaultPipeRenderer",
            before: "staticMapEntities",
            systemClass: DefaultPipeRendererSystem,
            drawHooks: ["staticBefore"],
        });
        this.modInterface.registerGameSystem({
            id: "pump",
            before: "end",
            systemClass: PumpSystem,
        });

        this.modInterface.extendClass(GameLogic, () => ({
            /**
             *
             * Computes the flag for a given tile
             * @param {object} param0
             * @param {string} param0.pipeVariant
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

        if (!this.settings.defaultPipes) {
            this.settings.defaultPipes = true;
        }
        if (!this.settings.defaultPump) {
            this.settings.defaultPump = true;
        }
        if (!this.settings.defaultWater) {
            this.settings.defaultWater = true;
        }

        this.saveSettings();
    }

    // Exports
    // components
    get PipedPinsComponent() {
        return PipedPinsComponent;
    }
    get PipeComponent() {
        return PipeComponent;
    }

    get arrayPipeRotationVariantToType() {
        return arrayPipeRotationVariantToType;
    }
    get enumPinSlotType() {
        return enumPinSlotType;
    }

    // fluids
    get BaseFluid() {
        return BaseFluid;
    }

    get gFluidRegistry() {
        return gFluidRegistry;
    }

    get typeFluidSingleton() {
        return typeFluidSingleton;
    }

    /**
     * @param {typeof BaseFluid} fluid
     */
    registerFluid(fluid) {
        gFluidRegistry.register(fluid);
    }

    /**
     * Should compute the optimal rotation variant on the given tile
     * @param {object} param0
     * @param {import("shapez/savegame/savegame_serializer").GameRoot} param0.root
     * @param {Vector} param0.tile
     * @param {number} param0.rotation
     * @param {string} param0.pipeVariant
     * @return {{ rotation: number, rotationVariant: number, connectedEntities?: Array<import("shapez/savegame/savegame_serializer").Entity> }}
     */
    computeOptimalDirectionAndRotationVariantAtTile({ root, tile, pipeVariant, rotation }) {
        const connections = {
            // @ts-ignore
            top: root.logic.computePipeEdgeStatus({ tile, pipeVariant, edge: enumDirection.top }),
            // @ts-ignore
            right: root.logic.computePipeEdgeStatus({ tile, pipeVariant, edge: enumDirection.right }),
            // @ts-ignore
            bottom: root.logic.computePipeEdgeStatus({ tile, pipeVariant, edge: enumDirection.bottom }),
            // @ts-ignore
            left: root.logic.computePipeEdgeStatus({ tile, pipeVariant, edge: enumDirection.left }),
        };

        let flag = 0;
        flag |= connections.top ? 0x1000 : 0;
        flag |= connections.right ? 0x100 : 0;
        flag |= connections.bottom ? 0x10 : 0;
        flag |= connections.left ? 0x1 : 0;

        let targetType = enumPipeType.forward;

        // First, reset rotation
        rotation = 0;

        switch (flag) {
            case 0x0000:
                // Nothing
                break;

            case 0x0001:
                // Left
                rotation += 90;
                break;

            case 0x0010:
                // Bottom
                // END
                break;

            case 0x0011:
                // Bottom | Left
                targetType = enumPipeType.turn;
                rotation += 90;
                break;

            case 0x0100:
                // Right
                rotation += 90;
                break;

            case 0x0101:
                // Right | Left
                rotation += 90;
                break;

            case 0x0110:
                // Right | Bottom
                targetType = enumPipeType.turn;
                break;

            case 0x0111:
                // Right | Bottom | Left
                targetType = enumPipeType.split;
                break;

            case 0x1000:
                // Top
                break;

            case 0x1001:
                // Top | Left
                targetType = enumPipeType.turn;
                rotation += 180;
                break;

            case 0x1010:
                // Top | Bottom
                break;

            case 0x1011:
                // Top | Bottom | Left
                targetType = enumPipeType.split;
                rotation += 90;
                break;

            case 0x1100:
                // Top | Right
                targetType = enumPipeType.turn;
                rotation -= 90;
                break;

            case 0x1101:
                // Top | Right | Left
                targetType = enumPipeType.split;
                rotation += 180;
                break;

            case 0x1110:
                // Top | Right | Bottom
                targetType = enumPipeType.split;
                rotation -= 90;
                break;

            case 0x1111:
                // Top | Right | Bottom | Left
                targetType = enumPipeType.cross;
                break;
        }

        return {
            // Clamp rotation
            rotation: (rotation + 360 * 10) % 360,
            rotationVariant: arrayPipeRotationVariantToType.indexOf(targetType),
        };
    }
}
