<h1 align="center">Welcome to Toolbar Switcher 👋</h1>
<p>
  <a href="https://www.npmjs.com/package/@dj1tjoo/shapez-toolbar-switcher" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/@dj1tjoo/shapez-toolbar-switcher.svg">
  </a>
</p>

> The shapez toolbar api

## About

To have less conflicts between mods and toolbars an api was created.

## Developing using the api

The api has a npm package [@dj1tjoo/shapez-toolbar-switcher](https://www.npmjs.com/package/@dj1tjoo/shapez-toolbar-switcher). This package contains helper funtion you can use in your mod.

The package exports the ToolbarSwitcher class. On this class are static methods to help you

The ToolbarSwitcher class has the following methods. The methods with a `*` can only be accessed after the preload state. You can use `onLoaded` to make a callback from when the preload state is over.

| Method                                                                                                                                   | Usage                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| requireInstalled(): void                                                                                                                 | Shows a dialog on the main menu when the toolbar switcher mod is not installed |
| registerToolbar(id: string, toolbar: typeof HUDBaseToolbar, isVisible?: boolean): void                                                   | Registers a new toolbar if the toolbar switcher mod is installed               |
| addNewBuildingToToolbar({ toolbar: string, location: primary \| secondary, metaClass: MetaBuilding, fallback?: regular \| wires }): void | Registers a new building to a toolbar                                          |
| `*` isInstalled(): boolean                                                                                                               | Returns if the toolbar switcher mod is installed                               |
| `*` getMod(): AdvancedEnergyMod \| null;                                                                                                 | Returns the toolbar switcher mod instance                                      |
| `*` getVersion(): string \| null;                                                                                                        | Returns the version of the toolbar switcher mod instance                       |
| onLoaded(cb: (installed: boolean) => void): void                                                                                         | Register to run callback on toolbar switcher loaded                            |
| enableDebug(): void                                                                                                                      | Enables debug rendering on connectors                                          |
| disableDebug(): void                                                                                                                     | Disables debug rendering on connectors                                         |

### Usage examples

The example uses the [shapez cli](https://www.npmjs.com/package/create-shapezio-mod). All the `shapez` imports can be swapped out for their `shapez.` equivalent

#### Registering a toolbar

```js
import { HUDBaseToolbar } from "shapez/game/hud/parts/base_toolbar";

export class MyToolbar extends HUDBaseToolbar {
    constructor(root) {
        super(root, {
            primaryBuildings: [],
            secondaryBuildings: [],
            visibilityCondition: () =>
                !this.root.camera.getIsMapOverlayActive() && this.root.currentLayer === "regular",
            htmlElementId: "ingame_HUD_my_toolbar",
            layer: "regular",
        });
    }
}
```

Don't forget to change the layer if nessesary and to give the toolbar a z-index

```css
#ingame_HUD_my_toolbar {
    z-index: 400;
}
```

In mod init():

```js
ToolbarSwitcher.registerToolbar("myToolbar", MyToolbar);
```

#### Registering a building to a toolbar

In mod init():

```js
ToolbarSwitcher.addNewBuildingToToolbar({
    location: "primary",
    toolbar: "myToolbar",
    metaClass: MetaMyBuilding,
    fallback: "regular",
});
```
