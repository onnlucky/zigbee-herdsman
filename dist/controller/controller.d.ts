/// <reference types="node" />
import events from 'events';
import { TsType as AdapterTsType } from '../adapter';
import { Device } from './model';
import Group from './model/group';
interface Options {
    network?: Partial<AdapterTsType.NetworkOptions>;
    serialPort?: Partial<AdapterTsType.SerialPortOptions>;
    databasePath?: string;
    backupPath?: string;
}
declare class Controller extends events.EventEmitter {
    private options;
    private database;
    private adapter;
    private permitJoinTimer;
    private backupTimer;
    constructor(options: Options);
    start(): Promise<void>;
    permitJoin(permit: boolean): Promise<void>;
    getPermitJoin(): boolean;
    stop(): Promise<void>;
    private backup;
    softReset(): Promise<void>;
    getCoordinatorVersion(): Promise<AdapterTsType.CoordinatorVersion>;
    getNetworkParameters(): Promise<AdapterTsType.NetworkParameters>;
    getDeviceByAddress(ieeeAddr: string): Device | undefined;
    getDevice(query: {
        ieeeAddr?: string;
        type?: AdapterTsType.DeviceType;
    }): Device | undefined;
    getDevices(query: {
        ieeeAddr?: string;
        type?: AdapterTsType.DeviceType;
    }): Device[];
    createGroup(groupID: number): Group;
    getGroupByID(groupID: number): Group | undefined;
    getGroup(query: {
        groupID: number;
    }): Group | undefined;
    getGroups(query: {
        groupID?: number;
    }): Group[];
    disableLED(): Promise<void>;
    private onDeviceAnnounce;
    private onDeviceLeave;
    private onAdapterDisconnected;
    private onDeviceJoined;
    private onZclData;
}
export default Controller;
