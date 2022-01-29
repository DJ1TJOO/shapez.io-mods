import { compressX64, decompressX64 } from "shapez/core/lzstring";
import { Signal } from "shapez/core/signal";
import { Vector } from "shapez/core/vector";
import { BaseItem } from "shapez/game/base_item";
import { BeltPath } from "shapez/game/belt_path";
import { getBuildingDataFromCode } from "shapez/game/building_codes";
import { Camera } from "shapez/game/camera";
import { Component } from "shapez/game/component";
import { BeltComponent } from "shapez/game/components/belt";
import { BeltReaderComponent } from "shapez/game/components/belt_reader";
import { BeltUnderlaysComponent } from "shapez/game/components/belt_underlays";
import { ConstantSignalComponent } from "shapez/game/components/constant_signal";
import { DisplayComponent } from "shapez/game/components/display";
import { FilterComponent } from "shapez/game/components/filter";
import { HubComponent } from "shapez/game/components/hub";
import { ItemAcceptorComponent } from "shapez/game/components/item_acceptor";
import { ItemEjectorComponent } from "shapez/game/components/item_ejector";
import { ItemProcessorComponent } from "shapez/game/components/item_processor";
import { ItemProducerComponent } from "shapez/game/components/item_producer";
import { LeverComponent } from "shapez/game/components/lever";
import { LogicGateComponent } from "shapez/game/components/logic_gate";
import { MinerComponent } from "shapez/game/components/miner";
import { StaticMapEntityComponent } from "shapez/game/components/static_map_entity";
import { StorageComponent } from "shapez/game/components/storage";
import { UndergroundBeltComponent } from "shapez/game/components/underground_belt";
import { WireComponent } from "shapez/game/components/wire";
import { WiredPinsComponent } from "shapez/game/components/wired_pins";
import { WireTunnelComponent } from "shapez/game/components/wire_tunnel";
import { Entity } from "shapez/game/entity";
import { EntityManager } from "shapez/game/entity_manager";
import { HubGoals } from "shapez/game/hub_goals";
import { BooleanItem } from "shapez/game/items/boolean_item";
import { ColorItem } from "shapez/game/items/color_item";
import { ShapeItem } from "shapez/game/items/shape_item";
import { BaseMap } from "shapez/game/map";
import { MapView } from "shapez/game/map_view";
import { ProductionAnalytics } from "shapez/game/production_analytics";
import { ShapeDefinition } from "shapez/game/shape_definition";
import { ShapeDefinitionManager } from "shapez/game/shape_definition_manager";
import { BaseGameSpeed } from "shapez/game/time/base_game_speed";
import { PausedGameSpeed } from "shapez/game/time/paused_game_speed";
import { RegularGameSpeed } from "shapez/game/time/regular_game_speed";
import { BasicSerializableObject, types } from "shapez/savegame/serialization";

/**
 * SerializedObject
 * @typedef {{
 *   serialized: Object,
 *   class: String,
 *   }} SerializedObject
 */

export const MultiplayerPacketTypes = {
    DATA: 0,
    FLAG: 1,
    SIGNAL: 2,
    TEXT: 3,
};

export class StringSerializable extends BasicSerializableObject {
    /**
     * @param {string} value
     */
    constructor(value) {
        super();
        this.value = value;
    }

    static getId() {
        return "string";
    }

    static getSchema() {
        return { value: types.string };
    }

    serialize() {
        return { value: this.value };
    }

    deserialize(data) {
        this.value = data.value;
    }
}

export class NumberSerializable extends BasicSerializableObject {
    /**
     * @param {number} value
     */
    constructor(value) {
        super();
        this.value = value;
    }

    static getId() {
        return "number";
    }

    static getSchema() {
        return { value: types.float };
    }

    serialize() {
        return { value: this.value };
    }

    deserialize(data) {
        this.value = data.value;
    }
}

export const MultiplayerPacketSerializableObject = {
    [BaseGameSpeed.name]: BaseGameSpeed,
    [BaseItem.name]: BaseItem,
    [BaseMap.name]: BaseMap,
    [BeltComponent.name]: BeltComponent,
    [BeltPath.name]: BeltPath,
    [BeltReaderComponent.name]: BeltReaderComponent,
    [BeltUnderlaysComponent.name]: BeltUnderlaysComponent,
    [BooleanItem.name]: BooleanItem,
    [Camera.name]: Camera,
    [ColorItem.name]: ColorItem,
    [Component.name]: Component,
    [ConstantSignalComponent.name]: ConstantSignalComponent,
    [DisplayComponent.name]: DisplayComponent,
    [Entity.name]: Entity,
    [EntityManager.name]: EntityManager,
    [FilterComponent.name]: FilterComponent,
    [HubComponent.name]: HubComponent,
    [HubGoals.name]: HubGoals,
    [ItemAcceptorComponent.name]: ItemAcceptorComponent,
    [ItemEjectorComponent.name]: ItemEjectorComponent,
    [ItemProcessorComponent.name]: ItemProcessorComponent,
    [ItemProducerComponent.name]: ItemProducerComponent,
    [LeverComponent.name]: LeverComponent,
    [LogicGateComponent.name]: LogicGateComponent,
    [MapView.name]: MapView,
    [MinerComponent.name]: MinerComponent,
    [NumberSerializable.name]: NumberSerializable,
    [PausedGameSpeed.name]: PausedGameSpeed,
    [ProductionAnalytics.name]: ProductionAnalytics,
    [RegularGameSpeed.name]: RegularGameSpeed,
    [ShapeDefinition.name]: ShapeDefinition,
    [ShapeDefinitionManager.name]: ShapeDefinitionManager,
    [ShapeItem.name]: ShapeItem,
    [StaticMapEntityComponent.name]: StaticMapEntityComponent,
    [StorageComponent.name]: StorageComponent,
    [StringSerializable.name]: StringSerializable,
    [UndergroundBeltComponent.name]: UndergroundBeltComponent,
    [WireComponent.name]: WireComponent,
    [WiredPinsComponent.name]: WiredPinsComponent,
    [WireTunnelComponent.name]: WireTunnelComponent,
};

