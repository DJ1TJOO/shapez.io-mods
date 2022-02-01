import { Loader } from "shapez/core/loader";
import { generateMatrixRotations } from "shapez/core/utils";
import { enumDirection, Vector, enumAngleToDirection } from "shapez/core/vector";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { SOUNDS } from "shapez/platform/sound";
import { enumPipeType, enumPipeVariant, PipeComponent } from "../components/pipe";

export const arrayPipeRotationVariantToType = [
    enumPipeType.forward,
    enumPipeType.turn,
    enumPipeType.split,
    enumPipeType.cross,
];

/** @enum {string} */
export const pipeVariants = {
    industrial: "industrial",
};

const enumPipeVariantToVariant = {
    [defaultBuildingVariant]: enumPipeVariant.pipe,
    [pipeVariants.industrial]: enumPipeVariant.industrial,
};

const enumPipeVariantToPressureFriction = {
    [defaultBuildingVariant]: 0.04,
    [pipeVariants.industrial]: 0.02,
};

export const arrayPipeVariantToRotation = [enumDirection.top, enumDirection.left, enumDirection.right];

export const pipeOverlayMatrices = {
    [enumPipeType.forward]: generateMatrixRotations([0, 1, 0, 0, 1, 0, 0, 1, 0]),
    [enumPipeType.split]: generateMatrixRotations([0, 0, 0, 1, 1, 1, 0, 1, 0]),
    [enumPipeType.turn]: generateMatrixRotations([0, 0, 0, 0, 1, 1, 0, 1, 0]),
    [enumPipeType.cross]: generateMatrixRotations([0, 1, 0, 1, 1, 1, 0, 1, 0]),
};

export class MetaPipeBuilding extends ModMetaBuilding {
    constructor() {
        super("pipe");
    }

    getHasDirectionLockAvailable() {
        return true;
    }

    getSilhouetteColor() {
        return "#61ef6f";
    }

    getDimensions() {
        return new Vector(1, 1);
    }

    getStayInPlacementMode() {
        return true;
    }

    getPlacementSound() {
        return SOUNDS.placeBelt;
    }

    getRotateAutomaticallyWhilePlacing() {
        return true;
    }

    getSprite() {
        return null;
    }

    /**
     *
     *@param {string} variant
     */
    isPlaceableToFluid(variant) {
        switch (variant) {
            case defaultBuildingVariant:
                return true;
            case enumPipeVariant.industrial:
                return false;
        }
    }

    getIsReplaceable() {
        return true;
    }

    /**
     * @param {import("shapez/savegame/savegame_serializer").GameRoot} root
     */
    getIsUnlocked(root) {
        return true;
    }

    getAvailableVariants(root) {
        let variants = [defaultBuildingVariant, enumPipeVariant.industrial];
        return variants;
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Pipe",
                description: "",
                rotationVariant: 0,
            },
            {
                variant: defaultBuildingVariant,
                name: "Pipe",
                description: "",
                rotationVariant: 1,
            },
            {
                variant: defaultBuildingVariant,
                name: "Pipe",
                description: "",
                rotationVariant: 2,
            },
            {
                variant: defaultBuildingVariant,
                name: "Pipe",
                description: "",
                rotationVariant: 3,
            },
            {
                variant: enumPipeVariant.industrial,
                name: "Industrial Pipe",
                description: "",
                rotationVariant: 0,
            },
            {
                variant: enumPipeVariant.industrial,
                name: "Industrial Pipe",
                description: "",
                rotationVariant: 1,
            },
            {
                variant: enumPipeVariant.industrial,
                name: "Industrial Pipe",
                description: "",
                rotationVariant: 2,
            },
            {
                variant: enumPipeVariant.industrial,
                name: "Industrial Pipe",
                description: "",
                rotationVariant: 3,
            },
        ];
    }

    /**
     * Creates the entity at the given location
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     */
    setupEntityComponents(entity) {
        entity.addComponent(new PipeComponent({}));
    }

    /**
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    updateVariants(entity, rotationVariant, variant) {
        // @ts-ignore
        entity.components.Pipe.type = arrayPipeRotationVariantToType[rotationVariant];
        // @ts-ignore
        entity.components.Pipe.variant = enumPipeVariantToVariant[variant];
        // @ts-ignore
        entity.components.Pipe.pressureFriction = enumPipeVariantToPressureFriction[variant];
    }

    /**
     *
     * @param {number} rotation
     * @param {number} rotationVariant
     * @param {string} variant
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     */
    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant, entity) {
        // @ts-ignore
        return pipeOverlayMatrices[entity.components.Pipe.type][rotation];
    }

    /**
     *
     * @param {number} rotationVariant
     * @param {string} variant
     * @returns {import("shapez/core/draw_utils").AtlasSprite}
     */
    getPreviewSprite(rotationVariant, variant) {
        const pipeVariant = enumPipeVariantToVariant[variant];
        switch (arrayPipeRotationVariantToType[rotationVariant]) {
            case enumPipeType.forward: {
                return Loader.getSprite("sprites/pipes/" + pipeVariant + "_forward.png");
            }
            case enumPipeType.turn: {
                return Loader.getSprite("sprites/pipes/" + pipeVariant + "_turn.png");
            }
            case enumPipeType.split: {
                return Loader.getSprite("sprites/pipes/" + pipeVariant + "_split.png");
            }
            case enumPipeType.cross: {
                return Loader.getSprite("sprites/pipes/" + pipeVariant + "_cross.png");
            }
            default: {
                assertAlways(false, "Invalid pipe rotation variant");
            }
        }
    }

    getBlueprintSprite(rotationVariant, variant) {
        return this.getPreviewSprite(rotationVariant, variant);
    }

    /**
     * Should compute the optimal rotation variant on the given tile
     * @param {object} param0
     * @param {import("shapez/savegame/savegame_serializer").GameRoot} param0.root
     * @param {Vector} param0.tile
     * @param {number} param0.rotation
     * @param {string} param0.variant
     * @param {string} param0.layer
     * @return {{ rotation: number, rotationVariant: number, connectedEntities?: Array<import("shapez/savegame/savegame_serializer").Entity> }}
     */
    computeOptimalDirectionAndRotationVariantAtTile({ root, tile, rotation, variant, layer }) {
        const pipeVariant = enumPipeVariantToVariant[variant];
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
