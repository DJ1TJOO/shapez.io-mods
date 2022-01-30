import { globalConfig } from "shapez/core/config";
import { DrawParameters } from "shapez/core/draw_parameters";
import { drawRotatedSprite } from "shapez/core/draw_utils";
import { gMetaBuildingRegistry } from "shapez/core/global_registries";
import { InputReceiver } from "shapez/core/input_receiver";
import { Loader } from "shapez/core/loader";
import { makeDiv, removeAllChildren } from "shapez/core/utils";
import {
    enumDirection,
    enumDirectionToAngle,
    enumDirectionToVector,
    enumInvertedDirections,
    Vector,
} from "shapez/core/vector";
import { getCodeFromBuildingData } from "shapez/game/building_codes";
import { enumColors, enumColorToShortcode } from "shapez/game/colors";
import { StaticMapEntityComponent } from "shapez/game/components/static_map_entity";
import { Entity } from "shapez/game/entity";
import { BaseHUDPart } from "shapez/game/hud/base_hud_part";
import { DynamicDomAttach } from "shapez/game/hud/dynamic_dom_attach";
import { GameHUD } from "shapez/game/hud/hud";
import { HUDGameMenu } from "shapez/game/hud/parts/game_menu";
import { enumNotificationType } from "shapez/game/hud/parts/notifications";
import { COLOR_ITEM_SINGLETONS } from "shapez/game/items/color_item";
import { KeyActionMapper, KEYMAPPINGS } from "shapez/game/key_action_mapper";
import { MetaBuilding } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import { Mod } from "shapez/mods/mod";
import { T } from "shapez/translations";
import { getExternalMod, getMod } from "../getMod";
import {
    MultiplayerPacket,
    MultiplayerPacketTypes,
    TextPacket,
    TextPacketTypes,
} from "./multiplayer_packets";

export class MultiplayerHUD extends BaseHUDPart {
    createElements(parent) {
        this.background = makeDiv(parent, "ingame_HUD_Multiplayer", ["ingameDialog"]);

        // DIALOG Inner / Wrapper
        this.dialogInner = makeDiv(this.background, null, ["dialogInner"]);
        this.title = makeDiv(this.dialogInner, null, ["title"], T.multiplayer.players);
        this.closeButton = makeDiv(this.title, null, ["closeButton"]);
        this.trackClicks(this.closeButton, this.close);

        this.contentDiv = makeDiv(this.dialogInner, null, ["content"]);
    }

    isBlockingOverlay() {
        return this.visible;
    }

    show() {
        this.visible = true;
        this.root.app.inputMgr.makeSureAttachedAndOnTop(this.inputReciever);
        this.rerenderFull();
        this.update();
    }

    close() {
        this.visible = false;
        this.root.app.inputMgr.makeSureDetached(this.inputReciever);
        this.update();
    }

    initialize() {
        /**
         * @type {import("../states/multiplayer_ingame").InMultiplayerGameState}
         */
        // @ts-ignore
        this.ingameState = this.root.gameState;
        this.lastTimeUpdated = Date.now();
        const colored = getExternalMod("dengr1065:colorcoded");
        if (colored) {
            // @ts-ignore
            this.coloredComponent = new colored.component({});
        } else {
            this.coloredComponent = null;
        }

        this.domAttach = new DynamicDomAttach(this.root, this.background, {
            attachClass: "visible",
        });

        this.inputReciever = new InputReceiver("friends");
        this.keyActionMapper = new KeyActionMapper(this.root, this.inputReciever);

        this.keyActionMapper.getBinding(KEYMAPPINGS.general.back).add(this.close, this);
        this.keyActionMapper.getBinding(KEYMAPPINGS.ingame.menuClose).add(this.close, this);

        this.close();
    }

