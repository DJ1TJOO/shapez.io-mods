import { defaultBuildingVariant } from "shapez/game/meta_building";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { ItemAcceptorComponent } from "shapez/game/components/item_acceptor";
import {
    enumItemProcessorRequirements,
    enumItemProcessorTypes,
    ItemProcessorComponent,
} from "shapez/game/components/item_processor";
import { globalConfig } from "shapez/core/config";
import { MOD_ITEM_PROCESSOR_SPEEDS } from "shapez/game/hub_goals";
import {
    MODS_CAN_PROCESS,
    MODS_PROCESSING_REQUIREMENTS,
    MOD_ITEM_PROCESSOR_HANDLERS,
} from "shapez/game/systems/item_processor";
import { AdvancedEnergy } from "@dj1tjoo/shapez-advanced-energy";
import { T } from "shapez/translations";
import { formatAePerTick } from "../ui/formatter";
import { Pipes } from "@dj1tjoo/shapez-pipes";
import { Loader } from "shapez/core/loader";
import { Rectangle } from "shapez/core/rectangle";
import { arrayAllDirections, Vector, enumDirection } from "shapez/core/vector";
import { TurbineComponent } from "../components/turbine";
import { getComponentShared } from "../../../shared/getShared";
import { config } from "../config";
import { Steam } from "../../../shared/fluids/steam";
import { amountPerCharge } from "../amountPerCharge";
import { rewards } from "../reward";

export const processLabelTurbine = "dj1tjoo@turbine";

const addRotationVariants = ({ variant, name, description }, rotationVariants) =>
    [...Array(rotationVariants).keys()].map(x => ({ variant, name, description, rotationVariant: x }));

export const turbineComponents = {
    steam_intake: "steam_intake",
    fuel_intake: "fuel_intake",
    mixer: "mixer",
    energy_outlet: "energy_outlet",
};

/** @enum {string} */
export const enumTurbineType = {
    full: "forward",
    around: "turn",
    corner: "split",
    side: "cross",
    sides: "stub",
    none: "none",
};

export const arrayTurbineRotationVariantToType = [
    enumTurbineType.full,
    enumTurbineType.around,
    enumTurbineType.corner,
    enumTurbineType.side,
    enumTurbineType.sides,
    enumTurbineType.none,
];

export class MetaTurbineBuilding extends ModMetaBuilding {
    constructor() {
        super("turbine");
    }

    getSilhouetteColor() {
        return "#04FC84";
    }

    getStayInPlacementMode() {
        return true;
    }

