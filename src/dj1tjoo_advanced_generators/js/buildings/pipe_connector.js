import { Pipes } from "@dj1tjoo/shapez-pipes";
import { Loader } from "shapez/core/loader";
import { Rectangle } from "shapez/core/rectangle";
import { arrayAllDirections, enumDirection, enumInvertedDirections, Vector } from "shapez/core/vector";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { T } from "shapez/translations";
import { PipeConnectorRendererComponent } from "../components/pipe_connector_renderer";
import { config } from "../config";
import {
    arrayConnectorRotationVariantToType,
    enumConnectorType,
    connectorOverlayMatrices,
} from "../connectorTypes";
import { formatL, formatLPerTick } from "../ui/formatter";

export class MetaPipeConnectorBuilding extends ModMetaBuilding {
    constructor() {
        super("pipe_connector");
    }

    getSilhouetteColor() {
        return "#04FC84";
    }

    getSprite() {
        return null;
    }

    getIsReplaceable() {
        return true;
    }

    getStayInPlacementMode() {
        return true;
    }

    /**
     *
     * @param {number} rotationVariant
     * @param {string} variant
     * @returns {import("shapez/core/draw_utils").AtlasSprite}
     */
    getPreviewSprite(rotationVariant, variant) {
        switch (arrayConnectorRotationVariantToType[rotationVariant]) {
            case enumConnectorType.forward: {
                return Loader.getSprite("sprites/connectors/pipe/" + "pipe" + "_forward.png");
            }
            case enumConnectorType.turn: {
                return Loader.getSprite("sprites/connectors/pipe/" + "pipe" + "_turn.png");
            }
            case enumConnectorType.split: {
                return Loader.getSprite("sprites/connectors/pipe/" + "pipe" + "_split.png");
            }
            case enumConnectorType.cross: {
                return Loader.getSprite("sprites/connectors/pipe/" + "pipe" + "_cross.png");
            }
            case enumConnectorType.stub: {
                return Loader.getSprite("sprites/connectors/pipe/" + "pipe" + "_stub.png");
            }
            default: {
                assertAlways(false, "Invalid connector rotation variant");
            }
        }
    }

