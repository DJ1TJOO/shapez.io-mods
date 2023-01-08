import { addAcceptor } from "../addAcceptor";
import { enumDirection, Vector } from "shapez/core/vector";
import { enumCutterVariants, MetaCutterBuilding } from "shapez/game/buildings/cutter";
import { enumItemProcessorTypes } from "shapez/game/components/item_processor";
import { defaultBuildingVariant } from "shapez/game/meta_building";

export function cutter(mod) {
    addAcceptor.apply(mod, [
        MetaCutterBuilding,
        {
            [defaultBuildingVariant]: {
                processorType: enumItemProcessorTypes.cutter,
                processorHandler: "process_CUTTER",
                slot: {
                    direction: enumDirection.left,
                    pos: new Vector(0, 0),
                },
            },
            [enumCutterVariants.quad]: {
                processorType: enumItemProcessorTypes.cutterQuad,
                processorHandler: "process_CUTTER_QUAD",
                slot: {
                    direction: enumDirection.left,
                    pos: new Vector(0, 0),
                },
            },
        },
    ]);
}
