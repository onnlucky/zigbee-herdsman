"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function arraySplitChunks(array, chunkSize) {
    const results = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        results.push(array.slice(i, i + chunkSize));
    }
    return results;
}
exports.default = arraySplitChunks;
//# sourceMappingURL=arraySplitChunks.js.map