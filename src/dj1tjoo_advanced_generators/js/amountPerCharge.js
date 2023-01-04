import { enumItemProcessorTypes } from "shapez/game/components/item_processor";

/**
 * Calculate the amount produced/consumed per process charge
 * @param {import("shapez/game/root").GameRoot} root
 * @param {number} amount
 * @param {import("shapez/game/components/item_processor").enumItemProcessorTypes} process
 * @returns
 */
export const amountPerCharge = (root, amount, process) => {
    const speed =
        root.hubGoals.getProcessorBaseSpeed(enumItemProcessorTypes[process]) /
        root.app.settings.getDesiredFps();

    return amount / speed;
};