    rerenderFull() {
        if (!this.ingameState || !this.ingameState.socket || !this.ingameState.socket.users) return;

        removeAllChildren(this.contentDiv);

        const user = this.ingameState.socket.user;

        const element = document.createElement("div");

        // Create color
        const shapeCanvas = document.createElement("canvas");
        shapeCanvas.width = 100;
        shapeCanvas.height = 100;
        COLOR_ITEM_SINGLETONS[user.color].drawFullSizeOnCanvas(shapeCanvas.getContext("2d"), 100);
        shapeCanvas.classList.add("icon");
        element.appendChild(shapeCanvas);

        const name = document.createElement("span");
        name.classList.add("counter");
        name.innerHTML = user.username;
        element.appendChild(name);

        this.contentDiv.appendChild(element);

        for (let i = 0; i < this.ingameState.socket.users.length; i++) {
            const currentUser = this.ingameState.socket.users[i];

            const element = document.createElement("div");

            // Create color
            const shapeCanvas = document.createElement("canvas");
            shapeCanvas.width = 100;
            shapeCanvas.height = 100;
            COLOR_ITEM_SINGLETONS[currentUser.color].drawFullSizeOnCanvas(shapeCanvas.getContext("2d"), 100);
            shapeCanvas.classList.add("icon");
            element.appendChild(shapeCanvas);

            const name = document.createElement("span");
            name.classList.add("counter");
            name.innerHTML = currentUser.username;
            element.appendChild(name);

            if (this.ingameState.isHost()) {
                const kickButton = document.createElement("button");
                kickButton.classList.add("kick", "styledButton");
                kickButton.innerText = T.multiplayer.kick;
                element.appendChild(kickButton);

                const socketId = this.ingameState.socket.connections.find(
                    x => x.user._id === currentUser._id
                ).id;

                this.trackClicks(kickButton, () => {
                    this.ingameState.core.root.hud.parts["notifications"].internalShowNotification(
                        T.multiplayer.user.disconnected.replaceAll("<username>", currentUser.username),
                        enumNotificationType.success
                    );
                    this.ingameState.socket.users.splice(
                        this.ingameState.socket.users.indexOf(currentUser),
                        1
                    );

                    for (let i = 0; i < this.ingameState.socket.connections.length; i++) {
                        const connection = this.ingameState.socket.connections[i];

                        MultiplayerPacket.sendPacket(
                            this.ingameState.socket.socket,
                            connection.id,
                            new TextPacket(
                                TextPacketTypes.USER_DISCONNECTED,
                                JSON.stringify({ user: currentUser, socketId })
                            )
                        );
                    }
                    this.ingameState.socket.socket.socket.emit("kick", socketId);
                });
            }

            this.contentDiv.appendChild(element);
        }
    }

    lerp(start, end, time) {
        return start + (end - start) * time;
    }

    update() {
        this.domAttach.update(this.visible);

        if (!this.ingameState || !this.ingameState.socket || !this.ingameState.socket.user) return;

        for (let i = 0; i < this.ingameState.socket.users.length; i++) {
            const user = this.ingameState.socket.users[i];

            if (typeof user.worldPos === "undefined") continue;

            const tracing = new Vector(user.worldPos.x, user.worldPos.y);

            if (!user.velocity || !user.currentWorldPos) {
                user.velocity = new Vector(0, 0);
                user.currentWorldPos = tracing;
            }

            user.currentWorldPos.x = Math.floor(this.lerp(user.currentWorldPos.x, tracing.x, 0.13));
            user.currentWorldPos.y = Math.floor(this.lerp(user.currentWorldPos.y, tracing.y, 0.13));
            user.currentMouseTile = user.currentWorldPos.toTileSpace();
        }

        if (Date.now() - this.lastTimeUpdated < 0.5 * 1000) return;
        this.lastTimeUpdated = Date.now();

        if (this.visible) {
            this.rerenderFull();
        }

        const metaBuilding = this.ingameState.core.root.hud.parts.buildingPlacer.currentMetaBuilding.get();

        if (!metaBuilding) {
            this.ingameState.socket.user.currentMetaBuilding = undefined;
        } else {
            this.ingameState.socket.user.currentMetaBuilding = metaBuilding.getId();
        }

        this.ingameState.socket.user.currentVariant =
            this.ingameState.core.root.hud.parts.buildingPlacer.currentVariant.get();

        this.ingameState.socket.user.currentBaseRotation =
            this.ingameState.core.root.hud.parts.buildingPlacer.currentBaseRotation;

        const mousePosition = this.ingameState.core.root.app.mousePosition;

        if (mousePosition) {
            this.ingameState.socket.user.worldPos =
                this.ingameState.core.root.camera.screenToWorld(mousePosition);
        }

        if (this.ingameState.isHost()) {
            for (let i = 0; i < this.ingameState.socket.connections.length; i++) {
                MultiplayerPacket.sendPacket(
                    this.ingameState.socket.socket,
                    this.ingameState.socket.connections[i].id,
                    new TextPacket(TextPacketTypes.USER_UPDATE, JSON.stringify(this.ingameState.socket.user))
                );
            }
        } else if (this.ingameState.socket.socket.hostSocketId) {
            MultiplayerPacket.sendPacket(
                this.ingameState.socket.socket,
                this.ingameState.socket.socket.hostSocketId,
                new TextPacket(TextPacketTypes.USER_UPDATE, JSON.stringify(this.ingameState.socket.user))
            );
        }
    }

