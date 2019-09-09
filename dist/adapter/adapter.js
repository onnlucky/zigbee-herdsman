"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __importDefault(require("events"));
class Adapter extends events_1.default.EventEmitter {
    constructor(networkOptions, serialPortOptions, backupPath) {
        super();
        this.networkOptions = networkOptions;
        this.serialPortOptions = serialPortOptions;
        this.backupPath = backupPath;
    }
}
exports.default = Adapter;
//# sourceMappingURL=adapter.js.map