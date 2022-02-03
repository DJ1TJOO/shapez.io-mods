import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { PumpComponent } from "../components/pump";

export class PumpSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [PumpComponent]);
    }

    update() {
        // Set signals
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            // @ts-ignore
            const pumpComp = entity.components.Pump;
            // @ts-ignore
            const pinsComp = entity.components.PipedPins;

            if (pinsComp) {
                pinsComp.slots[0].pressure = pumpComp.pressure;
                pinsComp.slots[0].fluid = pumpComp.fluid;

                // On action (in this case extract from tile) add volume
                pinsComp.slots[0].linkedNetwork.currentVolume += 10;
            }
        }
    }
}
