import { enumDirection, enumDirectionToVector, enumInvertedDirections, Vector } from "shapez/core/vector";
import { TurbineComponent } from "../../components/turbine";

/**
 * Finds surrounding entities which are not yet assigned to a network
 * @param {import("shapez/game/root").GameRoot} root
 * @param {import("shapez/core/draw_parameters").Rectangle} tileSpaceBounds
 * @param {Vector} initialTile
 * @param {Array<enumDirection>} directions
 * @returns {Array<import("shapez/game/entity").Entity>}
 */
export function findSurroundingTargets(root, tileSpaceBounds, initialTile, directions) {
    let result = [];

    const offsets = calculateOffsets(tileSpaceBounds, initialTile, directions);

    // Go over all directions we should search for
    for (let i = 0; i < offsets.length; ++i) {
        const { initialSearchTile } = offsets[i];

        // First, find the initial connected entities
        const initialContents = root.map.getLayersContentsMultipleXY(
            initialSearchTile.x,
            initialSearchTile.y
        );

        for (let k = 0; k < initialContents.length; ++k) {
            const entity = initialContents[k];

            /** @type {TurbineComponent} */
            const turbineComp = entity.components["Turbine"];

            if (turbineComp) {
                if (!turbineComp.linkedNetwork) {
                    result.push(entity);
                }
            }
        }
    }

    return result;
}

/**
 * Calculates all the tiles to check
 * @param {import("shapez/core/draw_parameters").Rectangle} tileSpaceBounds
 * @param {Vector} initialTile
 * @param {Array<enumDirection>} directions
 * @returns {Array<{
 *  direction: import("shapez/core/vector").enumDirection,
 *  initialSearchTile: import("shapez/core/vector").Vector
 * }>}
 */
function calculateOffsets(tileSpaceBounds, initialTile, directions) {
    const allOffsets = [];

    if (!initialTile) {
        for (let x = 0; x < tileSpaceBounds.w; ++x) {
            allOffsets.push({
                initialSearchTile: new Vector(x + tileSpaceBounds.x, -1 + tileSpaceBounds.y),
                direction: enumDirection.top,
            });
            allOffsets.push({
                initialSearchTile: new Vector(x + tileSpaceBounds.x, tileSpaceBounds.h + tileSpaceBounds.y),
                direction: enumDirection.bottom,
            });
        }
        for (let y = 0; y < tileSpaceBounds.h; ++y) {
            allOffsets.push({
                initialSearchTile: new Vector(-1 + tileSpaceBounds.x, y + tileSpaceBounds.y),
                direction: enumDirection.left,
            });
            allOffsets.push({
                initialSearchTile: new Vector(tileSpaceBounds.w + tileSpaceBounds.x, y + tileSpaceBounds.y),
                direction: enumDirection.right,
            });
        }
    } else {
        for (let i = 0; i < directions.length; i++) {
            const direction = directions[i];
            const offset = enumDirectionToVector[direction];
            const initialSearchTile = initialTile.add(offset);
            allOffsets.push({ direction: directions[i], initialSearchTile });
        }
    }

    return allOffsets.filter(x => directions.includes(x.direction));
}
