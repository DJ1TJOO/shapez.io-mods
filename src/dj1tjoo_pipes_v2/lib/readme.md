<h1 align="center">Welcome to Pipes 👋</h1>
<p>
  <a href="https://www.npmjs.com/package/@dj1tjoo/shapez-pipes" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/@dj1tjoo/shapez-pipes.svg">
  </a>
</p>

> The shapez pipe api

## About

To have less conflicts between mods and pipes an api was created. This api makes use of a network system. All transfers within a network are instant.

## Developing using the api

The api has a npm package [@dj1tjoo/shapez-pipes](https://www.npmjs.com/package/@dj1tjoo/shapez-pipes). This package contains helper funtion you can use in your mod.

The package exports the Pipes class. On this class are static methods to help you

The Pipes class exposes the api components. All the api components can only be accessed after the preload state. You can use `onLoaded` to make a callback from when the preload state is over.
| Component | Usage |
| ------------------------------------ | -------------------------------------------------------------------- |
| PipeConnectorComponent | A component to make connections with in a newtwork (E.g. simple connector, storage) |
| PipePinComponent | A component to take and add fluids to a network (E.g. fluid producer, building that uses fluid)|
| PipeTunnelComponent | A component to make connections with in a newtwork with other buildings in between |
| BaseFluid | The base for creating a new fluid|
| gFluidRegistry | Register the new fluid |
| typeFluidSingleton | The type for storing fluids|

The Pipes class has the following methods. The methods with a `*` can only be accessed after the preload state. You can use `onLoaded` to make a callback from when the preload state is over.

| Method                                                        | Usage                                                               |
| ------------------------------------------------------------- | ------------------------------------------------------------------- |
| requireInstalled(): void                                      | Shows a dialog on the main menu when the pipes mod is not installed |
| registerFluid(createFluidClass: () => typeof BaseFluid): void | Registers the fluid class created in the callback                   |
| `*` isInstalled(): boolean                                    | Returns if the pipes mod is installed                               |
| `*` getMod(): AdvancedEnergyMod \| null;                      | Returns the pipes mod instance                                      |
| `*` getVersion(): string \| null;                             | Returns the version of the pipes mod instance                       |
| onLoaded(cb: (installed: boolean) => void): void              | Register to run callback on pipes loaded                            |
| enableDebug(): void                                           | Enables debug rendering on connectors                               |
| disableDebug(): void                                          | Disables debug rendering on connectors                              |

### Fluid example

The example uses the [shapez cli](https://www.npmjs.com/package/create-shapezio-mod). All the `shapez` imports can be swapped out for their `shapez.` equivalent

```js
import { Pipes } from "@dj1tjoo/shapez-pipes";
import { globalConfig } from "shapez/core/config";
import { Loader } from "shapez/core/loader";

export const Water = Pipes.registerFluid(
    () =>
        class WaterFluid extends Pipes.BaseFluid {
            static getId() {
                return "water_fluid";
            }

            equalsImpl() {
                return true;
            }

            /**
             * Draws the item to a canvas
             * @param {CanvasRenderingContext2D} context
             * @param {number} size
             */
            drawFullSizeOnCanvas(context, size) {
                if (!this.cachedSprite) {
                    this.cachedSprite = Loader.getSprite("sprites/fluids/water.png");
                }
                this.cachedSprite.drawCentered(context, size / 2, size / 2, size);
            }

            /**
             * @param {number} x
             * @param {number} y
             * @param {number} diameter
             * @param {import("shapez/core/draw_utils").DrawParameters} parameters
             */
            // @ts-ignore
            drawItemCenteredClipped(x, y, parameters, diameter = globalConfig.defaultItemDiameter) {
                const realDiameter = diameter * 0.6;
                if (!this.cachedSprite) {
                    this.cachedSprite = Loader.getSprite("sprites/fluids/water.png");
                }
                this.cachedSprite.drawCachedCentered(parameters, x, y, realDiameter);
            }

            getBackgroundColorAsResource() {
                return "#2389DA";
            }
        }
);
```

The register will export a class with two static properties:
`SINGLETON` and `Class`. Use the `SINGLETON` for where you need to enter fluids (e.g. in a pipe pin slot)

### Adding a pipe pin

The `entity.addComponent` can be called in a buildings `setupEntityComponents`

```js
entity.addComponent(
    new Pipes.PipePinComponent({
        slots: [
            {
                direction: enumDirection.top,
                pos: new Vector(0, 0),
                type: "ejector",
                productionPerTick: 100,
                maxBuffer: 1000,
                fluid: Water.SINGLETON,
            },
            {
                direction: enumDirection.bottom,
                pos: new Vector(0, 0),
                type: "acceptor",
                consumptionPerTick: 100,
                maxBuffer: 1000,
                fluid: Steam.SINGLETON,
            },
        ],
    })
);
```