    /**
     * @param {import("shapez/game/root").GameRoot} root
     * @returns {boolean}
     */
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(rewards.advanced_energy_steam_turbine);
    }

    getSprite(rotationVariant) {
        switch (arrayTurbineRotationVariantToType[rotationVariant]) {
            case enumTurbineType.full: {
                return Loader.getSprite("sprites/turbine/" + "default" + "_full.png");
            }
            case enumTurbineType.around: {
                return Loader.getSprite("sprites/turbine/" + "default" + "_around.png");
            }
            case enumTurbineType.corner: {
                return Loader.getSprite("sprites/turbine/" + "default" + "_corner.png");
            }
            case enumTurbineType.side: {
                return Loader.getSprite("sprites/turbine/" + "default" + "_side.png");
            }
            case enumTurbineType.sides: {
                return Loader.getSprite("sprites/turbine/" + "default" + "_sides.png");
            }
            case enumTurbineType.none: {
                return Loader.getSprite("sprites/turbine/" + "default" + "_none.png");
            }
            default: {
                assertAlways(false, "Invalid connector rotation variant");
            }
        }
    }

    /**
     *
     * @param {number} rotationVariant
     * @param {string} variant
     * @returns {import("shapez/core/draw_utils").AtlasSprite}
     */
    getPreviewSprite(rotationVariant, variant) {
        switch (arrayTurbineRotationVariantToType[rotationVariant]) {
            case enumTurbineType.full: {
                return Loader.getSprite("sprites/turbine/" + "default" + "_full.png");
            }
            case enumTurbineType.around: {
                return Loader.getSprite("sprites/turbine/" + "default" + "_around.png");
            }
            case enumTurbineType.corner: {
                return Loader.getSprite("sprites/turbine/" + "default" + "_corner.png");
            }
            case enumTurbineType.side: {
                return Loader.getSprite("sprites/turbine/" + "default" + "_side.png");
            }
            case enumTurbineType.sides: {
                return Loader.getSprite("sprites/turbine/" + "default" + "_sides.png");
            }
            case enumTurbineType.none: {
                return Loader.getSprite("sprites/turbine/" + "default" + "_none.png");
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
            ...addRotationVariants(
                {
                    variant: defaultBuildingVariant,
                    name: "Turbine Controller",
                    description: "Controls the multiblock of the turbine",
                },
                6
            ),
            ...addRotationVariants(
                {
                    variant: turbineComponents.steam_intake,
                    name: "Steam Intake",
                    description: "Adds an input for the steam",
                },
                6
            ),
            ...addRotationVariants(
                {
                    variant: turbineComponents.fuel_intake,
                    name: "Shape Fuel Intake",
                    description: "Adds an input for the shape fuel",
                },
                6
            ),
            ...addRotationVariants(
                {
                    variant: turbineComponents.mixer,
                    name: "Mixer",
                    description: "Combines the fuel and steam to let the tubrine spin",
                },
                6
            ),
            ...addRotationVariants(
                {
                    variant: turbineComponents.energy_outlet,
                    name: "Energy Outlet",
                    description: "Outputs the energy generated",
                },
                6
            ),
        ];
    }

    getAvailableVariants() {
        return [
            defaultBuildingVariant,
            turbineComponents.steam_intake,
            turbineComponents.fuel_intake,
            turbineComponents.mixer,
            turbineComponents.energy_outlet,
        ];
    }

    getAdditionalStatistics(root, variant) {
        return /** @type {[string, string][]}*/ ([[T.advanced_generators.produces, formatAePerTick(0)]]);
    }

    /**
     * Should update the entity to match the given variants
     * @param {import("shapez/game/entity").Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    updateVariants(entity, rotationVariant, variant) {
        const localConfig = config().turbine;
        const enumRotationVariant = arrayTurbineRotationVariantToType[rotationVariant];
        const tier = entity.components["Turbine"].linkedNetwork?.tier || localConfig.tier1;

        let produced = localConfig.maxBuffers.energy_outlet * tier.items;
        if (entity.root) {
            const ticksPassed = amountPerCharge(entity.root, tier.items, processLabelTurbine);
            produced = tier.energy * ticksPassed;
        }

        if (variant !== turbineComponents.energy_outlet) entity.components["EnergyPin"].setSlots([]);
        if (variant !== turbineComponents.steam_intake) entity.components["PipePin"].setSlots([]);
        if (variant !== turbineComponents.fuel_intake) entity.components.ItemAcceptor.setSlots([]);

        if (variant === turbineComponents.energy_outlet) {
            /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent} */
            entity.components["EnergyPin"].setSlots(
                this.getFreeDirections(enumRotationVariant).map(x => ({
                    direction: x,
                    pos: new Vector(0, 0),
                    type: "ejector",
                    productionPerTick: tier.energy,
                    maxBuffer: produced,
                }))
            );
        }

        if (variant === turbineComponents.steam_intake) {
            /** @type {import("@dj1tjoo/shapez-pipes/lib/js/components/pipe_pin").PipePinComponent} */
            entity.components["PipePin"].setSlots(
                this.getFreeDirections(enumRotationVariant).map(x => ({
                    direction: x,
                    pos: new Vector(0, 0),
                    type: "acceptor",
                    consumptionPerTick: tier.steam,
                    maxBuffer: localConfig.maxBuffers.steam_intake * tier.items,
                    fluid: Steam.SINGLETON,
                }))
            );
        }

        if (variant === turbineComponents.fuel_intake) {
            entity.components.ItemAcceptor.setSlots(
                this.getFreeDirections(enumRotationVariant).map(x => ({
                    direction: x,
                    pos: new Vector(0, 0),
                    filter: "shape",
                }))
            );
        }
    }

    getFreeDirections(type) {
        const directions = [];
        switch (type) {
            case enumTurbineType.around:
                directions.push(enumDirection.top);
                directions.push(enumDirection.bottom);
                directions.push(enumDirection.left);
                break;
            case enumTurbineType.corner:
                directions.push(enumDirection.bottom);
                directions.push(enumDirection.left);
                break;
            case enumTurbineType.full:
                directions.push(enumDirection.top);
                directions.push(enumDirection.bottom);
                directions.push(enumDirection.left);
                directions.push(enumDirection.right);
                break;
            case enumTurbineType.side:
                directions.push(enumDirection.top);
                break;
            case enumTurbineType.sides:
                directions.push(enumDirection.left);
                directions.push(enumDirection.right);
                break;

            default:
                break;
        }

        return directions;
    }

    /**
     * Creates the entity at the given location
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     * @param {import("shapez/game/root").GameRoot} root
     */
    setupEntityComponents(entity, root) {
        entity.addComponent(
            new ItemAcceptorComponent({
                slots: [],
            })
        );

        entity.addComponent(
            new ItemProcessorComponent({
                inputsPerCharge: 1,
                processorType: enumItemProcessorTypes[processLabelTurbine],
                processingRequirement: enumItemProcessorRequirements[processLabelTurbine],
            })
        );

        entity.addComponent(getComponentShared("EnergyPinRenderer"));
        entity.addComponent(getComponentShared("PipePinRenderer"));

        entity.addComponent(new TurbineComponent());

        entity.addComponent(
            new AdvancedEnergy.EnergyPinComponent({
                slots: [],
            })
        );

        entity.addComponent(
            new Pipes.PipePinComponent({
                slots: [],
            })
        );
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
        const directions = arrayAllDirections;

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

        for (let i = 0; i < offsets.length; i++) {
            const { initialSearchTile, direction } = offsets[i];

            // First, find the initial connected entities
            const initialContents = root.map.getLayersContentsMultipleXY(
                initialSearchTile.x,
                initialSearchTile.y
            );

            for (let k = 0; k < initialContents.length; ++k) {
                const entity = initialContents[k];

                /** @type {TurbineComponent} */
                const turbineComp = entity.components["Turbine"];

                if (turbineComp && turbineComp.linkedNetwork && turbineComp.linkedNetwork.isValid) {
                    connections[direction] = true;
                }
            }
        }

        let flag = 0;
        flag |= connections[enumDirection.top] ? 0x1000 : 0;
        flag |= connections[enumDirection.right] ? 0x100 : 0;
        flag |= connections[enumDirection.bottom] ? 0x10 : 0;
        flag |= connections[enumDirection.left] ? 0x1 : 0;

        let targetType = enumTurbineType.full;

        // First, reset rotation
        rotation = 0;

        switch (flag) {
            case 0x0000:
                // Nothing
                break;

            case 0x0001:
                // Left
                targetType = enumTurbineType.around;
                rotation += 180;
                break;

            case 0x0010:
                // Bottom
                targetType = enumTurbineType.around;
                rotation += 90;
                break;

            case 0x0011:
                // Bottom | Left
                targetType = enumTurbineType.corner;
                rotation += 180;
                break;

            case 0x0100:
                // Right
                targetType = enumTurbineType.around;
                break;

            case 0x0101:
                // Right | Left
                targetType = enumTurbineType.sides;
                rotation += 90;
                break;

            case 0x0110:
                // Right | Bottom
                targetType = enumTurbineType.corner;
                rotation += 90;
                break;

            case 0x0111:
                // Right | Bottom | Left
                targetType = enumTurbineType.side;
                break;

            case 0x1000:
                // Top
                targetType = enumTurbineType.around;
                rotation -= 90;
                break;

            case 0x1001:
                // Top | Left
                targetType = enumTurbineType.corner;
                rotation -= 90;
                break;

            case 0x1010:
                // Top | Bottom
                targetType = enumTurbineType.sides;
                rotation += 180;
                break;

            case 0x1011:
                // Top | Bottom | Left
                targetType = enumTurbineType.side;
                rotation += 90;
                break;

            case 0x1100:
                // Top | Right
                targetType = enumTurbineType.corner;
                break;

            case 0x1101:
                // Top | Right | Left
                targetType = enumTurbineType.side;
                rotation += 180;
                break;

            case 0x1110:
                // Top | Right | Bottom
                targetType = enumTurbineType.side;
                rotation -= 90;
                break;

            case 0x1111:
                // Top | Right | Bottom | Left
                targetType = enumTurbineType.none;
                break;
        }

        return {
            rotation: (rotation + 360 * 10) % 360,
            rotationVariant: arrayTurbineRotationVariantToType.indexOf(targetType),
        };
    }

    /**
     * Computes the bounds around a tile
     * @param {Vector} origin
     * @param {number} rotation
     * @returns {import("shapez/core/draw_parameters").Rectangle}
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

export function setupTurbine() {
    enumItemProcessorTypes[processLabelTurbine] = processLabelTurbine;
    enumItemProcessorRequirements[processLabelTurbine] = processLabelTurbine;

    /**
     * @this {import("shapez/game/systems/item_processor").ItemProcessorSystem}
     * @param {{entity: import("shapez/game/entity").Entity}} param0
     */
    MODS_CAN_PROCESS[enumItemProcessorRequirements[processLabelTurbine]] = function ({ entity }) {
        const localConfig = config().turbine;
        const tier = entity.components["Turbine"].linkedNetwork?.tier || localConfig.tier1;

        if (
            !entity.components["Turbine"].linkedNetwork ||
            !entity.components["Turbine"].linkedNetwork.isValid ||
            entity.components["Turbine"].linkedNetwork.fuel.length > tier.items * 2
        )
            return false;

        const processorComp = entity.components.ItemProcessor;
        return processorComp.inputCount >= processorComp.inputsPerCharge;
    };

    /**
     *
     * @param {{item: import("shapez/game/items/shape_item").ShapeItem}} param0
     * @returns
     */
    MODS_PROCESSING_REQUIREMENTS[enumItemProcessorRequirements[processLabelTurbine]] = function ({ item }) {
        const localConfig = config().turbine;

        return [localConfig.tier1, localConfig.tier2, localConfig.tier3, localConfig.tier4].some(
            x => x.shape === item.definition.getHash()
        );
    };

    /**
     * @this {import("shapez/game/systems/item_processor").ItemProcessorSystem}
     */
    MOD_ITEM_PROCESSOR_HANDLERS[enumItemProcessorTypes[processLabelTurbine]] = function ({ items, entity }) {
        /** @type {TurbineComponent} */
        const turbineComp = entity.components["Turbine"];
        turbineComp.linkedNetwork.fuel.push(...items.values());
    };

    /**
     * @param {import("shapez/core/draw_parameters").GameRoot} root
     */
    MOD_ITEM_PROCESSOR_SPEEDS[enumItemProcessorTypes[processLabelTurbine]] = function (root) {
        return globalConfig.beltSpeedItemsPerSecond * root.hubGoals.upgradeImprovements.processors * (1 / 8);
    };
}
