export async function GetMultiValue(...value: number[]) {
    if (!value) return;
    return KTool.getMultiValueAsync(value);
}


let DictMatcher = (dict: StringMapable, reg: RegExp, keyName: string) => {
    return Object.keys(dict)
        .map(key => key == keyName && dict[keyName].match(reg))
        .filter(Boolean)
};

export function matchItemName(nameReg: RegExp) {
    return DictMatcher(ItemXMLInfo._itemDict, nameReg, 'Name');
}

export function matchSkillName(nameReg: RegExp) {
    return DictMatcher(SkillXMLInfo.movesMap, nameReg, 'Name');
}

export function matchPetName(nameReg: RegExp) {
    return DictMatcher(PetXMLInfo._dataMap, nameReg, 'DefName');
}

export function getTypeIdByName(name: any) {
    return Object.values(SkillXMLInfo.typeMap)
        .find((v) => v.cn.match(name))?.id;
}

export function getUserCurrency(type: string) {
    if (type == 'soul_of_titan') {
        return ItemManager.getNumByID(1400352);
    }
}

export async function getStatusName(id: any) {
    return PetStatusEffectConfig.getName(0, id);
}

export * from './item-helper';
export * from './module-helper';
export * from './sa-socket';