    getBlueprintSprite(rotationVariant, variant) {
        return this.getPreviewSprite(rotationVariant, variant);
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Basic Pipe",
                description: "Connects buildings that produce and consume fluids together",
                rotationVariant: 0,
            },
            {
                variant: defaultBuildingVariant,
                name: "Basic Pipe",
                description: "Connects buildings that produce and consume fluids together",
                rotationVariant: 1,
            },
            {
                variant: defaultBuildingVariant,
                name: "Basic Pipe",
                description: "Connects buildings that produce and consume fluids together",
                rotationVariant: 2,
            },
            {
                variant: defaultBuildingVariant,
                name: "Basic Pipe",
                description: "Connects buildings that produce and consume fluids together",
                rotationVariant: 3,
            },
            {
                variant: defaultBuildingVariant,
                name: "Basic Pipe",
                description: "Connects buildings that produce and consume fluids together",
                rotationVariant: 4,
            },
        ];
    }

    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant, entity) {
        return connectorOverlayMatrices[arrayConnectorRotationVariantToType[rotationVariant]][rotation];
    }

    getAdditionalStatistics() {
        const localConfig = config().pipe;

        return /** @type {[string, string][]}*/ ([
            [T.advanced_generators.throughput, formatLPerTick(localConfig.maxThroughputPerTick)],
            [T.advanced_generators.stores, formatL(localConfig.volume)],
        ]);
    }

    /**
     * Creates the entity at the given location
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     */
    setupEntityComponents(entity) {
        const localConfig = config().pipe;

        entity.addComponent(
            new Pipes.PipeConnectorComponent({
                maxPipeVolume: localConfig.volume,
                maxThroughputPerTick: localConfig.maxThroughputPerTick,
            })
        );

        entity.addComponent(new PipeConnectorRendererComponent());
    }

    /**
     * Should compute the optimal rotation variant on the given tile
     * @param {object} param0
     * @param {import("shapez/game/root").GameRoot} param0.root
     * @param {import("shapez/core/vector").Vector} param0.tile
     * @param {number} param0.rotation
     * @param {string} param0.variant
     * @param {Layer} param0.layer
     * @return {{ rotation: number, rotationVariant: number, connectedEntities?: Array<import("shapez/game/entity").Entity> }}
     */
    computeOptimalDirectionAndRotationVariantAtTile({ root, tile, rotation }) {
        const typeMask = "default";
        const compDirection = null;

        let directions = arrayAllDirections;
        if (compDirection) {
            directions = [
                Vector.transformDirectionFromMultipleOf90(compDirection.from, rotation),
                Vector.transformDirectionFromMultipleOf90(compDirection.to, rotation),
            ];
        }

        const allOffsets = [];
        const tileSpaceBounds = this.computeTileSpaceBounds(tile, rotation);
        for (let x = 0; x < tileSpaceBounds.w; ++x) {
            allOffsets.push({
                initialSearchTile: new Vector(x + tileSpaceBounds.x, -1 + tileSpaceBounds.y),
                direction: enumDirection.top,
            });
            allOffsets.push({
                initialSearchTile: new Vector(x + tileSpaceBounds.x, tileSpaceBounds.h + tileSpaceBounds.y),
                direction: enumDirection.bottom,
            });
        }
        for (let y = 0; y < tileSpaceBounds.h; ++y) {
            allOffsets.push({
                initialSearchTile: new Vector(-1 + tileSpaceBounds.x, y + tileSpaceBounds.y),
                direction: enumDirection.left,
            });
            allOffsets.push({
                initialSearchTile: new Vector(tileSpaceBounds.w + tileSpaceBounds.x, y + tileSpaceBounds.y),
                direction: enumDirection.right,
            });
        }
        const offsets = allOffsets.filter(x => directions.includes(x.direction));

        const connections = {
            [enumDirection.top]: false,
            [enumDirection.bottom]: false,
            [enumDirection.left]: false,
            [enumDirection.right]: false,
        };

        let currentNetwork = null;
        for (let i = 0; i < offsets.length; i++) {
            const { direction, initialSearchTile } = offsets[i];
            const entity = root.map.getLayerContentXY(initialSearchTile.x, initialSearchTile.y, "regular");
            if (!entity) continue;

            const staticComp = entity.components.StaticMapEntity;

            /** @type {import("@dj1tjoo/shapez-pipes/lib/js/components/pipe_connector").PipeConnectorComponent} */
            const connectorComp = entity.components["PipeConnector"];

            if (connectorComp) {
                let validDirection = true;
                if (connectorComp.direction) {
                    const connectorDirections = [
                        connectorComp.direction.from,
                        connectorComp.direction.to,
                    ].map(x => staticComp.localDirectionToWorld(x));

                    if (!connectorDirections.includes(enumInvertedDirections[direction])) {
                        validDirection = false;
                    }
                }

                if ((!typeMask || connectorComp.type === typeMask) && validDirection) {
                    currentNetwork = connectorComp.linkedNetwork;
                    connections[direction] = true;
                }
            }

            // Check for connected slots
            /** @type {import("@dj1tjoo/shapez-pipes/lib/js/components/pipe_pin").PipePinComponent} */
            const pinComp = entity.components["PipePin"];
            if (pinComp) {
                // Go over all slots and see if they are connected
                const pinSlots = pinComp.slots;
                for (let j = 0; j < pinSlots.length; ++j) {
                    const slot = pinSlots[j];

                    // Check if the position matches
                    const pinPos = staticComp.localTileToWorld(slot.pos);
                    if (!pinPos.equals(initialSearchTile)) {
                        continue;
                    }

                    // Check if the direction (inverted) matches
                    const pinDirection = staticComp.localDirectionToWorld(slot.direction);
                    if (pinDirection !== enumInvertedDirections[direction]) {
                        continue;
                    }

                    if (
                        currentNetwork &&
                        currentNetwork.currentFluid !== null &&
                        !slot.fluid.equals(currentNetwork.currentFluid)
                    ) {
                        continue;
                    }

                    currentNetwork = slot.linkedNetwork;
                    connections[direction] = true;
                }
            }
        }

        let flag = 0;
        flag |= connections[enumDirection.top] ? 0x1000 : 0;
        flag |= connections[enumDirection.right] ? 0x100 : 0;
        flag |= connections[enumDirection.bottom] ? 0x10 : 0;
        flag |= connections[enumDirection.left] ? 0x1 : 0;

        let targetType = enumConnectorType.forward;

        // First, reset rotation
        rotation = 0;

        switch (flag) {
            case 0x0000:
                // Nothing
                break;

            case 0x0001:
                // Left
                targetType = enumConnectorType.stub;
                rotation += 90;
                break;

            case 0x0010:
                // Bottom
                targetType = enumConnectorType.stub;
                break;

            case 0x0011:
                // Bottom | Left
                targetType = enumConnectorType.turn;
                rotation += 90;
                break;

            case 0x0100:
                // Right
                targetType = enumConnectorType.stub;
                rotation -= 90;
                break;

            case 0x0101:
                // Right | Left
                targetType = enumConnectorType.forward;
                rotation += 90;
                break;

            case 0x0110:
                // Right | Bottom
                targetType = enumConnectorType.turn;
                break;

            case 0x0111:
                // Right | Bottom | Left
                targetType = enumConnectorType.split;
                break;

            case 0x1000:
                // Top
                targetType = enumConnectorType.stub;
                rotation += 180;
                break;

            case 0x1001:
                // Top | Left
                targetType = enumConnectorType.turn;
                rotation += 180;
                break;

            case 0x1010:
                targetType = enumConnectorType.forward;
                break;

            case 0x1011:
                // Top | Bottom | Left
                targetType = enumConnectorType.split;
                rotation += 90;
                break;

            case 0x1100:
                // Top | Right
                targetType = enumConnectorType.turn;
                rotation -= 90;
                break;

            case 0x1101:
                // Top | Right | Left
                targetType = enumConnectorType.split;
                rotation += 180;
                break;

            case 0x1110:
                // Top | Right | Bottom
                targetType = enumConnectorType.split;
                rotation -= 90;
                break;

            case 0x1111:
                // Top | Right | Bottom | Left
                targetType = enumConnectorType.cross;
                break;
        }

        return {
            rotation: (rotation + 360 * 10) % 360,
            rotationVariant: arrayConnectorRotationVariantToType.indexOf(targetType),
        };
    }

    /**
     * Computes the bounds around a tile
     * @param {Vector} origin
     * @param {number} rotation
     * @returns {Rectangle}
     */
    computeTileSpaceBounds(origin, rotation) {
        const size = this.getDimensions();

        switch (rotation) {
            case 0:
                return new Rectangle(origin.x, origin.y, size.x, size.y);
            case 90:
                return new Rectangle(origin.x - size.y + 1, origin.y, size.y, size.x);
            case 180:
                return new Rectangle(origin.x - size.x + 1, origin.y - size.y + 1, size.x, size.y);
            case 270:
                return new Rectangle(origin.x, origin.y - size.x + 1, size.y, size.x);
            default:
                assert(false, "Invalid rotation");
        }
    }
}
