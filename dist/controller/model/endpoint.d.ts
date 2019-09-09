import Entity from './entity';
import { KeyValue } from '../tstype';
import Group from './group';
interface ConfigureReportingItem {
    attribute: string | number | {
        ID: number;
        type: number;
    };
    minimumReportInterval: number;
    maximumReportInterval: number;
    reportableChange: number;
}
interface Options {
    manufacturerCode?: number;
    disableDefaultResponse?: boolean;
    response?: boolean;
}
declare class Endpoint extends Entity {
    readonly ID: number;
    private inputClusters;
    private outputClusters;
    private deviceNetworkAddress;
    private deviceIeeeAddress;
    private deviceID?;
    private profileID?;
    private constructor();
    /**
     * Getters/setters
     */
    set(key: 'profileID' | 'deviceID' | 'inputClusters' | 'outputClusters', value: number | number[]): void;
    get(key: 'ID'): string | number;
    supportsInputCluster(clusterKey: number | string): boolean;
    supportsOutputCluster(clusterKey: number | string): boolean;
    /**
     * CRUD
     */
    static fromDatabaseRecord(record: KeyValue, deviceNetworkAddress: number, deviceIeeeAddress: string): Endpoint;
    toDatabaseRecord(): KeyValue;
    static create(ID: number, profileID: number, deviceID: number, inputClusters: number[], outputClusters: number[], deviceNetworkAddress: number, deviceIeeeAddress: string): Endpoint;
    isType(type: string): boolean;
    /**
     * Zigbee functions
     */
    write(clusterKey: number | string, attributes: KeyValue, options?: Options): Promise<void>;
    read(clusterKey: number | string, attributes: string[] | number[], options?: Options): Promise<KeyValue>;
    readResponse(clusterKey: number | string, transactionSequenceNumber: number, attributes: KeyValue, options?: Options): Promise<void>;
    bind(clusterKey: number | string, target: Endpoint | Group): Promise<void>;
    unbind(clusterKey: number | string, target: Endpoint | Group): Promise<void>;
    defaultResponse(commandID: number, status: number, clusterID: number, transactionSequenceNumber: number, options?: Options): Promise<void>;
    configureReporting(clusterKey: number | string, items: ConfigureReportingItem[], options?: Options): Promise<void>;
    command(clusterKey: number | string, commandKey: number | string, payload: KeyValue, options?: Options): Promise<void | KeyValue>;
    private getOptionsWithDefaults;
    addToGroup(group: Group): Promise<void>;
    removeFromGroup(group: Group): Promise<void>;
    removeFromAllGroups(): Promise<void>;
}
export default Endpoint;
