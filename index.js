"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EventEmitter = require("events");
var http = require("http");
var isTypedArray = require("is-typedarray");
var Stream = require("stream");
var util = require("util");
function safety(data, seen) {
    if (typeof data === "symbol") {
        return data.toString();
    }
    else if (typeof data === "string") {
        return data.length > 1000 ? data.substring(0, 1000) + "..." : data;
    }
    else if (typeof data === "function") {
        return data.name ? `[Function: ${data.name}]` : "[Function]";
    }
    else if (typeof data !== "object") {
        return data;
    }
    else if (data === null) {
        return null;
    }
    else if (data instanceof Date) {
        return data;
    }
    else if (Buffer.isBuffer(data)) {
        return util.inspect(data);
    }
    else if (isTypedArray(data)) {
        return util.inspect(data, { maxArrayLength: 10, breakLength: Infinity });
    }
    if (seen.indexOf(data) >= 0) {
        return "[Dupl]";
    }
    seen.push(data);
    if (data instanceof http.IncomingMessage) {
        return {
            url: data.url,
            method: data.method,
            headers: safety(data.headers, seen),
            remoteAddress: data.connection && data.connection.remoteAddress,
            remotePort: data.connection && data.connection.remotePort
        };
    }
    else if (data instanceof http.ServerResponse) {
        return {
            statusCode: data.statusCode,
            header: data._header
        };
    }
    else if ((data instanceof Stream || data instanceof EventEmitter) &&
        data.constructor) {
        return `[${data.constructor.name} ${data + ""}]`;
    }
    var out;
    var i, k;
    if (Array.isArray(data)) {
        out = [];
        for (i = 0; i < data.length; i++) {
            out.push(safety(data[i], seen));
        }
    }
    else {
        out = {};
        var keys = Object.keys(data);
        for (i = 0; i < keys.length; i++) {
            k = keys[i];
            out[k] = safety(data[k], seen);
        }
        // Errors don't enumerate these properties, so let's be sure to include them
        if (typeof data.name === "string") {
            out.name = data.name;
        }
        if (typeof data.message === "string") {
            out.message = data.message;
        }
        if (typeof data.stack === "string") {
            out.stack = data.stack;
        }
    }
    return out;
}
function toJson(data) {
    return JSON.stringify(safety(data, []));
}
exports.toJson = toJson;
function stringifyPairs(data) {
    if (data instanceof Error) {
        data = { err: data };
    }
    var str = toJson(data);
    if (!str || str === "null" || str === "{}") {
        return "";
    }
    if (str[0] === "{") {
        return str.slice(1, -1) + ",";
    }
    return `"data":${str},`;
}
exports.stringifyPairs = stringifyPairs;
exports.timeFns = {
    iso: () => `"time":"${new Date().toISOString()}",`,
    now: () => `"time":${Date.now()},`,
    none: () => ""
};
function mkLevel(level, time, ctx, write) {
    return function (message, data) {
        var line = `{"level":${level},${time()}${ctx}${stringifyPairs(data)}"msg":${toJson(message) || "null"}}\n`;
        write(line);
        return line;
    };
}
exports.mkLevel = mkLevel;
const writeStdOut = process.stdout.write.bind(process.stdout);
const writeStdErr = process.stderr.write.bind(process.stderr);
class JsonLog {
    constructor(ctx) {
        this.error = mkLevel(1, exports.timeFns.iso, this.ctx, writeStdErr);
        this.warn = mkLevel(2, exports.timeFns.iso, this.ctx, writeStdOut);
        this.info = mkLevel(3, exports.timeFns.iso, this.ctx, writeStdOut);
        this.ctx = ctx;
    }
    child(moreCtx) {
        return new JsonLog(this.ctx + stringifyPairs(moreCtx));
    }
}
exports.log = new JsonLog("");
//# sourceMappingURL=index.js.map