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

The Pipes class exposes the api Components
| Component | Usage |
| ------------------------------------ | -------------------------------------------------------------------- |
| PipeConnectorComponent | A component to make connections with in a newtwork (E.g. simple connector, storage) |
| PipePinComponent | A component to take and add fluids to a network (E.g. fluid producer, building that uses fluid)|
| BaseFluid | The base for creating a new fluid|

<br />
The Pipes class has the following methods

| Method                               | Usage                                                               |
| ------------------------------------ | ------------------------------------------------------------------- |
| requireInstalled(): void             | Shows a dialog on the main menu when the pipes mod is not installed |
| isInstalled(): boolean               | Returns if the pipes mod is installed                               |
| getMod(): AdvancedEnergyMod \| null; | Returns the pipes mod instance                                      |
| getVersion(): string \| null;        | Returns the version of the pipes mod instance                       |
| enableDebug(): void                  | Enables debug rendering on connectors                               |
| disableDebug(): void                 | Disables debug rendering on connectors                              |