// Internal serializer methods
export class MultiplayerSerializerInternal {
    serializeEntityArray(array) {
        const serialized = [];
        for (let i = 0; i < array.length; ++i) {
            const entity = array[i];
            if (!entity.queuedForDestroy && !entity.destroyed) {
                serialized.push(entity.serialize());
            }
        }
        return serialized;
    }

    deserializeEntityArray(root, array) {
        for (let i = 0; i < array.length; ++i) {
            this.deserializeEntity(root, array[i]);
        }
    }

    deserializeEntity(root, payload) {
        const staticData = payload.components.StaticMapEntity;
        assert(staticData, "entity has no static data");

        const code = staticData.code;
        const data = getBuildingDataFromCode(code);

        const metaBuilding = data.metaInstance;

        const entity = metaBuilding.createEntity({
            root,
            origin: Vector.fromSerializedObject(staticData.origin),
            rotation: staticData.rotation,
            originalRotation: staticData.originalRotation,
            rotationVariant: data.rotationVariant,
            variant: data.variant,
        });

        entity.uid = payload.uid;
        this.deserializeComponents(root, entity, payload.components);
        return entity;
    }

    /////// COMPONENTS ////

    deserializeComponents(root, entity, data) {
        for (const componentId in data) {
            if (!entity.components[componentId]) {
                continue;
            }

            const errorStatus = entity.components[componentId].deserialize(data[componentId], root);
            if (errorStatus) {
                return errorStatus;
            }

            handleComponents(entity, root);
        }
    }
}

/**
 * @param {import('./multiplayer_peer').MultiplayerPeer} multiplayerPeer
 */
export function setupHandleComponents(multiplayerPeer, receiverId) {
    multiplayerPeer.ingameState.core.root.signals["constantSignalChange"].add(
        (entity, constantSignalComponent) => {
            const multiplayerId = multiplayerPeer.multiplayerConstantSignalChange.findIndex(origin =>
                origin.equals(entity.components.StaticMapEntity.origin)
            );
            if (multiplayerId > -1)
                return multiplayerPeer.multiplayerConstantSignalChange.splice(multiplayerId, 1);
            MultiplayerPacket.sendPacket(
                multiplayerPeer.socket,
                receiverId,
                new SignalPacket(SignalPacketSignals.entityComponentChanged, [
                    types.tileVector.serialize(entity.components.StaticMapEntity.origin),
                    constantSignalComponent,
                ])
            );
        }
    );

    multiplayerPeer.ingameState.core.root.signals["colorCodedChange"].add((entity, colorCodedComponent) => {
        const multiplayerId = multiplayerPeer.multiplayerColorCodedChange.findIndex(origin =>
            origin.equals(entity.components.StaticMapEntity.origin)
        );
        if (multiplayerId > -1) return multiplayerPeer.multiplayerColorCodedChange.splice(multiplayerId, 1);
        MultiplayerPacket.sendPacket(
            multiplayerPeer.socket,
            receiverId,
            new SignalPacket(SignalPacketSignals.entityComponentChanged, [
                types.tileVector.serialize(entity.components.StaticMapEntity.origin),
                colorCodedComponent,
            ])
        );
    });
}

export function setupHandleComponentsSignals(root) {
    root.signals["constantSignalChange"] = new Signal();
    root.signals["colorCodedChange"] = new Signal();
}

export function handleComponents(entity, root) {
    if (entity.components.ConstantSignal) {
        const constantSignalComponent = entity.components.ConstantSignal;
        const constantSignalChange = root.signals["constantSignalChange"];

        const component = new Proxy(constantSignalComponent, {
            set: (target, key, value) => {
                target[key] = value;
                constantSignalChange.dispatch(entity, target);
                return true;
            },
        });
        entity.components.ConstantSignal = component;
    }

    if (entity.components.ColorCoded) {
        const colorCodedComponent = entity.components.ColorCoded;

        const component = new Proxy(colorCodedComponent, {
            set: (target, key, value) => {
                target[key] = value;
                root.signals["colorCodedChange"].dispatch(entity, target);
                return true;
            },
        });
        entity.components.ColorCoded = component;
    }
}

