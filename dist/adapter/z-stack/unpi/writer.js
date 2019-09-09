"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stream = __importStar(require("stream"));
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default('zigbee-herdsman:unpi:writer');
class Writer extends stream.Readable {
    writeFrame(frame) {
        const buffer = frame.toBuffer();
        debug(`--> frame [${buffer.toJSON().data}]`);
        this.push(buffer);
    }
    writeBuffer(buffer) {
        debug(`--> buffer [${buffer.toJSON().data}]`);
        this.push(buffer);
    }
    _read() { }
}
exports.default = Writer;
//# sourceMappingURL=writer.js.map