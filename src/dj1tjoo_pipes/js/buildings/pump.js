import { globalConfig } from "shapez/core/config";
import { generateMatrixRotations } from "shapez/core/utils";
import { Vector, enumDirection, enumInvertedDirections } from "shapez/core/vector";
import { ItemAcceptorComponent } from "shapez/game/components/item_acceptor";
import {
    ItemProcessorComponent,
    enumItemProcessorTypes,
    enumItemProcessorRequirements,
} from "shapez/game/components/item_processor";
import { MOD_ITEM_PROCESSOR_SPEEDS } from "shapez/game/hub_goals";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import {
    ShapeDefinition,
    TOP_RIGHT,
    BOTTOM_RIGHT,
    BOTTOM_LEFT,
    TOP_LEFT,
    enumSubShape,
} from "shapez/game/shape_definition";
import {
    ItemProcessorSystem,
    MODS_CAN_PROCESS,
    MODS_PROCESSING_REQUIREMENTS,
    MOD_ITEM_PROCESSOR_HANDLERS,
} from "shapez/game/systems/item_processor";
import { ModMetaBuilding } from "shapez/mods/mod_meta_building";
import { BaseFluid } from "../base_fluid";
import { enumPinSlotType, PipedPinsComponent } from "../components/pipe_pins";
import { PumpComponent } from "../components/pump";

const overlayMatrix = generateMatrixRotations([1, 0, 1, 0, 1, 0, 1, 0, 1]);

/** @enum {string} */
export const enumPumpVariant = {
    pump: "pump",
    pressure_pump: "pressure_pump",
};

export const enumPumpVariantToVariant = {
    [defaultBuildingVariant]: enumPumpVariant.pump,
    [enumPumpVariant.pressure_pump]: enumPumpVariant.pressure_pump,
};

export class MetaPumpBuilding extends ModMetaBuilding {
    constructor() {
        super("pump");
    }

    getSilhouetteColor() {
        return "#B2B4BB";
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: defaultBuildingVariant,
                name: "Pump",
                description: "",
            },
            {
                variant: enumPumpVariant.pressure_pump,
                name: "Pressure pump",
                description: "",
            },
        ];
    }

    getAvailableVariants(root) {
        let variants = [defaultBuildingVariant, enumPumpVariant.pressure_pump];
        return variants;
    }

    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant) {
        return overlayMatrix[rotation];
    }

    updateVariants(entity, rotationVariant, variant) {
        let fluid = null;

        switch (enumPumpVariantToVariant[variant]) {
            case enumPumpVariant.pump:
                if (entity.components.ItemAcceptor) {
                    entity.removeComponent(ItemAcceptorComponent);
                }
                if (entity.components.ItemProcessor) {
                    entity.removeComponent(ItemProcessorComponent);
                }
                if (!entity.components.Pump) {
                    entity.addComponent(new PumpComponent({ pressure: 100, fluid: null }));
                }

                entity.components.PipedPins.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalEjector,
                        volume: 50,
                    },
                ]);

                if (entity.root) {
                    // @ts-ignore
                    const layerFluid = /** @type {BaseFluid} */ (
                        entity.root.map.getLowerLayerContentXY(
                            entity.components.StaticMapEntity.origin.x,
                            entity.components.StaticMapEntity.origin.y
                        )
                    );

                    if (layerFluid && layerFluid.getItemType() === "fluid") {
                        fluid = layerFluid;
                    }
                }
                entity.components.Pump.fluid = fluid;

                break;
            case enumPumpVariant.pressure_pump:
                if (entity.components.Pump) {
                    entity.removeComponent(PumpComponent);
                }

                if (!entity.components.ItemAcceptor) {
                    entity.addComponent(
                        new ItemAcceptorComponent({
                            slots: [],
                        })
                    );
                }
                if (!entity.components.ItemProcessor) {
                    entity.addComponent(
                        new ItemProcessorComponent({
                            inputsPerCharge: 1,
                            processorType: enumItemProcessorTypes["pump"],
                        })
                    );
                } else {
                    entity.components.ItemProcessor.inputsPerCharge = 1;
                    entity.components.ItemProcessor.processorType = enumItemProcessorTypes["pump"];
                }

                entity.components.PipedPins.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalEjector,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.bottom,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                ]);

                entity.components.ItemAcceptor.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.right,
                        filter: "shape",
                    },
                ]);

                break;

            default:
                break;
        }
    }

    setupEntityComponents(entity) {
        entity.addComponent(new PipedPinsComponent({ slots: [] }));
        entity.addComponent(new PumpComponent({ pressure: 100, fluid: null }));
        entity.addComponent(
            new ItemAcceptorComponent({
                slots: [],
            })
        );
        entity.addComponent(
            new ItemProcessorComponent({
                inputsPerCharge: 1,
                processorType: enumItemProcessorTypes["pump"],
            })
        );
    }
}

