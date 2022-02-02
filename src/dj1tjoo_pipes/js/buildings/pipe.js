import { Loader } from "shapez/core/loader";
import { generateMatrixRotations } from "shapez/core/utils";
import { Vector } from "shapez/core/vector";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { MODS } from "shapez/mods/modloader";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { SOUNDS } from "shapez/platform/sound";
import { enumPipeType, PipeComponent } from "../components/pipe";
import { arrayPipeRotationVariantToType } from "../systems/pipe";

/** @enum {string} */
export const enumPipeVariant = {
    pipe: "pipe",
    industrial: "industrial",
};

/** @enum {string} */
export const pipeVariants = {
    industrial: "industrial",
};

export const enumPipeVariantToVariant = {
    [defaultBuildingVariant]: enumPipeVariant.pipe,
    [pipeVariants.industrial]: enumPipeVariant.industrial,
};

const enumPipeVariantToPressureFriction = {
    [defaultBuildingVariant]: 2,
    [pipeVariants.industrial]: 1,
};

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
        return "#9799A3";
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
                return Loader.getSprite("sprites/blueprints/" + pipeVariant + "_forward.png");
            }
            case enumPipeType.turn: {
                return Loader.getSprite("sprites/blueprints/" + pipeVariant + "_turn.png");
            }
            case enumPipeType.split: {
                return Loader.getSprite("sprites/blueprints/" + pipeVariant + "_split.png");
            }
            case enumPipeType.cross: {
                return Loader.getSprite("sprites/blueprints/" + pipeVariant + "_cross.png");
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
        return (
            MODS.mods
                .find(x => x.metadata.id === "dj1tjoo_pipes")
                // @ts-ignore
                .computeOptimalDirectionAndRotationVariantAtTile({ root, tile, rotation, pipeVariant, layer })
        );
    }
}
