import { gComponentRegistry } from "shapez/core/global_registries";
import { MODS_ADDITIONAL_SYSTEMS } from "shapez/game/game_system_manager";

/**
 * When multiple mods have the same component use this function to register it. It needs a mod class bind
 * @this {import("shapez/mods/mod").Mod}
 * @param {typeof import("shapez/game/component").Component} component
 */
export function registerComponentShared(component) {
    if (gComponentRegistry.hasId(component.getId())) return;
    this.modInterface.registerComponent(component);
}

/**
 * When multiple mods have the same system use this function to register it. It needs a mod class bind
 * @this {import("shapez/mods/mod").Mod}
 * @param {Object} param0
 * @param {string} param0.id
 * @param {new (any) => import("shapez/game/game_system").GameSystem} param0.systemClass
 * @param {string=} param0.before
 * @param {string[]=} param0.drawHooks
 */
export function registerSystemShared({ id, systemClass, before, drawHooks }) {
    for (const key in MODS_ADDITIONAL_SYSTEMS) {
        if (!MODS_ADDITIONAL_SYSTEMS[key]) continue;
        if (!MODS_ADDITIONAL_SYSTEMS[key].some(x => x.id === id)) continue;

        return;
    }

    this.modInterface.registerGameSystem({ id, systemClass, before, drawHooks });
}
