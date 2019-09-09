"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = __importDefault(require("./common"));
function getChannelMask(channels) {
    let value = 0;
    for (const channel of channels) {
        for (const [key, logicalChannel] of Object.entries(common_1.default.logicalChannels)) {
            if (logicalChannel === channel) {
                value = value | common_1.default.channelMask[key];
            }
        }
    }
    return [value & 0xFF, (value >> 8) & 0xFF, (value >> 16) & 0xFF, (value >> 24) & 0xFF];
}
exports.getChannelMask = getChannelMask;
//# sourceMappingURL=utils.js.map