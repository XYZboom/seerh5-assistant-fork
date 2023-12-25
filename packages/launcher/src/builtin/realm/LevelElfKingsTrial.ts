import type { LevelMeta, LevelData as SEALevelData, TaskRunner } from '@/sea-launcher';
import { LevelAction, socket } from '@sea/core';

import type { AnyFunction, ILevelBattle } from '@sea/core';

interface LevelData extends SEALevelData {
    stimulation: boolean;
    unlockHard: boolean;
    canReceiveReward: boolean;
    weeklyChallengeCount: number;
}

interface LevelOption {
    stimulation: boolean;
    sweep: boolean;
    elfId: number;
}

export default (logger: AnyFunction, battle: (name: string) => ILevelBattle) => {
    return class LevelElfKingsTrial implements TaskRunner<LevelData> {
        data: LevelData = {
            progress: 0,
            remainingTimes: 0,
            stimulation: false,
            unlockHard: false,
            canReceiveReward: false,
            weeklyChallengeCount: 0,
        };

        static readonly meta: LevelMeta = {
            name: '精灵王的试炼',
            maxTimes: 6,
            id: 'LevelElfKingsTrial',
        };

        get meta() {
            return LevelElfKingsTrial.meta;
        }

        get name() {
            return LevelElfKingsTrial.meta.name;
        }

        logger = logger;

        constructor(public option: LevelOption) {}

        async update() {
            const bits = (await socket.bitSet(8832, 2000037)).map(Boolean);
            const values = await socket.multiValue(108105, 108106, 18745, 20134);

            this.data.stimulation = bits[0];
            this.data.canReceiveReward = !bits[1];

            const { elfId } = this.option;
            const levelStage = elfId <= 10 ? values[0] : values[1];
            const stageElfId = ((elfId - 1) % 9) * 3;

            this.data.unlockHard = Boolean(levelStage & (1 << (stageElfId + 2)));
            this.data.remainingTimes = this.meta.maxTimes - values[2];
            this.data.weeklyChallengeCount = values[3];
        }

        next(): string {
            if (!this.data.unlockHard) {
                this.logger(`${this.meta.name}: 未解锁困难难度`);
                return LevelAction.STOP;
            } else if (this.data.remainingTimes > 0) {
                return LevelAction.BATTLE;
            } else {
                if (this.data.weeklyChallengeCount >= 30 && this.data.canReceiveReward) {
                    return LevelAction.AWARD;
                }
                return LevelAction.STOP;
            }
        }

        selectLevelBattle() {
            return battle('LevelElfKingsTrial');
        }

        readonly actions: Record<string, () => Promise<void>> = {
            battle: async () => {
                socket.sendByQueue(42396, [106, this.option.elfId, 2]);
            },

            award: async () => {
                await socket.sendByQueue(42395, [106, 3, 0, 0]);
            },
        };
    };
};
