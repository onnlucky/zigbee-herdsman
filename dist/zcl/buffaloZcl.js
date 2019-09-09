"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buffalo_1 = require("../buffalo");
const definition_1 = require("./definition");
const aliases = {
    'boolean': 'uint8',
    'bitmap8': 'uint8',
    'enum8': 'uint8',
    'data8': 'int8',
    'data16': 'uint16',
    'bitmap16': 'uint16',
    'uint16': 'uint16',
    'enum16': 'uint16',
    'clusterId': 'uint16',
    'attrId': 'uint16',
    'data24': 'uint24',
    'bitmap24': 'uint24',
    'data32': 'uint32',
    'bitmap32': 'uint32',
    'uint32': 'uint32',
    'tod': 'uint32',
    'date': 'uint32',
    'utc': 'uint32',
    'bacOid': 'uint32',
    'singlePrec': 'floatle',
    'doublePrec': 'doublele',
    'bitmap40': 'uint40',
    'data40': 'uint40',
    'bitmap48': 'uint48',
    'data48': 'uint48',
    'bitmap56': 'uint56',
    'data56': 'uint56',
    'bitmap64': 'uint64',
    'data64': 'uint64',
    'ieeeAddr': 'uint64',
    'longOctetStr': 'longCharStr',
    'secKey': 'buffer16',
    'noData': 'EMPTY',
    'unknown': 'EMPTY',
    'bag': 'array',
    'set': 'array',
};
class BuffaloZcl extends buffalo_1.Buffalo {
    readUseDataType(options) {
        return this.read(options.dataType, options);
    }
    writeUseDataType(value, options) {
        return this.write(options.dataType, value, options);
    }
    readArray() {
        const values = [];
        const elementType = definition_1.DataType[this.readUInt8()];
        const numberOfElements = this.readUInt16();
        for (let i = 0; i < numberOfElements; i++) {
            const value = this.read(elementType, {});
            values.push(value);
        }
        return values;
    }
    readStruct() {
        const values = [];
        const numberOfElements = this.readUInt16();
        for (let i = 0; i < numberOfElements; i++) {
            const elementType = this.readUInt8();
            const value = this.read(definition_1.DataType[elementType], {});
            values.push({ elmType: elementType, elmVal: value });
        }
        return values;
    }
    readOctetStr() {
        const length = this.readUInt8();
        const value = this.buffer.slice(this.position, this.position + length);
        this.position += length;
        return value;
    }
    readCharStr(options) {
        const length = this.readUInt8();
        if (options.attrId === 65281) {
            const value = {};
            // Xiaomi struct parsing
            for (let i = 0; i < length; i++) {
                const index = this.readUInt8();
                const dataType = definition_1.DataType[this.readUInt8()];
                value[index] = this.read(dataType, {});
                if (this.position === this.buffer.length) {
                    break;
                }
            }
            return value;
        }
        else {
            const value = this.buffer.toString('utf8', this.position, this.position + length);
            this.position += length;
            return value;
        }
    }
    writeCharStr(value) {
        this.writeUInt8(value.length);
        this.position += this.buffer.write(value, this.position, 'utf8');
    }
    readLongCharStr() {
        const length = this.readUInt16();
        const value = this.buffer.toString('utf8', this.position, this.position + length);
        this.position += length;
        return value;
    }
    writeLongCharStr(value) {
        this.writeUInt16(value.length);
        this.position += this.buffer.write(value, this.position, 'utf8');
    }
    readExtensionFielSets() {
        const value = [];
        while (this.position < this.buffer.length) {
            const clstId = this.readUInt16();
            const len = this.readUInt8();
            const extField = [];
            for (let k = 0; k < len; k++) {
                extField.push(this.readUInt8());
            }
            value.push({ extField, clstId, len });
        }
        return value;
    }
    writeExtensionFieldSets(values) {
        for (const value of values) {
            this.writeUInt16(value.clstId);
            this.writeUInt8(value.len);
            for (const entry of value.extField) {
                this.writeUInt8(entry);
            }
        }
    }
    writeListZoneInfo(values) {
        for (const value of values) {
            this.writeUInt8(value.zoneID);
            this.writeUInt16(value.zoneStatus);
        }
    }
    readListZoneInfo(options) {
        const value = [];
        for (let i = 0; i < options.length; i++) {
            value.push({
                zoneID: this.readUInt8(),
                zoneStatus: this.readUInt16(),
            });
        }
        return value;
    }
    readUInt40() {
        const lsb = this.readUInt32();
        const msb = this.readUInt8();
        return [msb, lsb];
    }
    writeUInt40(value) {
        this.writeUInt32(value[1]);
        this.writeUInt8(value[0]);
    }
    readUInt48() {
        const lsb = this.readUInt32();
        const msb = this.readUInt16();
        return [msb, lsb];
    }
    writeUInt48(value) {
        this.writeUInt32(value[1]);
        this.writeUInt16(value[0]);
    }
    readUInt56() {
        const lsb = this.readUInt32();
        const xsb = this.readUInt16();
        const msb = this.readUInt8();
        return [msb, xsb, lsb];
    }
    writeUInt56(value) {
        const temp = Buffer.alloc(8);
        temp.writeUInt32LE(value[1], 0);
        temp.writeUInt32LE(value[0], 4);
        this.writeBuffer(temp.slice(0, 7), 7);
    }
    readUInt64() {
        return this.readIeeeAddr();
    }
    writeUInt64(value) {
        const msb = parseInt(value.slice(2, 10), 16);
        const lsb = parseInt(value.slice(10), 16);
        this.writeUInt32(lsb);
        this.writeUInt32(msb);
    }
    write(type, value, options) {
        // TODO: write for the following is missing: octetStr, struct, array (+ bag/set)
        type = aliases[type] || type;
        if (type === 'uint40') {
            return this.writeUInt40(value);
        }
        else if (type === 'EXTENSION_FIELD_SETS') {
            return this.writeExtensionFieldSets(value);
        }
        else if (type === 'LIST_ZONEINFO') {
            return this.writeListZoneInfo(value);
        }
        else if (type === 'uint48') {
            return this.writeUInt48(value);
        }
        else if (type === 'uint56') {
            return this.writeUInt56(value);
        }
        else if (type === 'uint64') {
            return this.writeUInt64(value);
        }
        else if (type === 'charStr') {
            return this.writeCharStr(value);
        }
        else if (type === 'longCharStr') {
            return this.writeLongCharStr(value);
        }
        else if (type === 'USE_DATA_TYPE') {
            return this.writeUseDataType(value, options);
        }
        else {
            // TODO: remove uppercase once dataTypes are snake case
            return super.write(type.toUpperCase(), value, options);
        }
    }
    read(type, options) {
        type = aliases[type] || type;
        if (type === 'USE_DATA_TYPE') {
            return this.readUseDataType(options);
        }
        else if (type === 'EXTENSION_FIELD_SETS') {
            return this.readExtensionFielSets();
        }
        else if (type === 'LIST_ZONEINFO') {
            return this.readListZoneInfo(options);
        }
        else if (type === 'uint40') {
            return this.readUInt40();
        }
        else if (type === 'uint48') {
            return this.readUInt48();
        }
        else if (type === 'uint56') {
            return this.readUInt56();
        }
        else if (type === 'uint64') {
            return this.readUInt64();
        }
        else if (type === 'octetStr') {
            return this.readOctetStr();
        }
        else if (type === 'charStr') {
            return this.readCharStr(options);
        }
        else if (type === 'longCharStr') {
            return this.readLongCharStr();
        }
        else if (type === 'array') {
            return this.readArray();
        }
        else if (type === 'struct') {
            return this.readStruct();
        }
        else {
            // TODO: remove uppercase once dataTypes are snake case
            return super.read(type.toUpperCase(), options);
        }
    }
}
exports.default = BuffaloZcl;
//# sourceMappingURL=buffaloZcl.js.map