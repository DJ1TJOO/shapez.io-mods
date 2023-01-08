import { AdvancedEnergy } from "@dj1tjoo/shapez-advanced-energy";
import { gMetaBuildingRegistry } from "shapez/core/global_registries";
import { getBuildingDataFromCode } from "shapez/game/building_codes";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { ItemProcessorSystem } from "shapez/game/systems/item_processor";
import { amountPerCharge } from "./amountPerCharge";
import { config } from "./config";
import { getComponentShared } from "../../shared/getShared";

/**
 * @this {import("shapez/mods/mod").Mod}
 * @param {typeof import("shapez/game/meta_building").MetaBuilding} metaClass
 * @param {Record<string, {processorType:string, processorHandler: keyof ItemProcessorSystem, slot: { pos: import("shapez/core/vector").Vector, direction: import("shapez/core/vector").enumDirection }}>} variants
 */
export function addAcceptor(metaClass, variants) {
    const instance = gMetaBuildingRegistry.findByClass(metaClass);

    this.modInterface.runAfterMethod(metaClass, "setupEntityComponents", function (entity) {
        const energy = config()[this.getId()][defaultBuildingVariant];

        entity.addComponent(
            new AdvancedEnergy.EnergyPinComponent({
                slots: [
                    {
                        direction: variants[defaultBuildingVariant].slot.direction,
                        pos: variants[defaultBuildingVariant].slot.pos,
                        type: "acceptor",
                        consumptionPerTick: energy,
                    },
                ],
            })
        );

        entity.addComponent(getComponentShared("EnergyPinRenderer"));
    });

    this.modInterface.runAfterMethod(
        metaClass,
        "updateVariants",
        function (entity, _rotationVariant, variant) {
            const energy = config()[this.getId()][variant];

            /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent} */
            const energyPinComp = entity.components["EnergyPin"];
            if (!variants[variant]) {
                energyPinComp.setSlots([]);
            } else {
                energyPinComp.slots[0].maxConsumption = energy;
                energyPinComp.slots[0].direction = variants[variant].slot.direction;
                energyPinComp.slots[0].pos = variants[variant].slot.pos;
                if (entity.root)
                    energyPinComp.slots[0].maxBuffer =
                        amountPerCharge(entity.root, energy, variants[variant].processorType) * 3;
            }
        }
    );

    const handledCanProcessVariant = [];
    const handledProcessHandlerVariant = [];

    for (const variant in variants) {
        const processorType = variants[variant].processorType;
        const processorHandler = variants[variant].processorHandler;

        if (!handledCanProcessVariant.includes(processorType)) {
            handledCanProcessVariant.push(processorType);

            this.modInterface.replaceMethod(
                ItemProcessorSystem,
                "canProcess",
                function ($original, [entity]) {
                    if (!$original(entity)) return false;

                    const buildingId = getBuildingDataFromCode(
                        entity.components.StaticMapEntity.code
                    ).metaInstance.getId();

                    if (
                        entity.components.StaticMapEntity.getVariant() !== variant ||
                        buildingId !== instance.getId()
                    ) {
                        return true;
                    }

                    const energy = config()[instance.getId()][entity.components.StaticMapEntity.getVariant()];

                    /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent} */
                    const energyPinComp = entity.components["EnergyPin"];

                    if (
                        !energyPinComp.slots[0].linkedNetwork ||
                        energyPinComp.slots[0].buffer <
                            amountPerCharge(this.root, energy, processorType) *
                                (entity.components.ItemProcessor.ongoingCharges.length + 1)
                    ) {
                        return false;
                    }

                    return true;
                }
            );
        }

        if (!handledProcessHandlerVariant.includes(processorHandler)) {
            handledProcessHandlerVariant.push(processorHandler);
            this.modInterface.runAfterMethod(
                ItemProcessorSystem,
                processorHandler,
                /** @param {import("shapez/game/systems/item_processor").ProcessorImplementationPayload} param0 */
                // @ts-expect-error No specific function is called so it doesn't know the type
                function ({ entity }) {
                    const energy = config()[instance.getId()][entity.components.StaticMapEntity.getVariant()];

                    /** @type {import("@dj1tjoo/shapez-advanced-energy/lib/js/components/energy_pin").EnergyPinComponent} */
                    const pinComp = entity.components["EnergyPin"];

                    if (!pinComp.slots[0].linkedNetwork) return;

                    entity.components["EnergyPin"].slots[0].buffer -= amountPerCharge(
                        this.root,
                        energy,
                        processorType
                    );
                }
            );
        }
    }
}
