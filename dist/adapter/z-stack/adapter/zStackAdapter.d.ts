import { NetworkOptions, SerialPortOptions, Coordinator, CoordinatorVersion, NodeDescriptor, ActiveEndpoints, SimpleDescriptor, LQI, RoutingTable, Backup as BackupType, NetworkParameters, StartResult } from '../../tstype';
import * as Events from '../../events';
import Adapter from '../../adapter';
import { ZpiObject } from '../znp';
import { ZclFrame } from '../../../zcl';
declare class ZStackAdapter extends Adapter {
    private znp;
    private transactionID;
    private version;
    private closing;
    private queue;
    private waitress;
    constructor(networkOptions: NetworkOptions, serialPortOptions: SerialPortOptions, backupPath?: string);
    /**
     * Adapter methods
     */
    start(): Promise<StartResult>;
    stop(): Promise<void>;
    getCoordinator(): Promise<Coordinator>;
    permitJoin(seconds: number): Promise<void>;
    getCoordinatorVersion(): Promise<CoordinatorVersion>;
    softReset(): Promise<void>;
    disableLED(): Promise<void>;
    nodeDescriptor(networkAddress: number): Promise<NodeDescriptor>;
    activeEndpoints(networkAddress: number): Promise<ActiveEndpoints>;
    simpleDescriptor(networkAddress: number, endpointID: number): Promise<SimpleDescriptor>;
    sendZclFrameNetworkAddressWithResponse(networkAddress: number, endpoint: number, zclFrame: ZclFrame): Promise<Events.ZclDataPayload>;
    sendZclFrameNetworkAddress(networkAddress: number, endpoint: number, zclFrame: ZclFrame): Promise<void>;
    sendZclFrameGroup(groupID: number, zclFrame: ZclFrame): Promise<void>;
    lqi(networkAddress: number): Promise<LQI>;
    routingTable(networkAddress: number): Promise<RoutingTable>;
    bind(destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number, clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group', destinationEndpoint?: number): Promise<void>;
    unbind(destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number, clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group', destinationEndpoint: number): Promise<void>;
    removeDevice(networkAddress: number, ieeeAddr: string): Promise<void>;
    /**
     * Event handlers
     */
    onZnpClose(): void;
    onZnpRecieved(object: ZpiObject): void;
    getNetworkParameters(): Promise<NetworkParameters>;
    supportsBackup(): Promise<boolean>;
    backup(): Promise<BackupType>;
    /**
     * Private methods
     */
    private dataRequest;
    private dataRequestExtended;
    private nextTransactionID;
    private toAddressString;
    private incomingMsgToZclDataPayload;
    private waitDefaultResponse;
    private waitressTimeoutFormatter;
    private waitressValidator;
}
export default ZStackAdapter;
