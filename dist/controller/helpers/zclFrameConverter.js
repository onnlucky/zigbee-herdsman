"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
;
function attributeList(frame) {
    const payload = {};
    for (const item of frame.Payload) {
        try {
            const attribute = frame.getCluster().getAttribute(item.attrId);
            payload[attribute.name] = item.attrData;
        }
        catch (error) {
            payload[item.attrId] = item.attrData;
        }
    }
    return payload;
}
exports.attributeList = attributeList;
//# sourceMappingURL=zclFrameConverter.js.map