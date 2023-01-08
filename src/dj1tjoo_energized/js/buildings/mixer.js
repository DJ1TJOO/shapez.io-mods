import { addAcceptor } from "../addAcceptor";
import { enumDirection, Vector } from "shapez/core/vector";
import { MetaMixerBuilding } from "shapez/game/buildings/mixer";
import { enumItemProcessorTypes } from "shapez/game/components/item_processor";
import { defaultBuildingVariant } from "shapez/game/meta_building";

export function mixer(mod) {
    addAcceptor.apply(mod, [
        MetaMixerBuilding,
        {
            [defaultBuildingVariant]: {
                processorType: enumItemProcessorTypes.mixer,
                processorHandler: "process_MIXER",
                slot: {
                    direction: enumDirection.left,
                    pos: new Vector(0, 0),
                },
            },
        },
    ]);
}
