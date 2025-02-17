/* eslint-disable */
import type { AnyFunction } from '../common/utils.js';
import { Socket } from '../engine/index.js';
import { EntityBase } from '../entity/EntityBase.js';
import { Item, Pet } from '../entity/index.js';
import { PetDataManger as ins, type CatchTime } from './PetDataManager.js';
import { PetLocation, setLocationTable } from './PetLocation.js';

type SEAPet = {
    [P in keyof ProxyPet]: ProxyPet[P] extends (...args: infer A) => infer R
        ? R extends Promise<ProxyPet>
            ? (...args: A) => SEAPet
            : R extends Promise<unknown>
            ? ProxyPet[P]
            : (...args: A) => Promise<R>
        : Promise<ProxyPet[P]>;
} & {
    get<TResult1 = ProxyPet, TResult2 = never>(
        onfulfilled?: ((value: ProxyPet) => TResult1 | PromiseLike<TResult1>) | undefined | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
    ): PromiseLike<TResult1 | TResult2>;
    done: Promise<ProxyPet>;
};

const ChainableSymbol = Symbol('SEAPetChainable');

function chainable(value: any, ctx: ClassMethodDecoratorContext) {
    (value as any)[ChainableSymbol] = true;
    return value;
}

export class ProxyPet extends Pet {
    constructor(i: PetInfo) {
        super(i);
    }

    get isDefault(): boolean {
        return this.catchTime === ins.defaultCt;
    }

    default() {
        return this.setLocation(PetLocation.Default);
    }

    async location(): Promise<PetLocation> {
        const allInfo = await ins.miniInfo.get();
        const bagPet = await ins.bag.get();
        if (this.catchTime === ins.defaultCt && bagPet[0].length > 0) {
            return PetLocation.Default;
        }
        if (bagPet[0].find((pet) => pet.catchTime === this.catchTime)) {
            return PetLocation.Bag;
        }
        if (bagPet[1].find((pet) => pet.catchTime === this.catchTime)) {
            return PetLocation.SecondBag;
        }
        if (allInfo.has(this.catchTime)) {
            const pet = allInfo.get(this.catchTime)!;
            let pos = PetLocation.Unknown;
            switch (pet.posi) {
                case 0:
                    pos = PetLocation.Storage;
                    break;
                case 4:
                    pos = PetLocation.Elite;
                    break;
                case 14:
                    pos = PetLocation.OnDispatching;
                    break;
                default:
            }
            return pos;
        }
        return PetLocation.Unknown;
    }

    async setLocation(newLocation: PetLocation) {
        const oldLocation = await this.location();
        if (newLocation === oldLocation) {
            return false;
        }
        const r = await setLocationTable[oldLocation][newLocation]?.(this.catchTime);
        return r ?? false;
    }

    /**
     * @chainable
     */
    @chainable
    async cure() {
        await Socket.sendByQueue(CommandID.PET_ONE_CURE, [this.catchTime]);
        return ins.query(this.catchTime);
    }

    async popFromBag() {
        const local = await this.location();
        if (local === PetLocation.Bag || local === PetLocation.SecondBag || local === PetLocation.Default) {
            await this.setLocation(PetLocation.Storage);
        }
        return;
    }

    /**
     * @description 对精灵使用物品
     * Attention: 该发包不具备收包resolve的条件! 请手动添加延迟
     * @chainable
     */
    @chainable
    async useItem(item: Item | number) {
        const itemId = EntityBase.inferId(item);
        const info = await PetManager.UpdateBagPetInfoAsynce(this.catchTime);
        ItemUseManager.getInstance().useItem(info, itemId);
        return ins.query(this.catchTime);
    }

    /**
     * @description 对精灵使用药品
     * @chainable
     */
    @chainable
    async usePotion(potion: Item | number) {
        const itemId = EntityBase.inferId(potion);
        await Socket.sendByQueue(CommandID.USE_PET_ITEM_OUT_OF_FIGHT, [this.catchTime, itemId]);
        return ins.query(this.catchTime);
    }
}

export function SEAPet(pet: Pet | CatchTime) {
    const ct = Pet.inferCatchTime(pet);
    const petPromise = pet instanceof Promise ? pet : Promise.resolve(ins.cache.get(ct) ?? ins.query(ct));

    const extractPromiseWrapper =
        (target: Promise<ProxyPet>, fn: AnyFunction, isChainable: boolean) =>
        (...args: unknown[]) => {
            if (isChainable) {
                return SEAPet(target.then((pet) => (fn as AnyFunction).apply(pet, args)) as any);
            } else {
                return target.then((pet) => (fn as AnyFunction).apply(pet, args));
            }
        };

    const proxyPet = new Proxy(petPromise, {
        get(target, prop, _) {
            if (prop === 'get') {
                return target.then.bind(target);
            }
            if (prop === 'done') {
                return target;
            }

            const fn = ProxyPet.prototype[prop as keyof ProxyPet];

            if (fn && typeof fn === 'function') {
                return extractPromiseWrapper(target, fn, Boolean(ChainableSymbol in fn));
            }

            return target.then((pet) => pet[prop as keyof ProxyPet]);
        },
    }) as unknown as SEAPet;

    return proxyPet;
}
