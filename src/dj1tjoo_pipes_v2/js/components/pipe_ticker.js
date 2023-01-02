import { Component } from "shapez/game/component";

export class PipeTickerComponent extends Component {
    static getId() {
        return "PipeTicker";
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
