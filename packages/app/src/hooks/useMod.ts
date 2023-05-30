import { Mods, register } from '@sa-app/mod-manager';

export const useMod = async () => {
    let mods = await Promise.all([
        import('../mods/official/LocalPetSkin'),
        import('../mods/official/CraftSkillStone'),
        import('../mods/official/applybm'),
        import('../mods/official/sign'),
        import('../mods/module/petbag'),
        import('../mods/module/team'),
    ]);

    for (let mod of mods) {
        const modObj = mod.default;
        register(modObj);
    }
    for (let [id, mod] of Mods) {
        mod.init();
    }
};
