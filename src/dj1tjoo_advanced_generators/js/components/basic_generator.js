import { Component } from "shapez/game/component";

export class BasicGeneratorComponent extends Component {
    static getId() {
        return "BasicGenerator";
    }

    /**
     * @param {{production: number}} param0
     */
    constructor({ production }) {
        super();
        this.generations = 0;
        this.production = production;
    }

    queueGeneration() {
        this.generations++;
    }
}