    draw(parameters) {
        if (
            !this.ingameState ||
            !this.ingameState.socket ||
            !this.ingameState.socket.users ||
            !getMod().settings.showOtherPlayers
        ) {
            return;
        }

        for (let i = 0; i < this.ingameState.socket.users.length; i++) {
            const user = this.ingameState.socket.users[i];
            if (
                typeof user.currentMetaBuilding === "undefined" ||
                typeof user.currentVariant === "undefined" ||
                typeof user.currentBaseRotation === "undefined" ||
                typeof user.currentMouseTile === "undefined" ||
                typeof user.currentWorldPos === "undefined" ||
                user.currentMetaBuilding === null
            ) {
                continue;
            }

            const metaBuilding = gMetaBuildingRegistry.findById(user.currentMetaBuilding);

            this.drawRegularPlacementSetup(
                parameters,
                metaBuilding,
                user.currentVariant,
                user.currentBaseRotation,
                user.currentMouseTile,
                user.currentWorldPos,
                user.color
            );
        }
    }

    drawRegularPlacementSetup(
        parameters,
        metaBuilding,
        variant,
        baseRotation,
        mouseTile,
        worldPos,
        color = enumColors.uncolored
    ) {
        const fakeEntity = new Entity(null);
        metaBuilding.setupEntityComponents(fakeEntity, null);

        fakeEntity.addComponent(
            new StaticMapEntityComponent({
                origin: new Vector(0, 0),
                rotation: 0,
                tileSize: metaBuilding.getDimensions(variant).copy(),
                code: getCodeFromBuildingData(metaBuilding, variant, 0),
            })
        );
        metaBuilding.updateVariants(fakeEntity, 0, variant);

        this.drawRegularPlacement(
            parameters,
            metaBuilding,
            variant,
            baseRotation,
            fakeEntity,
            mouseTile,
            worldPos,
            color
        );
    }

