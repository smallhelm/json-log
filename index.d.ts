export declare function toJson(data: any): string;
export declare function stringifyPairs(data: any): string;
export declare const timeFns: {
    iso: () => string;
    now: () => string;
    none: () => string;
};
export declare function mkLevel(level: number | string, time: (() => string), ctx: string, write: (line: string) => any): (message: string, data?: any) => string;
declare class JsonLog {
    private readonly ctx;
    constructor(ctx: string);
    error: (message: string, data?: any) => string;
    warn: (message: string, data?: any) => string;
    info: (message: string, data?: any) => string;
    child(moreCtx: any): JsonLog;
}
export declare const log: JsonLog;
export {};
