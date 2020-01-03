"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tstype_1 = require("./tstype");
const Events = __importStar(require("../../events"));
const adapter_1 = __importDefault(require("../../adapter"));
const znp_1 = require("../znp");
const startZnp_1 = __importDefault(require("./startZnp"));
const unpi_1 = require("../unpi");
const zcl_1 = require("../../../zcl");
const utils_1 = require("../../../utils");
const Constants = __importStar(require("../constants"));
const debug_1 = __importDefault(require("debug"));
const backup_1 = require("./backup");
const debug = debug_1.default("zigbee-herdsman:controller:zStack");
const Subsystem = unpi_1.Constants.Subsystem;
const Type = unpi_1.Constants.Type;
const DataConfirmCodeLookup = {
    205: 'No network route',
    233: 'MAC no ack',
    183: 'APS no ack',
    240: 'MAC transaction expired',
};
const DefaultTimeout = 10000;
const DefaultResponseTimeout = 15000;
;
class ZStackAdapter extends adapter_1.default {
    constructor(networkOptions, serialPortOptions, backupPath) {
        super(networkOptions, serialPortOptions, backupPath);
        this.znp = new znp_1.Znp(this.serialPortOptions.path, this.serialPortOptions.baudRate, this.serialPortOptions.rtscts);
        this.transactionID = 0;
        this.closing = false;
        this.queue = new utils_1.Queue(2);
        this.waitress = new utils_1.Waitress(this.waitressValidator, this.waitressTimeoutFormatter);
        this.znp.on('received', this.onZnpRecieved.bind(this));
        this.znp.on('close', this.onZnpClose.bind(this));
    }
    /**
     * Adapter methods
     */
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.znp.open();
            this.version = (yield this.znp.request(Subsystem.SYS, 'version', {})).payload;
            debug(`Detected znp version '${tstype_1.ZnpVersion[this.version.product]}' (${JSON.stringify(this.version)})`);
            return yield startZnp_1.default(this.znp, this.version.product, this.networkOptions, this.backupPath);
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.closing = true;
            yield this.znp.close();
        });
    }
    getCoordinator() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.queue.execute(() => __awaiter(this, void 0, void 0, function* () {
                const activeEpRsp = this.znp.waitFor(unpi_1.Constants.Type.AREQ, Subsystem.ZDO, 'activeEpRsp');
                yield this.znp.request(Subsystem.ZDO, 'activeEpReq', { dstaddr: 0, nwkaddrofinterest: 0 });
                const activeEp = yield activeEpRsp;
                const deviceInfo = yield this.znp.request(Subsystem.UTIL, 'getDeviceInfo', {});
                const endpoints = [];
                for (const endpoint of activeEp.payload.activeeplist) {
                    const simpleDescRsp = this.znp.waitFor(unpi_1.Constants.Type.AREQ, Subsystem.ZDO, 'simpleDescRsp', { endpoint });
                    this.znp.request(Subsystem.ZDO, 'simpleDescReq', { dstaddr: 0, nwkaddrofinterest: 0, endpoint });
                    const simpleDesc = yield simpleDescRsp;
                    endpoints.push({
                        ID: simpleDesc.payload.endpoint,
                        profileID: simpleDesc.payload.profileid,
                        deviceID: simpleDesc.payload.deviceid,
                        inputClusters: simpleDesc.payload.inclusterlist,
                        outputClusters: simpleDesc.payload.outclusterlist,
                    });
                }
                return {
                    networkAddress: 0,
                    manufacturerID: 0,
                    ieeeAddr: deviceInfo.payload.ieeeaddr,
                    endpoints,
                };
            }));
        });
    }
    permitJoin(seconds) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.queue.execute(() => __awaiter(this, void 0, void 0, function* () {
                const payload = { addrmode: 0x0F, dstaddr: 0xFFFC, duration: seconds, tcsignificance: 0 };
                yield this.znp.request(Subsystem.ZDO, 'mgmtPermitJoinReq', payload);
            }));
        });
    }
    getCoordinatorVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            return { type: tstype_1.ZnpVersion[this.version.product], meta: this.version };
        });
    }
    softReset() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.znp.request(Subsystem.SYS, 'resetReq', { type: Constants.SYS.resetType.SOFT });
        });
    }
    disableLED() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.znp.request(Subsystem.UTIL, 'ledControl', { ledid: 3, mode: 0 });
        });
    }
    nodeDescriptor(networkAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.queue.execute(() => __awaiter(this, void 0, void 0, function* () {
                const response = this.znp.waitFor(Type.AREQ, Subsystem.ZDO, 'nodeDescRsp', { nwkaddr: networkAddress });
                const payload = { dstaddr: networkAddress, nwkaddrofinterest: networkAddress };
                this.znp.request(Subsystem.ZDO, 'nodeDescReq', payload);
                const descriptor = yield response;
                let type = 'Unknown';
                const logicalType = descriptor.payload.logicaltype_cmplxdescavai_userdescavai & 0x07;
                for (const [key, value] of Object.entries(Constants.ZDO.deviceLogicalType)) {
                    if (value === logicalType) {
                        if (key === 'COORDINATOR')
                            type = 'Coordinator';
                        else if (key === 'ROUTER')
                            type = 'Router';
                        else if (key === 'ENDDEVICE')
                            type = 'EndDevice';
                        break;
                    }
                }
                return { manufacturerCode: descriptor.payload.manufacturercode, type };
            }), networkAddress);
        });
    }
    activeEndpoints(networkAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.queue.execute(() => __awaiter(this, void 0, void 0, function* () {
                const response = this.znp.waitFor(Type.AREQ, Subsystem.ZDO, 'activeEpRsp', { nwkaddr: networkAddress });
                const payload = { dstaddr: networkAddress, nwkaddrofinterest: networkAddress };
                this.znp.request(Subsystem.ZDO, 'activeEpReq', payload);
                const activeEp = yield response;
                return { endpoints: activeEp.payload.activeeplist };
            }), networkAddress);
        });
    }
    simpleDescriptor(networkAddress, endpointID) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.queue.execute(() => __awaiter(this, void 0, void 0, function* () {
                const responsePayload = { nwkaddr: networkAddress, endpoint: endpointID };
                const response = this.znp.waitFor(Type.AREQ, Subsystem.ZDO, 'simpleDescRsp', responsePayload);
                const payload = { dstaddr: networkAddress, nwkaddrofinterest: networkAddress, endpoint: endpointID };
                this.znp.request(Subsystem.ZDO, 'simpleDescReq', payload);
                const descriptor = yield response;
                return {
                    profileID: descriptor.payload.profileid,
                    endpointID: descriptor.payload.endpoint,
                    deviceID: descriptor.payload.deviceid,
                    inputClusters: descriptor.payload.inclusterlist,
                    outputClusters: descriptor.payload.outclusterlist,
                };
            }), networkAddress);
        });
    }
    sendZclFrameNetworkAddressWithResponse(networkAddress, endpoint, zclFrame) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.queue.execute(() => __awaiter(this, void 0, void 0, function* () {
                const command = zclFrame.getCommand();
                if (!command.hasOwnProperty('response')) {
                    throw new Error(`Command '${command.name}' has no response, cannot wait for response`);
                }
                const defaultResponse = !zclFrame.Header.frameControl.disableDefaultResponse ?
                    this.waitDefaultResponse(networkAddress, endpoint, zclFrame) : null;
                const responsePayload = {
                    networkAddress, endpoint, transactionSequenceNumber: zclFrame.Header.transactionSequenceNumber,
                    clusterID: zclFrame.ClusterID, frameType: zclFrame.Header.frameControl.frameType,
                    direction: zcl_1.Direction.SERVER_TO_CLIENT, commandIdentifier: command.response,
                };
                const response = this.waitress.waitFor(responsePayload, DefaultTimeout);
                try {
                    yield this.dataRequest(networkAddress, endpoint, 1, zclFrame.ClusterID, Constants.AF.DEFAULT_RADIUS, zclFrame.toBuffer());
                }
                catch (error) {
                    if (defaultResponse) {
                        this.waitress.remove(defaultResponse.ID);
                    }
                    this.waitress.remove(response.ID);
                    throw error;
                }
                if (defaultResponse) {
                    const result = yield Promise.all([response.promise, defaultResponse.promise]);
                    return result[0];
                }
                else {
                    return yield response.promise;
                }
            }), networkAddress);
        });
    }
    sendZclFrameNetworkAddress(networkAddress, endpoint, zclFrame) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.queue.execute(() => __awaiter(this, void 0, void 0, function* () {
                const defaultResponse = !zclFrame.Header.frameControl.disableDefaultResponse ?
                    this.waitDefaultResponse(networkAddress, endpoint, zclFrame) : null;
                try {
                    yield this.dataRequest(networkAddress, endpoint, 1, zclFrame.ClusterID, Constants.AF.DEFAULT_RADIUS, zclFrame.toBuffer());
                }
                catch (error) {
                    if (defaultResponse) {
                        this.waitress.remove(defaultResponse.ID);
                    }
                    throw error;
                }
                if (defaultResponse) {
                    yield defaultResponse.promise;
                }
            }), networkAddress);
        });
    }
    sendZclFrameGroup(groupID, zclFrame) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.queue.execute(() => __awaiter(this, void 0, void 0, function* () {
                yield this.dataRequestExtended(Constants.COMMON.addressMode.ADDR_GROUP, groupID, 0xFF, 1, zclFrame.ClusterID, Constants.AF.DEFAULT_RADIUS, zclFrame.toBuffer());
            }));
        });
    }
    lqi(networkAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.queue.execute(() => __awaiter(this, void 0, void 0, function* () {
                const response = this.znp.waitFor(Type.AREQ, Subsystem.ZDO, 'mgmtLqiRsp', { srcaddr: networkAddress });
                this.znp.request(Subsystem.ZDO, 'mgmtLqiReq', { dstaddr: networkAddress, startindex: 0 });
                const result = yield response;
                if (result.payload.status !== 0) {
                    throw new Error(`LQI for '${networkAddress}' failed`);
                }
                const neighbors = [];
                for (const entry of result.payload.neighborlqilist) {
                    neighbors.push({
                        linkquality: entry.lqi,
                        networkAddress: entry.nwkAddr,
                        ieeeAddr: entry.extAddr,
                    });
                }
                return { neighbors };
            }), networkAddress);
        });
    }
    routingTable(networkAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.queue.execute(() => __awaiter(this, void 0, void 0, function* () {
                const response = this.znp.waitFor(Type.AREQ, Subsystem.ZDO, 'mgmtRtgRsp', { srcaddr: networkAddress });
                this.znp.request(Subsystem.ZDO, 'mgmtRtgReq', { dstaddr: networkAddress, startindex: 0 });
                const result = yield response;
                if (result.payload.status !== 0) {
                    throw new Error(`Routing table for '${networkAddress}' failed`);
                }
                const table = [];
                for (const entry of result.payload.routingtablelist) {
                    table.push({
                        destinationAddress: entry.destNwkAddr,
                        status: entry.routeStatus,
                        nextHop: entry.nextHopNwkAddr,
                    });
                }
                return { table };
            }), networkAddress);
        });
    }
    bind(destinationNetworkAddress, sourceIeeeAddress, sourceEndpoint, clusterID, destinationAddressOrGroup, type, destinationEndpoint) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.queue.execute(() => __awaiter(this, void 0, void 0, function* () {
                const responsePayload = { srcaddr: destinationNetworkAddress };
                const response = this.znp.waitFor(Type.AREQ, Subsystem.ZDO, 'bindRsp', responsePayload);
                const payload = {
                    dstaddr: destinationNetworkAddress,
                    srcaddr: sourceIeeeAddress,
                    srcendpoint: sourceEndpoint,
                    clusterid: clusterID,
                    dstaddrmode: type === 'group' ?
                        Constants.COMMON.addressMode.ADDR_GROUP : Constants.COMMON.addressMode.ADDR_64BIT,
                    dstaddress: this.toAddressString(destinationAddressOrGroup),
                    dstendpoint: type === 'group' ? 0xFF : destinationEndpoint,
                };
                this.znp.request(Subsystem.ZDO, 'bindReq', payload);
                yield response;
            }), destinationNetworkAddress);
        });
    }
    unbind(destinationNetworkAddress, sourceIeeeAddress, sourceEndpoint, clusterID, destinationAddressOrGroup, type, destinationEndpoint) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.queue.execute(() => __awaiter(this, void 0, void 0, function* () {
                const response = this.znp.waitFor(Type.AREQ, Subsystem.ZDO, 'unbindRsp', { srcaddr: destinationNetworkAddress });
                const payload = {
                    dstaddr: destinationNetworkAddress,
                    srcaddr: sourceIeeeAddress,
                    srcendpoint: sourceEndpoint,
                    clusterid: clusterID,
                    dstaddrmode: type === 'group' ?
                        Constants.COMMON.addressMode.ADDR_GROUP : Constants.COMMON.addressMode.ADDR_64BIT,
                    dstaddress: this.toAddressString(destinationAddressOrGroup),
                    dstendpoint: type === 'group' ? 0xFF : destinationEndpoint,
                };
                this.znp.request(Subsystem.ZDO, 'unbindReq', payload);
                yield response;
            }), destinationNetworkAddress);
        });
    }
    removeDevice(networkAddress, ieeeAddr) {
        return this.queue.execute(() => __awaiter(this, void 0, void 0, function* () {
            const response = this.znp.waitFor(unpi_1.Constants.Type.AREQ, Subsystem.ZDO, 'mgmtLeaveRsp', { srcaddr: networkAddress });
            const payload = {
                dstaddr: networkAddress,
                deviceaddress: ieeeAddr,
                removechildrenRejoin: 0,
            };
            this.znp.request(Subsystem.ZDO, 'mgmtLeaveReq', payload);
            yield response;
        }), networkAddress);
    }
    /**
     * Event handlers
     */
    onZnpClose() {
        if (!this.closing) {
            this.emit(Events.Events.disconnected);
        }
    }
    onZnpRecieved(object) {
        if (object.type !== unpi_1.Constants.Type.AREQ) {
            return;
        }
        if (object.subsystem === Subsystem.ZDO) {
            if (object.command === 'tcDeviceInd') {
                const payload = {
                    networkAddress: object.payload.nwkaddr,
                    ieeeAddr: object.payload.extaddr,
                };
                this.emit(Events.Events.deviceJoined, payload);
            }
            else if (object.command === 'endDeviceAnnceInd') {
                const payload = {
                    networkAddress: object.payload.nwkaddr,
                    ieeeAddr: object.payload.ieeeaddr,
                };
                this.emit(Events.Events.deviceAnnounce, payload);
            }
            else {
                /* istanbul ignore else */
                if (object.command === 'leaveInd') {
                    const payload = {
                        networkAddress: object.payload.srcaddr,
                        ieeeAddr: object.payload.extaddr,
                    };
                    this.emit(Events.Events.deviceLeave, payload);
                }
            }
        }
        else {
            /* istanbul ignore else */
            if (object.subsystem === Subsystem.AF) {
                /* istanbul ignore else */
                if (object.command === 'incomingMsg' || object.command === 'incomingMsgExt') {
                    const payload = this.incomingMsgToZclDataPayload(object);
                    this.waitress.resolve(payload);
                    this.emit(Events.Events.zclData, payload);
                }
            }
        }
    }
    getNetworkParameters() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.znp.request(Subsystem.ZDO, 'extNwkInfo', {});
            return {
                panID: result.payload.panid, extendedPanID: result.payload.extendedpanid,
                channel: result.payload.channel
            };
        });
    }
    supportsBackup() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.version.product !== tstype_1.ZnpVersion.zStack12;
        });
    }
    backup() {
        return __awaiter(this, void 0, void 0, function* () {
            return backup_1.Backup(this.znp);
        });
    }
    /**
     * Private methods
     */
    dataRequest(destinationAddress, destinationEndpoint, sourceEndpoint, clusterID, radius, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionID = this.nextTransactionID();
            const response = this.znp.waitFor(Type.AREQ, Subsystem.AF, 'dataConfirm', { transid: transactionID });
            yield this.znp.request(Subsystem.AF, 'dataRequest', {
                dstaddr: destinationAddress,
                destendpoint: destinationEndpoint,
                srcendpoint: sourceEndpoint,
                clusterid: clusterID,
                transid: transactionID,
                options: 0,
                radius: radius,
                len: data.length,
                data: data,
            });
            const dataConfirm = yield response;
            if (dataConfirm.payload.status !== 0) {
                throw new Error(`Data request failed with error: ` +
                    `'${DataConfirmCodeLookup[dataConfirm.payload.status]}' (${dataConfirm.payload.status})`);
            }
            return dataConfirm;
        });
    }
    ;
    dataRequestExtended(addressMode, destinationAddressOrGroupID, destinationEndpoint, sourceEndpoint, clusterID, radius, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionID = this.nextTransactionID();
            const response = this.znp.waitFor(Type.AREQ, Subsystem.AF, 'dataConfirm', { transid: transactionID });
            yield this.znp.request(Subsystem.AF, 'dataRequestExt', {
                dstaddrmode: addressMode,
                dstaddr: this.toAddressString(destinationAddressOrGroupID),
                destendpoint: destinationEndpoint,
                dstpanid: 0,
                srcendpoint: sourceEndpoint,
                clusterid: clusterID,
                transid: transactionID,
                options: 0,
                radius,
                len: data.length,
                data: data,
            });
            const dataConfirm = yield response;
            if (dataConfirm.payload.status !== 0) {
                throw new Error(`Data request failed with error: ` +
                    `'${DataConfirmCodeLookup[dataConfirm.payload.status]}' (${dataConfirm.payload.status})`);
            }
            return dataConfirm;
        });
    }
    ;
    nextTransactionID() {
        this.transactionID++;
        if (this.transactionID > 255) {
            this.transactionID = 1;
        }
        return this.transactionID;
    }
    toAddressString(address) {
        if (typeof address === 'number') {
            let addressString = address.toString(16);
            for (let i = addressString.length; i < 16; i++) {
                addressString = '0' + addressString;
            }
            return `0x${addressString}`;
        }
        else {
            return address.toString();
        }
    }
    incomingMsgToZclDataPayload(object) {
        return {
            frame: zcl_1.ZclFrame.fromBuffer(object.payload.clusterid, object.payload.data),
            networkAddress: object.payload.srcaddr,
            endpoint: object.payload.srcendpoint,
            linkquality: object.payload.linkquality,
            groupID: object.payload.groupid,
        };
    }
    waitDefaultResponse(networkAddress, endpoint, zclFrame) {
        const payload = {
            networkAddress, endpoint, transactionSequenceNumber: zclFrame.Header.transactionSequenceNumber,
            clusterID: zclFrame.ClusterID, frameType: zcl_1.FrameType.GLOBAL, direction: zcl_1.Direction.SERVER_TO_CLIENT,
            commandIdentifier: zcl_1.Foundation.defaultRsp.ID,
        };
        return this.waitress.waitFor(payload, DefaultResponseTimeout);
    }
    waitressTimeoutFormatter(matcher, timeout) {
        return `Timeout - ${matcher.networkAddress} - ${matcher.endpoint}` +
            ` - ${matcher.transactionSequenceNumber} - ${matcher.commandIdentifier} after ${timeout}ms`;
    }
    waitressValidator(payload, matcher) {
        return payload.networkAddress === matcher.networkAddress && payload.endpoint === matcher.endpoint &&
            payload.frame.Header.transactionSequenceNumber === matcher.transactionSequenceNumber &&
            payload.frame.ClusterID === matcher.clusterID &&
            matcher.frameType === payload.frame.Header.frameControl.frameType &&
            matcher.commandIdentifier === payload.frame.Header.commandIdentifier &&
            matcher.direction === payload.frame.Header.frameControl.direction;
    }
}
exports.default = ZStackAdapter;
//# sourceMappingURL=zStackAdapter.js.map