    /**
     *
     * @param {DrawParameters} parameters
     * @param {MetaBuilding} metaBuilding
     * @param {String} currentVariant
     * @param {Number} currentBaseRotation
     * @param {Entity} fakeEntity
     * @param {Vector} mouseTile
     * @param {Vector} worldPos
     */
    drawRegularPlacement(
        parameters,
        metaBuilding,
        currentVariant,
        currentBaseRotation,
        fakeEntity,
        mouseTile,
        worldPos,
        color = enumColors.uncolored
    ) {
        // Compute best rotation variant
        const { rotation, rotationVariant, connectedEntities } =
            metaBuilding.computeOptimalDirectionAndRotationVariantAtTile({
                root: this.ingameState.core.root,
                tile: mouseTile,
                rotation: currentBaseRotation,
                variant: currentVariant,
                layer: metaBuilding.getLayer(),
            });

        // Check if there are connected entities
        if (connectedEntities) {
            for (let i = 0; i < connectedEntities.length; ++i) {
                const connectedEntity = connectedEntities[i];
                const connectedWsPoint = connectedEntity.components.StaticMapEntity.getTileSpaceBounds()
                    .getCenter()
                    .toWorldSpace();

                const startWsPoint = mouseTile.toWorldSpaceCenterOfTile();

                const startOffset = connectedWsPoint
                    .sub(startWsPoint)
                    .normalize()
                    .multiplyScalar(globalConfig.tileSize * 0.3);
                const effectiveStartPoint = startWsPoint.add(startOffset);
                const effectiveEndPoint = connectedWsPoint.sub(startOffset);

                parameters.context.globalAlpha = 0.6;

                // parameters.context.lineCap = "round";
                parameters.context.strokeStyle = "#7f7";
                parameters.context.lineWidth = 10;
                parameters.context.beginPath();
                parameters.context.moveTo(effectiveStartPoint.x, effectiveStartPoint.y);
                parameters.context.lineTo(effectiveEndPoint.x, effectiveEndPoint.y);
                parameters.context.stroke();
                parameters.context.globalAlpha = 1;
                // parameters.context.lineCap = "square";
            }
        }

        // Synchronize rotation and origin
        fakeEntity.layer = metaBuilding.getLayer();
        const staticComp = fakeEntity.components.StaticMapEntity;
        staticComp.origin = mouseTile;
        staticComp.rotation = rotation;
        metaBuilding.updateVariants(fakeEntity, rotationVariant, currentVariant);
        staticComp.code = getCodeFromBuildingData(metaBuilding, currentVariant, rotationVariant);

        const canBuild = this.ingameState.core.root.logic.checkCanPlaceEntity(fakeEntity, {
            allowReplaceBuildings: true,
        });

        // Fade in / out
        parameters.context.lineWidth = 1;

        // Determine the bounds and visualize them
        const entityBounds = staticComp.getTileSpaceBounds();
        const drawBorder = -3;
        if (canBuild) {
            parameters.context.strokeStyle = "rgba(56, 235, 111, 0.5)";
            parameters.context.fillStyle = "rgba(56, 235, 111, 0.2)";
        } else {
            parameters.context.strokeStyle = "rgba(255, 0, 0, 0.2)";
            parameters.context.fillStyle = "rgba(255, 0, 0, 0.2)";
        }

        // @ts-ignore
        parameters.context.beginRoundedRect(
            entityBounds.x * globalConfig.tileSize - drawBorder,
            entityBounds.y * globalConfig.tileSize - drawBorder,
            entityBounds.w * globalConfig.tileSize + 2 * drawBorder,
            entityBounds.h * globalConfig.tileSize + 2 * drawBorder,
            4
        );
        parameters.context.stroke();
        // parameters.context.fill();
        parameters.context.globalAlpha = 1;

        // HACK to draw the entity sprite
        let sprite = metaBuilding.getSprite(rotationVariant, currentVariant);
        if (!sprite) {
            sprite = metaBuilding.getPreviewSprite(rotationVariant, currentVariant);
        }
        if (this.coloredComponent) {
            this.coloredComponent.color = enumColorToShortcode[color];
            sprite = this.coloredComponent.getSprite(sprite);
        }
        staticComp.origin = worldPos.divideScalar(globalConfig.tileSize).subScalars(0.5, 0.5);
        staticComp.drawSpriteOnBoundsClipped(parameters, sprite);
        staticComp.origin = mouseTile;

        // Draw ejectors
        if (canBuild) {
            this.drawMatchingAcceptorsAndEjectors(parameters, fakeEntity);
        }
    }

