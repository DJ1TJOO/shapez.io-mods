import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { EnergyTickerComponent } from "../components/energy_ticker";

export class EnergyTickerSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [EnergyTickerComponent]);
    }

    update() {
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];

            /** @type {EnergyTickerComponent} */
            const ticker = entity.components["EnergyTicker"];

            if (!entity.components["EnergyPin"]) continue;

            /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinSlot[]} */
            const slots = entity.components["EnergyPin"].slots;

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
