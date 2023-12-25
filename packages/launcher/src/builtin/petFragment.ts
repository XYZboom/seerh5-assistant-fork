import { CORE_VERSION, MOD_SCOPE_BUILTIN, VERSION } from '@/constants';
import type { CreateModContext, LevelMeta, ModExport, LevelData as SEALevelData, TaskRunner } from '@/sea-launcher';
import type { IPetFragmentRunner, PetFragmentOption } from '@/views/Automation/PetFragmentLevel';
import {
    PetFragmentLevelDifficulty as Difficulty,
    LevelAction,
    PetFragmentLevel,
    delay,
    engine,
    socket,
    type IPFLevelBoss,
} from '@sea/core';

interface LevelData extends SEALevelData {
    pieces: number;
    failedTimes: number;
    curDifficulty: Difficulty;
    curPosition: number;
    isChallenge: boolean;
    bosses: IPFLevelBoss[];
}

export default async function (createModContext: CreateModContext) {
    const { meta, logger } = await createModContext({
        meta: {
            id: 'PetFragmentLevel',
            scope: MOD_SCOPE_BUILTIN,
            version: VERSION,
            core: CORE_VERSION,
            description: '精灵因子',
        },
    });

    class PetFragmentRunner implements TaskRunner<LevelData>, IPetFragmentRunner {
        static readonly meta: LevelMeta = {
            maxTimes: 3,
            name: '精灵因子',
            id: meta.id,
        };

        get meta() {
            return PetFragmentRunner.meta;
        }

        get name() {
            return `精灵因子-${this.frag.name}`;
        }

        readonly designId: number;
        readonly frag: PetFragmentLevel;

        data: LevelData;
        logger = logger;

        constructor(public option: PetFragmentOption) {
            this.option = option;
            this.option.battle = this.option.battle.map((strategy) => {
                const beforeBattle = async () => {
                    await delay(Math.round(Math.random() * 1000) + 5000);
                    return strategy.beforeBattle?.();
                };
                return { ...strategy, beforeBattle };
            });

            const LevelObj: seerh5.PetFragmentLevelObj = config.xml
                .getAnyRes('new_super_design')
                .Root.Design.find((r: seerh5.PetFragmentLevelObj) => r.ID === option.id);

            this.frag = new PetFragmentLevel(LevelObj);
            this.designId = this.frag.id;

            this.data = {} as LevelData;
            this.logger = logger.bind(logger, this.name);
        }

        selectLevelBattle() {
            return this.option.battle.at(this.data.curPosition)!;
        }

        async update() {
            const { frag, data } = this;
            const values = await socket.multiValue(frag.values.openTimes, frag.values.failTimes, frag.values.progress);

            data.pieces = await engine.itemNum(frag.petFragmentItem);

            data.remainingTimes = this.meta.maxTimes - values[0];
            data.failedTimes = values[1];
            data.curDifficulty = (values[2] >> 8) & 255;
            if (data.curDifficulty === Difficulty.NotSelected && this.option.difficulty) {
                data.curDifficulty = this.option.difficulty;
            }
            data.curPosition = values[2] >> 16;
            data.isChallenge = data.curDifficulty !== 0 && data.curPosition !== 0;
            data.progress = (data.curPosition / 5) * 100;

            switch (data.curDifficulty) {
                case Difficulty.Ease:
                    data.bosses = frag.level.ease;
                    break;
                case Difficulty.Normal:
                    data.bosses = frag.level.normal;
                    break;
                case Difficulty.Hard:
                    data.bosses = frag.level.hard;
                    break;
                default:
                    break;
            }
        }

        next(): string {
            const data = this.data;
            if (data.isChallenge || data.remainingTimes > 0) {
                if (this.option.sweep) {
                    return 'sweep';
                } else {
                    return LevelAction.BATTLE;
                }
            }
            return LevelAction.STOP;
        }

        readonly actions: Record<string, () => Promise<void>> = {
            sweep: async () => {
                await socket.sendByQueue(41283, [this.designId, 4 + this.data.curDifficulty]);
                this.logger('执行一次扫荡');
            },
            battle: async () => {
                const checkData = await socket.sendByQueue(41284, [this.designId, this.data.curDifficulty]);
                const check = new DataView(checkData!).getUint32(0);
                if (check === 0) {
                    socket.sendByQueue(41282, [this.designId, this.data.curDifficulty]);
                } else {
                    const err = `出战情况不合法: ${check}`;
                    BubblerManager.getInstance().showText(err);
                    throw new Error(err);
                }
            },
        };
    }

    return {
        meta,
        exports: {
            task: [PetFragmentRunner],
        },
    } satisfies ModExport;
}
