import { round2Digits } from "shapez/core/utils";
import { T } from "shapez/translations";

/**
 * Formats a number like 2.51 to "2.51 flux / s"
 * @param {number} speed
 * @param {boolean=} double
 * @param {string=} separator The decimal separator for numbers like 50.1 (separator='.')
 */
export function formatFluxPerSecond(speed, double = false, separator = T.global.decimalSeparator) {
    return (
        (speed === 1.0
            ? T.advaned_generators.oneFluxPerSecond
            : T.advaned_generators.fluxPerSecond.replace(
                  "<x>",
                  round2Digits(speed).toString().replace(".", separator)
              )) + (double ? "  " + T.ingame.buildingPlacement.infoTexts.itemsPerSecondDouble : "")
    );
}