    drawMatchingAcceptorsAndEjectors(parameters, fakeEntity) {
        const acceptorComp = fakeEntity.components.ItemAcceptor;
        const ejectorComp = fakeEntity.components.ItemEjector;
        const staticComp = fakeEntity.components.StaticMapEntity;
        const beltComp = fakeEntity.components.Belt;
        const minerComp = fakeEntity.components.Miner;

        const goodArrowSprite = Loader.getSprite("sprites/misc/slot_good_arrow.png");
        const badArrowSprite = Loader.getSprite("sprites/misc/slot_bad_arrow.png");

        // Just ignore the following code please ... thanks!

        const offsetShift = 10;

        /**
         * @type {Array<import("shapez/game/components/item_acceptor").ItemAcceptorSlot>}
         */
        let acceptorSlots = [];
        /**
         * @type {Array<import("shapez/game/components/item_ejector").ItemEjectorSlot>}
         */
        let ejectorSlots = [];

        if (ejectorComp) {
            ejectorSlots = ejectorComp.slots.slice();
        }

        if (acceptorComp) {
            acceptorSlots = acceptorComp.slots.slice();
        }

        if (beltComp) {
            const fakeEjectorSlot = beltComp.getFakeEjectorSlot();
            const fakeAcceptorSlot = beltComp.getFakeAcceptorSlot();
            ejectorSlots.push(fakeEjectorSlot);
            acceptorSlots.push(fakeAcceptorSlot);
        }

        // Go over all slots
        for (let i = 0; i < acceptorSlots.length; ++i) {
            const slot = acceptorSlots[i];

            const acceptorSlotWsTile = staticComp.localTileToWorld(slot.pos);
            const acceptorSlotWsPos = acceptorSlotWsTile.toWorldSpaceCenterOfTile();

            const direction = slot.direction;
            const worldDirection = staticComp.localDirectionToWorld(direction);

            // Figure out which tile ejects to this slot
            const sourceTile = acceptorSlotWsTile.add(enumDirectionToVector[worldDirection]);

            let isBlocked = false;
            let isConnected = false;

            // Find all entities which are on that tile
            const sourceEntities = this.root.map.getLayersContentsMultipleXY(sourceTile.x, sourceTile.y);

            // Check for every entity:
            for (let j = 0; j < sourceEntities.length; ++j) {
                const sourceEntity = sourceEntities[j];
                const sourceEjector = sourceEntity.components.ItemEjector;
                const sourceBeltComp = sourceEntity.components.Belt;
                const sourceStaticComp = sourceEntity.components.StaticMapEntity;
                const ejectorAcceptLocalTile = sourceStaticComp.worldToLocalTile(acceptorSlotWsTile);

                // If this entity is on the same layer as the slot - if so, it can either be
                // connected, or it can not be connected and thus block the input
                if (sourceEjector && sourceEjector.anySlotEjectsToLocalTile(ejectorAcceptLocalTile)) {
                    // This one is connected, all good
                    isConnected = true;
                } else if (
                    sourceBeltComp &&
                    sourceStaticComp.localDirectionToWorld(sourceBeltComp.direction) ===
                        enumInvertedDirections[worldDirection]
                ) {
                    // Belt connected
                    isConnected = true;
                } else {
                    // This one is blocked
                    isBlocked = true;
                }
            }

            const alpha = isConnected || isBlocked ? 1.0 : 0.3;
            const sprite = isBlocked ? badArrowSprite : goodArrowSprite;

            parameters.context.globalAlpha = alpha;
            drawRotatedSprite({
                parameters,
                sprite,
                x: acceptorSlotWsPos.x,
                y: acceptorSlotWsPos.y,
                // @ts-ignore
                angle: Math.radians(enumDirectionToAngle[enumInvertedDirections[worldDirection]]),
                size: 13,
                offsetY: offsetShift + 13,
            });
            parameters.context.globalAlpha = 1;
        }

        // Go over all slots
        for (let ejectorSlotIndex = 0; ejectorSlotIndex < ejectorSlots.length; ++ejectorSlotIndex) {
            const slot = ejectorSlots[ejectorSlotIndex];

            const ejectorSlotLocalTile = slot.pos.add(enumDirectionToVector[slot.direction]);
            const ejectorSlotWsTile = staticComp.localTileToWorld(ejectorSlotLocalTile);

            const ejectorSLotWsPos = ejectorSlotWsTile.toWorldSpaceCenterOfTile();
            const ejectorSlotWsDirection = staticComp.localDirectionToWorld(slot.direction);

            let isBlocked = false;
            let isConnected = false;

            // Find all entities which are on that tile
            const destEntities = this.root.map.getLayersContentsMultipleXY(
                ejectorSlotWsTile.x,
                ejectorSlotWsTile.y
            );

            // Check for every entity:
            for (let i = 0; i < destEntities.length; ++i) {
                const destEntity = destEntities[i];
                const destAcceptor = destEntity.components.ItemAcceptor;
                const destStaticComp = destEntity.components.StaticMapEntity;
                const destMiner = destEntity.components.Miner;

                const destLocalTile = destStaticComp.worldToLocalTile(ejectorSlotWsTile);
                const destLocalDir = destStaticComp.worldDirectionToLocal(ejectorSlotWsDirection);
                if (destAcceptor && destAcceptor.findMatchingSlot(destLocalTile, destLocalDir)) {
                    // This one is connected, all good
                    isConnected = true;
                } else if (destEntity.components.Belt && destLocalDir === enumDirection.top) {
                    // Connected to a belt
                    isConnected = true;
                } else if (minerComp && minerComp.chainable && destMiner && destMiner.chainable) {
                    // Chainable miners connected to eachother
                    isConnected = true;
                } else {
                    // This one is blocked
                    isBlocked = true;
                }
            }

            const alpha = isConnected || isBlocked ? 1.0 : 0.3;
            const sprite = isBlocked ? badArrowSprite : goodArrowSprite;

            parameters.context.globalAlpha = alpha;
            drawRotatedSprite({
                parameters,
                sprite,
                x: ejectorSLotWsPos.x,
                y: ejectorSLotWsPos.y,
                // @ts-ignore
                angle: Math.radians(enumDirectionToAngle[ejectorSlotWsDirection]),
                size: 13,
                offsetY: offsetShift,
            });
            parameters.context.globalAlpha = 1;
        }
    }
}

