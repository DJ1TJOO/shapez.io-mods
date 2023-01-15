import { generateMatrixRotations } from "shapez/core/utils";

/** @enum {string} */
export const enumConnectorType = {
    forward: "forward",
    turn: "turn",
    split: "split",
    cross: "cross",
    stub: "stub",
};

export const arrayConnectorRotationVariantToType = [
    enumConnectorType.forward,
    enumConnectorType.turn,
    enumConnectorType.split,
    enumConnectorType.cross,
    enumConnectorType.stub,
];

export const connectorOverlayMatrices = {
    [enumConnectorType.forward]: generateMatrixRotations([0, 1, 0, 0, 1, 0, 0, 1, 0]),
    [enumConnectorType.split]: generateMatrixRotations([0, 0, 0, 1, 1, 1, 0, 1, 0]),
    [enumConnectorType.turn]: generateMatrixRotations([0, 0, 0, 0, 1, 1, 0, 1, 0]),
    [enumConnectorType.cross]: generateMatrixRotations([0, 1, 0, 1, 1, 1, 0, 1, 0]),
    [enumConnectorType.stub]: generateMatrixRotations([0, 1, 0, 0, 1, 0, 0, 1, 0]),
};
