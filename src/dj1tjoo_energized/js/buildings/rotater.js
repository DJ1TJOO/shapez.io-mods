import { addAcceptor } from "../addAcceptor";
import { enumDirection, Vector } from "shapez/core/vector";
import { enumRotaterVariants, MetaRotaterBuilding } from "shapez/game/buildings/rotater";
import { enumItemProcessorTypes } from "shapez/game/components/item_processor";
import { defaultBuildingVariant } from "shapez/game/meta_building";

export function rotater(mod) {
    addAcceptor.apply(mod, [
        MetaRotaterBuilding,
        {
            [defaultBuildingVariant]: {
                processorType: enumItemProcessorTypes.rotater,
                processorHandler: "process_ROTATER",
                slot: {
                    direction: enumDirection.left,
                    pos: new Vector(0, 0),
                },
            },
            [enumRotaterVariants.ccw]: {
                processorType: enumItemProcessorTypes.rotaterCCW,
                processorHandler: "process_ROTATER_CCW",
                slot: {
                    direction: enumDirection.left,
                    pos: new Vector(0, 0),
                },
            },
            [enumRotaterVariants.rotate180]: {
                processorType: enumItemProcessorTypes.rotater180,
                processorHandler: "process_ROTATER_180",
                slot: {
                    direction: enumDirection.left,
                    pos: new Vector(0, 0),
                },
            },
        },
    ]);
}