/**
 * @this {Mod}
 * @param {GameRoot} root
 */
export function createHud(root) {
    // @ts-ignore
    if (root.gameState.isMultiplayer()) {
        const part = new MultiplayerHUD(root);
        // @ts-ignore
        root.hud.parts.multiplayer = part;

        const frag = document.createDocumentFragment();
        this.signals.hudElementInitialized.dispatch(part);
        part.createElements(frag);
        document.body.appendChild(frag);

        part.initialize();
        this.signals.hudElementFinalized.dispatch(part);
    }
}

/**
 * @this {Mod}
 */
export function setupHud() {
    // Draw multiplayer hud
    this.modInterface.runAfterMethod(
        GameHUD,
        "draw",
        /**
         * @this {GameHUD}
         */
        function (parameters) {
            // @ts-ignore
            if (this.root.hud.parts.multiplayer) {
                // @ts-ignore
                this.root.hud.parts.multiplayer.draw(parameters);
            }
        }
    );

    this.modInterface.runAfterMethod(
        HUDGameMenu,
        "createElements",
        /**
         * @this {HUDGameMenu}
         * @param {HTMLElement} parent
         */
        function (parent) {
            const buttons = [
                {
                    id: "multiplayer",
                    label: "Multiplayer",
                    // @ts-ignore
                    handler: () => this.root.hud.parts.multiplayer.show(),
                    // @ts-ignore
                    visible: () => !!this.root.hud.parts.multiplayer,
                },
            ];
            buttons.forEach(({ id, label, handler, keybinding, badge, notification, visible }) => {
                const button = document.createElement("button");
                button.classList.add(id);
                this.element.appendChild(button);
                this.trackClicks(button, handler);

                if (keybinding) {
                    const binding = this.root.keyMapper.getBinding(keybinding);
                    binding.add(handler);
                }

                if (visible) {
                    this.visibilityToUpdate.push({
                        button,
                        condition: visible,
                        domAttach: new DynamicDomAttach(this.root, button),
                    });
                }

                if (badge) {
                    const badgeElement = makeDiv(button, null, ["badge"]);
                    this.badgesToUpdate.push({
                        badge,
                        lastRenderAmount: 0,
                        button,
                        badgeElement,
                        notification,
                        condition: visible,
                    });
                }
            });
        }
    );
}
