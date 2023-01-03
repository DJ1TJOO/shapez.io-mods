import { gComponentRegistry } from "shapez/core/global_registries";

/**
 * When multiple mods have the same component use this function to get it.
 * @this {import("shapez/mods/mod").Mod}
 * @param {typeof import("shapez/game/component").Component} component
 */
export function getComponentShared(id, ...params) {
    return new (gComponentRegistry.findById(id))(...params);
}