export class MultiplayerPacket {
    constructor(type) {
        this.type = type;
    }

    /**
     * Sends the packet over a socket via the datachannel
     * @param {import("./multiplayer_peer").SocketInfo} socket
     * @param {MultiplayerPacket} packet
     * @param {Array} packet
     */
    static sendPacket(socket, receiverId, packet, connections = undefined) {
        this._packetsToSend.push(() => {
            if (!socket.socket.connected) return;
            try {
                socket.socket.emit("signal", {
                    receiverId: receiverId,
                    signal: JSON.stringify(packet),
                    senderId: socket.id,
                });
            } catch (error) {
                if (connections)
                    connections.splice(connections.indexOf(connections.find(x => x.socket === socket)), 1);
                console.log(error);
            }
        });

        if (this._packetsToSend.length <= 1) {
            this.sendNextPacket();
        }
    }

    static sendNextPacket() {
        if (this._packetsToSend.length < 1) return;

        this._packetsToSend[0]();
        this._packetsToSend.shift();
    }

    /**
     * Serializes data
     * @param {Array<BasicSerializableObject>} args
     * @returns {String}
     */
    static serialize(args) {
        const argsNew = [];
        for (let i = 0; i < args.length; i++) {
            const element = args[i];
            if (element.serialize) {
                argsNew.push({
                    serialized: element.serialize(),
                    class: element.constructor.name,
                });
            } else {
                argsNew.push({
                    serialized: element,
                    class: null,
                });
            }
        }
        return compressX64(JSON.stringify({ a: argsNew }));
    }

    /**
     * Deserializes data
     * @param {String} args
     * @returns {Array<BasicSerializableObject>}
     */
    static deserialize(args, root) {
        const argsNew = [];
        const decompressedArgs = JSON.parse(decompressX64(args)).a;

        for (let i = 0; i < decompressedArgs.length; i++) {
            const element = decompressedArgs[i];
            if (element.class === null) {
                argsNew.push(element.serialized);
            } else {
                // @ts-ignore
                let object = new MultiplayerPacketSerializableObject[element.class]({});
                if (object instanceof Entity)
                    object = new MultiplayerSerializerInternal().deserializeEntity(root, element.serialized);
                // @ts-ignore
                else object.deserialize(element.serialized, root);
                argsNew.push(object);
            }
        }

        return argsNew;
    }
}

/** @type {Array<Function>} */
MultiplayerPacket._packetsToSend = [];

export class DataPacket extends MultiplayerPacket {
    constructor(size, data) {
        super(MultiplayerPacketTypes.DATA);

        /** @type {number} */
        this.size = size;

        /** @type {number} */
        this.data = data;
    }

    /**
     *
     * @param {string} str
     * @param {number} size
     */
    static chunkSubstr(str, size) {
        const numChunks = Math.ceil(str.length / size);
        const chunks = new Array(numChunks);

        for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
            chunks[i] = str.substr(o, size);
        }

        return chunks;
    }

    /**
     *
     * @param {any} data
     * @param {number} size
     */
    static createFromData(data, size) {
        const chunks = this.chunkSubstr(JSON.stringify(data), size);
        const dataPackets = [];
        for (let i = 0; i < chunks.length; i++) dataPackets[i] = new DataPacket(size, chunks[i]);
        return dataPackets;
    }
}

export const FlagPacketFlags = {
    STARTDATA: 0,
    ENDDATA: 1,
    RECEIVED_PACKET: 2,
};

export class FlagPacket extends MultiplayerPacket {
    constructor(flag) {
        super(MultiplayerPacketTypes.FLAG);

        /** @type {number} */
        this.flag = flag;
    }
}

export const SignalPacketSignals = {
    entityManuallyPlaced: 0,
    entityAdded: 1,
    entityGotNewComponent: 2,
    entityComponentChanged: 3,
    entityComponentRemoved: 4,
    entityQueuedForDestroy: 5,
    entityDestroyed: 6,

    setTile: 7,

    storyGoalCompleted: 8,
    upgradePurchased: 9,

    shapeDelivered: 10,
    itemProduced: 11,
};

export class SignalPacket extends MultiplayerPacket {
    /**
     * Constructor of SignalPacket
     * @param {number} signal
     * @param {Array<Object>} args
     */
    constructor(signal, args) {
        super(MultiplayerPacketTypes.SIGNAL);

        /** @type {number} */
        this.signal = signal;

        /** @type {String} */
        this.args = MultiplayerPacket.serialize(args);
    }
}

export const TextPacketTypes = {
    USER_JOINED: 0,
    USER_DISCONNECTED: 1,
    USER_UPDATE: 2,
    HOST_USER: 3,
    MESSAGE: 4,
};

export class TextPacket extends MultiplayerPacket {
    /**
     * Constructor of TextPacket
     * @param {number} textType
     * @param {string} text
     */
    constructor(textType, text) {
        super(MultiplayerPacketTypes.TEXT);

        /** @type {number} */
        this.textType = textType;

        /** @type {string} */
        this.text = compressX64(text);
    }

    static decompress(text) {
        return decompressX64(text);
    }
}
