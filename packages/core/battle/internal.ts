import { delay } from '../common/utils.js';
import { PetRoundInfo } from '../entity/index.js';
import { SEAEventSource, SocketDeserializerRegistry } from '../event-source/index.js';
import { context, manager } from './manager.js';
import { cachedRoundInfo, provider } from './provider.js';

declare const CountExpPanelManager: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    overData: any;
};

export default () => {
    /** better switch pet handler */
    PetBtnView.prototype.autoUse = function () {
        this.getMC().selected = !0;
        if (this.locked) throw '[warn] 切换精灵失败: 该精灵已被放逐，无法出战';
        if (this.mc.selected) {
            if (this.hp <= 0) throw '[warn] 切换精灵失败: 该精灵已阵亡';
            if (this.info.catchTime == FighterModelFactory.playerMode?.info.catchTime)
                throw '[warn] 切换精灵失败: 该精灵已经出战';
            this.dispatchEvent(new PetFightEvent(PetFightEvent.CHANGE_PET, this.catchTime));
        } else if (!this.mc.selected) {
            this.dispatchEvent(new PetFightEvent('selectPet', this.catchTime));
        }
        this.getMC().selected = !1;
    };

    SEAEventSource.hook('battle:start').on(() => {
        cachedRoundInfo.deactivate();
        if (FightManager.fightAnimateMode === 1) {
            TimeScaleManager.setBattleAnimateSpeed(10);
        }
    });

    SEAEventSource.hook('battle:showEndProp').on(() => {
        if (FightManager.fightAnimateMode === 1) {
            TimeScaleManager.setBattleAnimateSpeed(1);
        }
        const currModule = ModuleManager.currModule;
        currModule.onClose();
        AwardManager.resume();
        EventManager.dispatchEvent(new PetFightEvent(PetFightEvent.ALARM_CLICK, CountExpPanelManager.overData));
    });

    const onRoundStart = () => {
        const info = provider.getCurRoundInfo()!;
        if (info.round <= 0) {
            context.delayTimeout = delay(4500);
        }
    };

    SEAEventSource.hook('battle:start').on(onRoundStart);
    SEAEventSource.hook('battle:roundEnd').on(onRoundStart);
    SEAEventSource.hook('battle:end').on(() => {
        const isWin = Boolean(FightManager.isWin);
        if (context.strategy) {
            Promise.all([context.delayTimeout, delay(500)])
                .then(() => {
                    context.triggerLock?.(isWin);
                    manager.clear();
                })
                .catch((e) => {
                    console.error(e);
                });
        }
    });

    SocketDeserializerRegistry.register(CommandID.NOTE_USE_SKILL, (data) => {
        const roundInfo = new UseSkillInfo(new egret.ByteArray(data!.rawBuffer));
        const fi = new PetRoundInfo(roundInfo.firstAttackInfo);
        const si = new PetRoundInfo(roundInfo.secondAttackInfo);
        return [fi, si] as const;
    });

    SEAEventSource.socket(CommandID.NOTE_USE_SKILL, 'receive').on((data) => {
        cachedRoundInfo.update([...data]);
    });
};
