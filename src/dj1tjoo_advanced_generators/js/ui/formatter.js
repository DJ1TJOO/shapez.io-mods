import { T } from "shapez/translations";

// function nFormatter(num, digits) {
//     const lookup = [
//         { value: 1, symbol: "" },
//         { value: 1e3, symbol: "k" },
//         { value: 1e6, symbol: "M" },
//         { value: 1e9, symbol: "G" },
//         { value: 1e12, symbol: "T" },
//         { value: 1e15, symbol: "P" },
//         { value: 1e18, symbol: "E" },
//     ];
//     const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
//     var item = lookup
//         .slice()
//         .reverse()
//         .find(function (item) {
//             return num >= item.value;
//         });
//     return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
// }

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
                  Intl.NumberFormat("en", { notation: "compact" }).format(speed).replace(".", separator)
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
        : T.advanced_generators.ae.replace(
              "<x>",
              Intl.NumberFormat("en", { notation: "compact" }).format(amount).replace(".", separator)
          );
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
                  Intl.NumberFormat("en", { notation: "compact" }).format(speed).replace(".", separator)
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
        : T.advanced_generators.l.replace(
              "<x>",
              Intl.NumberFormat("en", { notation: "compact" }).format(amount).replace(".", separator)
          );
}
