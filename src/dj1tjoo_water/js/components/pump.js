import { Component } from "shapez/game/component";

const chainBufferSize = 6;

export class PumpComponent extends Component {
    static getId() {
        return "Pump";
    }

    // static getSchema() {
    //     // cachedMinedItem is not serialized.
    //     return {
    //         fluidChainBuffer: types.array(typeItemSingleton),
    //         cachedPumpedFluid: types.nullable(typeItemSingleton),
    //     };
    // }

    constructor() {
        super();
        this.chainable = true;

        /**
         * @type {import("shapez/core/global_registries").BaseItem}
         */
        this.cachedPumpedFluid = null;

        /**
         * @type {Array<import("shapez/savegame/savegame_typedefs").Entity>}
         */
        this.pumpConnections = [];

        /**
         * @type {Array<import("shapez/savegame/savegame_typedefs").Entity>}
         */
        this.pipeConnections = [];

        this.pressure = 0;
    }
}
