import { Buffalo, TsType } from '../buffalo';
import { BuffaloZclOptions } from './tstype';
declare class BuffaloZcl extends Buffalo {
    private readUseDataType;
    private writeUseDataType;
    private readArray;
    private readStruct;
    private readOctetStr;
    private readCharStr;
    private writeCharStr;
    private readLongCharStr;
    private writeLongCharStr;
    private readExtensionFielSets;
    private writeExtensionFieldSets;
    private writeListZoneInfo;
    private readListZoneInfo;
    private readUInt40;
    private writeUInt40;
    private readUInt48;
    private writeUInt48;
    private readUInt56;
    private writeUInt56;
    private readUInt64;
    private writeUInt64;
    write(type: string, value: TsType.Value, options: BuffaloZclOptions): void;
    read(type: string, options: BuffaloZclOptions): TsType.Value;
}
export default BuffaloZcl;
