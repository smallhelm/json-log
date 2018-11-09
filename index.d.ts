export declare function toJson(data: any): string;
export declare function stringifyPairs(data: any): string;
export declare const timeFns: {
    iso: () => string;
    now: () => string;
    none: () => string;
};
export declare type LogLevelFn = (message: string, data?: any) => string;
export declare function mkLevel(level: number | string, time: (() => string), ctx: string, write: (line: string) => any): LogLevelFn;
export declare class JsonLog {
    private readonly ctx;
    readonly error: LogLevelFn;
    readonly warn: LogLevelFn;
    readonly info: LogLevelFn;
    constructor(ctx: string);
    child(moreCtx: any): JsonLog;
}
export declare const log: JsonLog;
export default log;
