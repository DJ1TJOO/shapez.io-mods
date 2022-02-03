import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { ExtractorComponent } from "../components/extractor";

export class ExtractorSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [ExtractorComponent]);
    }

    update() {
        // Set signals
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            // @ts-ignore
            const extractorComp = entity.components.Extractor;
            // @ts-ignore
            const pinsComp = entity.components.PipedPins;

            if (pinsComp) {
                pinsComp.slots[0].pressure = extractorComp.pressure;
                // On action remove volume
                // pinsComp.slots[0].linkedNetwork.currentVolume -= 10;
            }
        }
    }
}
