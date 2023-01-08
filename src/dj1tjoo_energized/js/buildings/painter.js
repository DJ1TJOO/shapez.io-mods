import { addAcceptor } from "../addAcceptor";
import { enumDirection, Vector } from "shapez/core/vector";
import { enumPainterVariants, MetaPainterBuilding } from "shapez/game/buildings/painter";
import { enumItemProcessorTypes } from "shapez/game/components/item_processor";
import { defaultBuildingVariant } from "shapez/game/meta_building";

export function painter(mod) {
    addAcceptor.apply(mod, [
        MetaPainterBuilding,
        {
            [defaultBuildingVariant]: {
                processorType: enumItemProcessorTypes.painter,
                processorHandler: "process_PAINTER",
                slot: {
                    direction: enumDirection.top,
                    pos: new Vector(0, 0),
                },
            },
            [enumPainterVariants.mirrored]: {
                processorType: enumItemProcessorTypes.painter,
                processorHandler: "process_PAINTER",
                slot: {
                    direction: enumDirection.bottom,
                    pos: new Vector(0, 0),
                },
            },
            [enumPainterVariants.double]: {
                processorType: enumItemProcessorTypes.painterDouble,
                processorHandler: "process_PAINTER_DOUBLE",
                slot: {
                    direction: enumDirection.top,
                    pos: new Vector(0, 0),
                },
            },
            [enumPainterVariants.quad]: {
                processorType: enumItemProcessorTypes.painterQuad,
                processorHandler: "process_PAINTER_QUAD",
                slot: {
                    direction: enumDirection.top,
                    pos: new Vector(2, 0),
                },
            },
        },
    ]);
}
