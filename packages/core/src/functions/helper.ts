import { wrapper } from '../common';
import { defaultStyle, SaModuleLogger } from '../logger';
const log = SaModuleLogger('SAHelper', defaultStyle.core);

export function HelperLoader() {
    enableBetterAlarm();
    enableCancelAlertForUsePetItem();
    enableFastStaticAnimation();
}

/** parallel the skill animation in static animation mode */
function enableFastStaticAnimation() {
    DBSkillAnimator.prototype.play = function (_, callback, thisObj) {
        const { skillMC } = DBSkillAnimator;
        PetFightController.mvContainer.addChild(skillMC);
        switch (SkillXMLInfo.getCategory(~~this.skillId)) {
            case 1:
                skillMC.animation.play('wugong', -1);
                skillMC.scaleX > 0 ? (skillMC.x = skillMC.x + 580) : (skillMC.x = skillMC.x - 560);
                break;
            case 2:
                skillMC.animation.play('tegong', -1);
                break;
            default:
                skillMC.animation.play('shuxing', -1), (skillMC.y = skillMC.y + 70);
                break;
        }
        if (FightManager.fightAnimateMode === 1) {
            callback.call(thisObj);
        } else {
            const cb = () => {
                callback.call(thisObj);
                skillMC.removeEventListener(dragonBones.EventObject.COMPLETE, cb, this);
            };
            skillMC.addEventListener(dragonBones.EventObject.COMPLETE, cb, this);
        }
    };

    CardPetAnimator.prototype.playAnimate = function (t, e, i, thisObj) {
        thisObj = thisObj ?? this;
        if (e)
            if (FightManager.fightAnimateMode === 1) e.call(thisObj);
            else egret.setTimeout(e.bind(thisObj), this, 1e3);
        if (this)
            if (FightManager.fightAnimateMode === 1) i.call(thisObj);
            else egret.setTimeout(i.bind(thisObj), this, 2e3);
        this.animate && this.animate.parent && this.animate.parent.addChild(this.animate);
    };

    UseSkillController.prototype.closeTxt = function () {
        if (this.textTimer) {
            this.textTimer.removeEventListener(egret.TimerEvent.TIMER, this.closeTxt, this);
            this.textTimer.stop();
            this.textTimer = null;
        }
        if (FightManager.fightAnimateMode !== 1) {
            this.dispatchEvent(new egret.Event('movieOver'));
        }
    };

    UseSkillController.prototype.onMovieOver = wrapper(
        UseSkillController.prototype.onMovieOver,
        undefined,
        function (this: UseSkillController) {
            if (FightManager.fightAnimateMode === 1) {
                setTimeout(() => {
                    this.dispatchEvent(new egret.Event('movieOver'));
                }, 300);
            }
        }
    );

    UseSkillController.prototype.closeTxt = function () {
        if (this.textTimer) {
            this.textTimer.removeEventListener(egret.TimerEvent.TIMER, this.closeTxt, this);
            this.textTimer.stop();
            this.textTimer = null;
        }
        if (FightManager.fightAnimateMode !== 1) {
            this.dispatchEvent(new egret.Event('movieOver'));
        }
    };

    const _RenewPPEffect = RenewPPEffect;
    (RenewPPEffect as any) = function (model: BaseFighterModel, itemId: number) {
        const ins = new _RenewPPEffect(model, itemId);
        if (FightManager.fightAnimateMode === 1) {
            ins.timer?.removeEventListener(egret.TimerEvent.TIMER, ins.closeTxt, ins);
            ins.timer?.stop();
            ins.timer = null;
            EventManager.dispatchEvent(new PetFightEvent(PetFightEvent.ON_USE_PET_ITEM));
        }
        return ins;
    };
}

/** cancel alert before use item for pet */
function enableCancelAlertForUsePetItem() {
    ItemUseManager.prototype.useItem = function (t, e) {
        if (!t) return void BubblerManager.getInstance().showText('使用物品前，请先选择一只精灵');
        e = Number(e);

        const use = () => {
            const r = ItemXMLInfo.getName(e);
            this.$usePetItem({ petInfo: t, itemId: ~~e, itemName: r }, e);
        };

        if (e >= 0) {
            if (e === 300066) {
                Alert.show(`你确定要给 ${t.name} 使用通用刻印激活水晶吗`, use);
            } else {
                use();
            }
        }
    };
}

/** take over the alarm dialog */
function enableBetterAlarm() {
    Alarm.show = function (text: string, callback: () => void) {
        log(`接管确认信息: ${text}`);
        BubblerManager.getInstance().showText(text, true);
        callback && callback();
    };
}
