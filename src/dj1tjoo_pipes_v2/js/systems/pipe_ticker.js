import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { PipeTickerComponent } from "../components/pipe_ticker";

export class PipeTickerSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [PipeTickerComponent]);
    }

    update() {
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];

            /** @type {PipeTickerComponent} */
            const ticker = entity.components["PipeTicker"];

            if (!entity.components["PipePin"]) continue;

            /** @type {import("@dj1tjoo/shapez-pipes/lib/js/components/pipe_pin").PipePinSlot[]} */
            const slots = entity.components["PipePin"].slots;

            for (let i = 0; i < slots.length; i++) {
                const slot = slots[i];
                const buffer = ticker.delayedBuffer[i];
                if (!buffer) continue;

                const delayed = Math.min(slot.maxProduction, buffer);
                ticker.delayedBuffer[i] -= delayed;
                slot.buffer += delayed;
            }
        }
    }
}
