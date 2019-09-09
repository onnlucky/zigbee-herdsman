/// <reference types="node" />
import * as TsType from './tstype';
import { ZclDataPayload } from './events';
import events from 'events';
import { ZclFrame } from '../zcl';
declare abstract class Adapter extends events.EventEmitter {
    protected networkOptions: TsType.NetworkOptions;
    protected serialPortOptions: TsType.SerialPortOptions;
    protected backupPath: string;
    constructor(networkOptions: TsType.NetworkOptions, serialPortOptions: TsType.SerialPortOptions, backupPath: string);
    abstract start(): Promise<TsType.StartResult>;
    abstract stop(): Promise<void>;
    abstract getCoordinator(): Promise<TsType.Coordinator>;
    abstract permitJoin(seconds: number): Promise<void>;
    abstract getCoordinatorVersion(): Promise<TsType.CoordinatorVersion>;
    abstract softReset(): Promise<void>;
    abstract disableLED(): Promise<void>;
    abstract lqi(networkAddress: number): Promise<TsType.LQI>;
    abstract routingTable(networkAddress: number): Promise<TsType.RoutingTable>;
    abstract nodeDescriptor(networkAddress: number): Promise<TsType.NodeDescriptor>;
    abstract activeEndpoints(networkAddress: number): Promise<TsType.ActiveEndpoints>;
    abstract simpleDescriptor(networkAddress: number, endpointID: number): Promise<TsType.SimpleDescriptor>;
    abstract sendZclFrameNetworkAddressWithResponse(networkAddress: number, endpoint: number, zclFrame: ZclFrame): Promise<ZclDataPayload>;
    abstract sendZclFrameNetworkAddress(networkAddress: number, endpoint: number, zclFrame: ZclFrame): Promise<void>;
    abstract sendZclFrameGroup(groupID: number, zclFrame: ZclFrame): Promise<void>;
    abstract bind(destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number, clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group', destinationEndpoint?: number): Promise<void>;
    abstract unbind(destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number, clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group', destinationEndpoint: number): Promise<void>;
    abstract removeDevice(networkAddress: number, ieeeAddr: string): Promise<void>;
    abstract supportsBackup(): Promise<boolean>;
    abstract backup(): Promise<TsType.Backup>;
    abstract getNetworkParameters(): Promise<TsType.NetworkParameters>;
}
export default Adapter;
