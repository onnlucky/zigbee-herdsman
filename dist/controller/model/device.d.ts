import { KeyValue } from '../tstype';
import { TsType as AdapterTsType } from '../../adapter';
import Endpoint from './endpoint';
import Entity from './entity';
interface LQI {
    neighbors: {
        ieeeAddr: string;
        networkAddress: number;
        linkquality: number;
    }[];
}
interface RoutingTable {
    table: {
        destinationAddress: number;
        status: string;
        nextHop: number;
    }[];
}
declare type DeviceQuery = {
    ieeeAddr?: string;
    networkAddress?: number;
    type?: AdapterTsType.DeviceType;
    [key: string]: unknown;
};
declare class Device extends Entity {
    ID: number;
    ieeeAddr: string;
    networkAddress: number;
    type: AdapterTsType.DeviceType;
    private endpoints;
    private manufacturerID?;
    private manufacturerName?;
    private powerSource?;
    modelID?: string;
    private applicationVersion?;
    private stackVersion?;
    private zclVersion?;
    private hardwareVersion?;
    private dateCode?;
    private softwareBuildID?;
    interviewCompleted: boolean;
    interviewing: boolean;
    meta: KeyValue;
    private static lookup;
    static reload(): void;
    private constructor();
    isType(type: string): boolean;
    /**
     * Getters, setters and creaters
     */
    createEndpoint(ID: number): Endpoint;
    getEndpoints(): Endpoint[];
    getEndpoint(ID: number): Endpoint;
    get(key: 'modelID' | 'networkAddress' | 'interviewCompleted' | 'ieeeAddr' | 'interviewing'): string | number | boolean;
    set(key: 'modelID' | 'networkAddress', value: string | number): void;
    /**
     * CRUD
     */
    static fromDatabaseRecord(record: KeyValue): Device;
    private toDatabaseRecord;
    save(): void;
    static all(): Device[];
    static byAddress(ieeeAddr: string): Device | undefined;
    static byNetworkAddress(networkAddress: number): Device | undefined;
    static byType(type: AdapterTsType.DeviceType): Device | undefined;
    static findSingle(query: DeviceQuery): Device | undefined;
    static find(query: DeviceQuery): Device[];
    static create(type: AdapterTsType.DeviceType, ieeeAddr: string, networkAddress: number, manufacturerID: number, manufacturerName: string, powerSource: string, modelID: string, endpoints: {
        ID: number;
        profileID: number;
        deviceID: number;
        inputClusters: number[];
        outputClusters: number[];
    }[]): Device;
    /**
     * Zigbee functions
     */
    interview(): Promise<void>;
    private interviewInternal;
    removeFromNetwork(): Promise<void>;
    removeFromDatabase(): void;
    lqi(): Promise<LQI>;
    routingTable(): Promise<RoutingTable>;
    ping(): Promise<void>;
}
export default Device;
