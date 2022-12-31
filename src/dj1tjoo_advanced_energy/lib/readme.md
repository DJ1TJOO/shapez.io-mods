<h1 align="center">Welcome to Advanced Energy 👋</h1>
<p>
  <a href="https://www.npmjs.com/package/@dj1tjoo/shapez-advanced-energy" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/@dj1tjoo/shapez-advanced-energy.svg">
  </a>
</p>

> The shapez energy api

## About

To have less conflicts between mods and energy an api was created. This api makes use of a network system. All transfers within a network are instant.

## Developing using the api

The api has a npm package [@dj1tjoo/shapez-advanced-energy](https://www.npmjs.com/package/@dj1tjoo/shapez-advanced-energy). This package contains helper funtion you can use in your mod.

The package exports the AdvancedEnergy class. On this class are static methods to help you

The AdvancedEnergy class exposes the api Components
| Component | Usage |
| ------------------------------------ | -------------------------------------------------------------------- |
| EnergyConnectorComponent | A component to make connections with in a newtwork (E.g. simple connector, storage) |
| EnergyPinComponent | A component to take and add energy to a network (E.g. energy producer, building that uses energy)|

<br />
The AdvancedEnergy class has the following methods

| Method                               | Usage                                                                |
| ------------------------------------ | -------------------------------------------------------------------- |
| requireInstalled(): void             | Shows a dialog on the main menu when the energy mod is not installed |
| isInstalled(): boolean               | Returns if the energy mod is installed                               |
| getMod(): AdvancedEnergyMod \| null; | Returns the energy mod instance                                      |
| getVersion(): string \| null;        | Returns the version of the energy mod instance                       |
| enableDebug(): void                  | Enables debug rendering on connectors                                |
| disableDebug(): void                 | Disables debug rendering on connectors                               |
