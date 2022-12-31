import { Loader } from "shapez/core/loader";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { BasicGeneratorComponent } from "../components/basic_generator";

export class BasicGeneratorSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [BasicGeneratorComponent]);

        this.sprites = [
            Loader.getSprite("sprites/buildings/basic_generator_0.png"),
            Loader.getSprite("sprites/buildings/basic_generator_1.png"),
            Loader.getSprite("sprites/buildings/basic_generator_2.png"),
            Loader.getSprite("sprites/buildings/basic_generator_3.png"),
        ];
    }

    update() {
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];

            /** @type {import("../components/basic_generator").BasicGeneratorComponent} */
            const genComp = entity.components["BasicGenerator"];
            /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent} */
            const pinComp = entity.components["EnergyPin"];

            const connectedSlots = pinComp.slots.filter(x => x.linkedNetwork && x.type === "ejector");

            let fluxGenerated = 0;
            if (genComp.generations > 0) {
                fluxGenerated += genComp.production;
                genComp.generations--;
            }

            // Divide generated over all slots
            for (let i = 0; i < connectedSlots.length; i++) {
                const slot = connectedSlots[i];
                slot.buffer += fluxGenerated / connectedSlots.length;
            }
        }
    }

    /**
     * Draws a given chunk
     * @param {import("shapez/core/draw_utils").DrawParameters} parameters
     * @param {import("shapez/game/map_chunk_view").MapChunkView} chunk
     */
    drawChunk(parameters, chunk) {
        const contents = chunk.containedEntitiesByLayer.regular;

        for (let i = 0; i < contents.length; ++i) {
            const entity = contents[i];

            const processorComp = entity.components.ItemProcessor;
            if (!processorComp || (processorComp.ongoingCharges.length < 1 && processorComp.inputCount < 1))
                continue;

            /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent} */
            const pinComp = entity.components["EnergyPin"];
            if (!pinComp) continue;

            const connectedSlots = pinComp.slots.filter(x => x.linkedNetwork && x.type === "ejector");
            if (
                connectedSlots.length < 1 ||
                !connectedSlots.some(x => x.buffer < x.maxBuffer) ||
                connectedSlots.every(x => x.linkedNetwork.currentVolume === x.linkedNetwork.maxVolume)
            )
                continue;

            const animationIndex = Math.floor(this.root.time.realtimeNow() * 2);

            const index = animationIndex % (this.sprites.length + 1);
            if (index === this.sprites.length) continue;

            const sprite = this.sprites[index];
            entity.components.StaticMapEntity.drawSpriteOnBoundsClipped(parameters, sprite, 2);
        }
    }
}
