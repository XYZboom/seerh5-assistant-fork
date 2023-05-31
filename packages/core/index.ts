export * from './common/index.js';
export * from './constant/index.js';

export * from './battle/index.js';
export * from './engine/index.js';
export * from './entity/index.js';
export * from './event-bus/index.js';

export * from './functions/index.js';
export * from './pet-helper/index.js';

export { CoreLoader } from './loader/index.js';

declare global {
    /** `sac`全局变量使用的额外命名空间 */
    export namespace sac {
        /** 原生客户端`console.log`的正则过滤列表 */
        var filterLogText: RegExp[];
        /** 原生客户端`console.warn`的正则过滤列表 */
        var filterWarnText: RegExp[];
        var SeerH5Ready: boolean;
        var SacReady: boolean;
    }
}
