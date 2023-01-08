import { addAcceptor } from "../addAcceptor";
import { enumDirection, Vector } from "shapez/core/vector";
import { MetaStackerBuilding } from "shapez/game/buildings/stacker";
import { enumItemProcessorTypes } from "shapez/game/components/item_processor";
import { defaultBuildingVariant } from "shapez/game/meta_building";

export function stacker(mod) {
    addAcceptor.apply(mod, [
        MetaStackerBuilding,
        {
            [defaultBuildingVariant]: {
                processorType: enumItemProcessorTypes.stacker,
                processorHandler: "process_STACKER",
                slot: {
                    direction: enumDirection.left,
                    pos: new Vector(0, 0),
                },
            },
        },
    ]);
}
