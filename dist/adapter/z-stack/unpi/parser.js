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
const constants_1 = require("./constants");
const frame_1 = __importDefault(require("./frame"));
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default('zigbee-herdsman:unpi:parser');
class Parser extends stream.Transform {
    constructor() {
        super();
        this.buffer = Buffer.from([]);
    }
    _transform(chunk, _, cb) {
        debug(`<-- [${chunk.toJSON().data}]`);
        this.buffer = Buffer.concat([this.buffer, chunk]);
        this.parseNext();
        cb();
    }
    parseNext() {
        debug(`--- parseNext [${this.buffer.toJSON().data}]`);
        if (this.buffer.length >= constants_1.MinMessageLength && this.buffer.readUInt8(0) == constants_1.SOF) {
            const dataLength = this.buffer[constants_1.PositionDataLength];
            const fcsPosition = constants_1.DataStart + dataLength;
            const frameLength = fcsPosition + 1;
            if (this.buffer.length >= frameLength) {
                const frameBuffer = this.buffer.slice(0, frameLength);
                try {
                    const frame = frame_1.default.fromBuffer(dataLength, fcsPosition, frameBuffer);
                    debug(`--> parsed ${frame}`);
                    this.emit('parsed', frame);
                }
                catch (error) {
                    debug(`--> error ${error.stack}`);
                    this.emit('error', error);
                }
                this.buffer = this.buffer.slice(frameLength, this.buffer.length);
                this.parseNext();
            }
        }
    }
}
exports.default = Parser;
//# sourceMappingURL=parser.js.map