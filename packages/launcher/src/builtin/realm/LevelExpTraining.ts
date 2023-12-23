import { LevelAction, socket } from '@sea/core';

import type { AnyFunction, ILevelBattle, LevelMeta, LevelData as SEALevelData } from '@sea/core';

interface LevelData extends SEALevelData {
    stimulation: boolean;
    rewardReceived: boolean;
}

interface LevelOption {
    stimulation: boolean;
    sweep: boolean;
}

export default (logger: AnyFunction, battle: (name: string) => ILevelBattle) => {
    return class LevelExpTraining implements SEAL.LevelRunner<LevelData> {
        data: LevelData = {
            remainingTimes: 0,
            progress: 0,
            rewardReceived: false,
            stimulation: false,
        };

        static readonly meta: LevelMeta = {
            name: '经验训练场',
            maxTimes: 6,
            id: 'LevelExpTraining',
        };

        get meta() {
            return LevelExpTraining.meta;
        }

        get name() {
            return LevelExpTraining.meta.name;
        }

        logger = logger;

        constructor(public option: LevelOption) {}

        async update() {
            this.logger(`${this.meta.name}: 更新关卡信息...`);
            const bits = (await socket.bitSet(639, 1000571)).map(Boolean);
            const buf = await socket.sendByQueue(42397, [116]);
            const realmInfo = new DataView(buf!);

            this.data.stimulation = bits[0];
            this.data.rewardReceived = bits[1];
            this.data.remainingTimes = this.meta.maxTimes - realmInfo.getUint32(8);

            if (!this.data.rewardReceived) {
                if (this.data.remainingTimes > 0) {
                    this.logger(`${this.meta.name}: 进入关卡`);
                    return LevelAction.BATTLE;
                } else {
                    this.logger(`${this.meta.name}: 领取奖励`);
                    return LevelAction.AWARD;
                }
            } else {
                this.logger(`${this.meta.name}日任完成`);
                return LevelAction.STOP;
            }
        }

        selectLevelBattle() {
            return battle('LevelExpTraining');
        }

        readonly actions: Record<string, () => Promise<void>> = {
            battle: async () => {
                socket.sendByQueue(CommandID.FIGHT_H5_PVE_BOSS, [116, 6, 1]);
            },

            award: async () => {
                await socket.sendByQueue(42395, [116, 3, 0, 0]);
            },
        };
    };
};
