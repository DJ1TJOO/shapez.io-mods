import { MODS } from "shapez/mods/modloader";

export const getMod = () => MODS.mods.find(x => x.metadata.id === "dj1tjoo_pipes");
export const getExternalMod = modId => MODS.mods.find(x => x.metadata.id === modId);