/**
 * @this { Mod }
 */
export function setupPump() {
    enumItemProcessorTypes["pump"] = "pump";
    enumItemProcessorRequirements["pump"] = "pump";

    MODS_CAN_PROCESS[enumItemProcessorRequirements["pump"]] = function ({ entity }) {
        return true;
    };

    MODS_PROCESSING_REQUIREMENTS[enumItemProcessorRequirements["pump"]] = function ({
        entity,
        item,
        slotIndex,
    }) {
        /** @type {ShapeDefinition} */
        const shapeDefinition = item.definition;

        const newLayers = shapeDefinition.getClonedLayers();
        let allowed = true;
        for (let i = 0; i < newLayers.length; i++) {
            const layer = newLayers[i];

            const tr = layer[TOP_RIGHT];
            const br = layer[BOTTOM_RIGHT];
            const bl = layer[BOTTOM_LEFT];
            const tl = layer[TOP_LEFT];

            if (
                tr.subShape !== enumSubShape.windmill ||
                br.subShape !== enumSubShape.windmill ||
                tl.subShape !== enumSubShape.windmill ||
                bl.subShape !== enumSubShape.windmill
            ) {
                allowed = false;
                break;
            }
        }

        if (!allowed) {
            /** @type {PipedPinsComponent} */
            const pinsComp = entity.components.PipedPins;
            const ejector = pinsComp.slots.find(x => x.type === enumPinSlotType.logicalEjector);
            const acceptor = pinsComp.slots.find(x => x.type === enumPinSlotType.logicalAcceptor);

            ejector.pressure = acceptor.pressure;
            ejector.fluid = acceptor.fluid;

            return false;
        }

        return true;
    };

    /**
     * @this {ItemProcessorSystem}
     */
    MOD_ITEM_PROCESSOR_HANDLERS[enumItemProcessorTypes["pump"]] = function ({ entity, items }) {
        const staticComp = entity.components.StaticMapEntity;

        /**
         * @TODO sprite for pressure pump
         * */

        /** @type {PipedPinsComponent} */
        const pinsComp = entity.components.PipedPins;
        const ejector = pinsComp.slots.find(x => x.type === enumPinSlotType.logicalEjector);
        const acceptor = pinsComp.slots.find(x => x.type === enumPinSlotType.logicalAcceptor);

        let volume = 0;
        if (acceptor.linkedNetwork) {
            const pipe = pinsComp.getConnectedPipe(this.root, entity, acceptor);
            if (pipe.components.Pipe) {
                // Get max volume of pipe
                volume = pipe.components.Pipe.maxVolume;
            } else if (pipe.components.PipedPins) {
                // Get correct slot
                const pipePinsComp = pipe.components.PipedPins;
                const pipeStaticComp = pipe.components.StaticMapEntity;

                for (let i = 0; i < pipePinsComp.slots.length; i++) {
                    const currentSlot = pipePinsComp.slots[i];
                    if (
                        pipeStaticComp.localDirectionToWorld(currentSlot.direction) ===
                        enumInvertedDirections[staticComp.localDirectionToWorld(acceptor.direction)]
                    ) {
                        // Defaults to max volume of 50 when no pipes
                        if (currentSlot.linkedNetwork) {
                            volume = currentSlot.linkedNetwork.maxVolume;
                        }
                        break;
                    }
                }
            }
        }

        ejector.pressure = Math.round(pinsComp.getLocalPressure(this.root, entity, acceptor) * 1.3);
        ejector.fluid = acceptor.fluid;

        let volumeToMove = volume;
        if (ejector.linkedNetwork && acceptor.linkedNetwork) {
            if (ejector.linkedNetwork.currentVolume + volumeToMove >= ejector.linkedNetwork.maxVolume) {
                volumeToMove = ejector.linkedNetwork.maxVolume - ejector.linkedNetwork.currentVolume;
            }

            if (acceptor.linkedNetwork.currentVolume - volumeToMove < 0) {
                volumeToMove = acceptor.linkedNetwork.currentVolume;
            }

            ejector.linkedNetwork.currentVolume += volumeToMove;
            acceptor.linkedNetwork.currentVolume -= volumeToMove;
        }
    };

    /**
     * @param {import("shapez/savegame/savegame_serializer").GameRoot} root
     */
    MOD_ITEM_PROCESSOR_SPEEDS[enumItemProcessorTypes["pump"]] = function (root) {
        return globalConfig.beltSpeedItemsPerSecond * root.hubGoals.upgradeImprovements.processors * (1 / 8);
    };
}
