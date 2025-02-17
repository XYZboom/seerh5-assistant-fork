/* eslint-disable @typescript-eslint/no-unsafe-argument */
export interface Logger {
    info: typeof console.info;
    warn: typeof console.warn;
}

const enables = new Set<string>();

export enum ModuleName {
    Battle = 'Battle',
}

export const enable = (module?: ModuleName) => {
    if (!module) {
        enables.add(ModuleName.Battle);
    } else {
        enables.add(module);
    }
};

export const disable = (module?: ModuleName) => {
    if (!module) {
        enables.clear();
    } else {
        enables.delete(module);
    }
};

export const setLogger = ({ info, warn }: Logger) => {
    Logger.info = info;
    Logger.warn = warn;
};

const Logger: Logger = {
    info: console.info,
    warn: console.warn,
};

export const CoreWarning =
    (module: ModuleName): typeof console.warn =>
    (...args: Parameters<Logger['warn']>) => {
        if (enables.has(module)) {
            Logger.warn('[sea-core][%s]:', module, ...args);
        }
    };

export const CoreDevInfo =
    (module: ModuleName): typeof console.info =>
    (...args: Parameters<Logger['info']>) => {
        if (enables.has(module)) {
            Logger.info('[sea-core][%s]:', module, ...args);
        }
    };
