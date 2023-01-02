import { Component } from "shapez/game/component";

export class EnergyTickerComponent extends Component {
    static getId() {
        return "EnergyTicker";
    }

    constructor() {
        super();

        this.delayedBuffer = {};
    }

    getBuffer(slot) {
        return this.delayedBuffer[slot] || 0;
    }

    addToBuffer(slot, amount) {
        if (!this.delayedBuffer[slot]) {
            this.delayedBuffer[slot] = 0;
        }

        this.delayedBuffer[slot] += amount;
    }
}
