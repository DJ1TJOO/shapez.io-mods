import { round2Digits } from "shapez/core/utils";
import { T } from "shapez/translations";

/**
 * Formats a number like 2.51 to "2.51 AE/t"
 * @param {number} speed
 * @param {boolean=} double
 * @param {string=} separator The decimal separator for numbers like 50.1 (separator='.')
 */
export function formatAePerTick(speed, double = false, separator = T.global.decimalSeparator) {
    return (
        (speed === 1.0
            ? T.advanced_generators.oneAePerTick
            : T.advanced_generators.aePerTick.replace(
                  "<x>",
                  round2Digits(speed).toString().replace(".", separator)
              )) + (double ? "  " + T.ingame.buildingPlacement.infoTexts.itemsPerSecondDouble : "")
    );
}

/**
 * Formats a number like 2.51 to "2.51 AE"
 * @param {number} amount
 * @param {string=} separator The decimal separator for numbers like 50.1 (separator='.')
 */
export function formatAe(amount, separator = T.global.decimalSeparator) {
    return amount === 1.0
        ? T.advanced_generators.ae.replace("<x>", 1)
        : T.advanced_generators.ae.replace("<x>", round2Digits(amount).toString().replace(".", separator));
}

/**
 * Formats a number like 2.51 to "2.51 L/t"
 * @param {number} speed
 * @param {boolean=} double
 * @param {string=} separator The decimal separator for numbers like 50.1 (separator='.')
 */
export function formatLPerTick(speed, double = false, separator = T.global.decimalSeparator) {
    return (
        (speed === 1.0
            ? T.advanced_generators.oneLPerTick
            : T.advanced_generators.lPerTick.replace(
                  "<x>",
                  round2Digits(speed).toString().replace(".", separator)
              )) + (double ? "  " + T.ingame.buildingPlacement.infoTexts.itemsPerSecondDouble : "")
    );
}

/**
 * Formats a number like 2.51 to "2.51 L"
 * @param {number} amount
 * @param {string=} separator The decimal separator for numbers like 50.1 (separator='.')
 */
export function formatL(amount, separator = T.global.decimalSeparator) {
    return amount === 1.0
        ? T.advanced_generators.l.replace("<x>", 1)
        : T.advanced_generators.l.replace("<x>", round2Digits(amount).toString().replace(".", separator));
}
