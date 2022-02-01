import { Loader } from "shapez/core/loader";
import { STOP_PROPAGATION } from "shapez/core/signal";
import { Vector } from "shapez/core/vector";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { PipedPinsComponent, enumPinSlotType } from "../components/pipe_pins";

/** @type {Object<ItemType, number>} */
const enumTypeToSize = {
    boolean: 9,
    shape: 9,
    color: 14,
};

export class PipedPinsSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [PipedPinsComponent]);

        this.pinSprites = {
            [enumPinSlotType.logicalEjector]: Loader.getSprite("sprites/pipes/logical_ejector.png"),
            [enumPinSlotType.logicalAcceptor]: Loader.getSprite("sprites/pipes/logical_acceptor.png"),
        };

        this.root.signals.prePlacementCheck.add(this.prePlacementCheck, this);
        this.root.signals.freeEntityAreaBeforeBuild.add(this.freeEntityAreaBeforeBuild, this);
    }

    /**
     * Performs pre-placement checks
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     * @param {Vector} offset
     */
    prePlacementCheck(entity, offset) {
        // Compute area of the building
        const rect = entity.components.StaticMapEntity.getTileSpaceBounds();
        if (offset) {
            rect.x += offset.x;
            rect.y += offset.y;
        }

        // If this entity is placed on the pipes layer, make sure we don't
        // place it above a pin
        if (entity.layer === "regular") {
            for (let x = rect.x; x < rect.x + rect.w; ++x) {
                for (let y = rect.y; y < rect.y + rect.h; ++y) {
                    // Find which entities are in same tiles of both layers
                    const entities = this.root.map.getLayersContentsMultipleXY(x, y);
                    for (let i = 0; i < entities.length; ++i) {
                        const otherEntity = entities[i];

                        // Check if entity has a piped component
                        // @ts-ignore
                        const pinComponent = otherEntity.components.PipedPins;
                        const staticComp = otherEntity.components.StaticMapEntity;
                        if (!pinComponent) {
                            continue;
                        }

                        if (staticComp.getMetaBuilding().getIsReplaceable()) {
                            // Don't mind here, even if there would be a collision we
                            // could replace it
                            continue;
                        }

                        // Go over all pins and check if they are blocking
                        const pins = pinComponent.slots;
                        for (let pinSlot = 0; pinSlot < pins.length; ++pinSlot) {
                            const pos = staticComp.localTileToWorld(pins[pinSlot].pos);
                            // Occupied by a pin
                            if (pos.x === x && pos.y === y) {
                                return STOP_PROPAGATION;
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Called to free space for the given entity
     * @param {import("shapez/savegame/savegame_typedefs").Entity} entity
     */
    freeEntityAreaBeforeBuild(entity) {
        // @ts-ignore
        const pinsComp = entity.components.PipedPins;
        if (!pinsComp) {
            // Entity has no pins
            return;
        }

        // Remove any stuff which collides with the pins
        for (let i = 0; i < pinsComp.slots.length; ++i) {
            const slot = pinsComp.slots[i];
            const worldPos = entity.components.StaticMapEntity.localTileToWorld(slot.pos);
            const collidingEntity = this.root.map.getLayerContentXY(worldPos.x, worldPos.y, "pipes");
            if (collidingEntity) {
                assertAlways(
                    collidingEntity.components.StaticMapEntity.getMetaBuilding().getIsReplaceable(),
                    "Tried to replace non-repleaceable entity for pins"
                );
                if (!this.root.logic.tryDeleteBuilding(collidingEntity)) {
                    assertAlways(false, "Tried to replace non-repleaceable entity for pins #2");
                }
            }
        }
    }
}
