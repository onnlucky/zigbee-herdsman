"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const endpoint_1 = __importDefault(require("./endpoint"));
const entity_1 = __importDefault(require("./entity"));
const utils_1 = require("../../utils");
const Zcl = __importStar(require("../../zcl"));
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default('zigbee-herdsman:controller:device');
class Device extends entity_1.default {
    constructor(ID, type, ieeeAddr, networkAddress, manufacturerID, endpoints, manufacturerName, powerSource, modelID, applicationVersion, stackVersion, zclVersion, hardwareVersion, dateCode, softwareBuildID, interviewCompleted, meta) {
        super();
        this.ID = ID;
        this.type = type;
        this.ieeeAddr = ieeeAddr;
        this.networkAddress = networkAddress;
        this.manufacturerID = manufacturerID;
        this.endpoints = endpoints;
        this.manufacturerName = manufacturerName;
        this.powerSource = powerSource;
        this.modelID = modelID;
        this.applicationVersion = applicationVersion;
        this.stackVersion = stackVersion;
        this.zclVersion = zclVersion;
        this.hardwareVersion = hardwareVersion;
        this.dateCode = dateCode;
        this.softwareBuildID = softwareBuildID;
        this.interviewCompleted = interviewCompleted;
        this.interviewing = false;
        this.meta = meta;
    }
    static reload() { Device.lookup = {}; }
    isType(type) {
        return type === 'device';
    }
    /**
     * Getters, setters and creaters
     */
    createEndpoint(ID) {
        if (this.getEndpoint(ID)) {
            throw new Error(`Device '${this.ieeeAddr}' already has an endpoint '${ID}'`);
        }
        const endpoint = endpoint_1.default.create(ID, undefined, undefined, [], [], this.networkAddress, this.ieeeAddr);
        this.endpoints.push(endpoint);
        this.save();
        return endpoint;
    }
    getEndpoints() {
        return this.endpoints;
    }
    getEndpoint(ID) {
        return this.endpoints.find((e) => e.ID === ID);
    }
    get(key) {
        return this[key];
    }
    set(key, value) {
        if (typeof value === 'string' && (key === 'modelID')) {
            this[key] = value;
        }
        else {
            /* istanbul ignore else */
            if (typeof value === 'number' && (key === 'networkAddress')) {
                this[key] = value;
            }
        }
        this.save();
    }
    /**
     * CRUD
     */
    static fromDatabaseRecord(record) {
        const networkAddress = record.nwkAddr;
        const ieeeAddr = record.ieeeAddr;
        const endpoints = Object.values(record.endpoints).map((e) => {
            return endpoint_1.default.fromDatabaseRecord(e, networkAddress, ieeeAddr);
        });
        const meta = record.meta ? record.meta : {};
        const device = new Device(record.id, record.type, ieeeAddr, networkAddress, record.manufId, endpoints, record.manufName, record.powerSource, record.modelId, record.appVersion, record.stackVersion, record.zclVersion, record.hwVersion, record.dateCode, record.swBuildId, record.interviewCompleted, meta);
        Device.lookup[device.ieeeAddr] = device;
        return device;
    }
    toDatabaseRecord() {
        const epList = this.endpoints.map((e) => e.ID);
        const endpoints = {};
        for (const endpoint of this.endpoints) {
            endpoints[endpoint.ID] = endpoint.toDatabaseRecord();
        }
        return {
            id: this.ID, type: this.type, ieeeAddr: this.ieeeAddr, nwkAddr: this.networkAddress,
            manufId: this.manufacturerID, manufName: this.manufacturerName, powerSource: this.powerSource,
            modelId: this.modelID, epList, endpoints, appVersion: this.applicationVersion,
            stackVersion: this.stackVersion, hwVersion: this.hardwareVersion, dateCode: this.dateCode,
            swBuildId: this.softwareBuildID, zclVersion: this.zclVersion, interviewCompleted: this.interviewCompleted,
            meta: this.meta,
        };
    }
    save() {
        Device.database.update(this.ID, this.toDatabaseRecord());
    }
    static all() {
        return Object.values(Device.lookup);
    }
    static byAddress(ieeeAddr) {
        return Device.lookup[ieeeAddr];
    }
    static byNetworkAddress(networkAddress) {
        return Object.values(Device.lookup).find(d => d.networkAddress === networkAddress);
    }
    static byType(type) {
        const all = Object.values(Device.lookup).filter(d => d.type === type);
        if (all.length !== 1)
            return null;
        return all[0];
    }
    static findSingle(query) {
        const result = Device.find(query);
        if (result.length === 1)
            return result[0];
        return undefined;
    }
    static find(query) {
        const queryKeys = Object.keys(query);
        // fast path
        if (queryKeys.length === 1 && query.ieeeAddr) {
            const device = Device.byAddress(query.ieeeAddr);
            return device ? [device] : [];
        }
        return Device.all().filter((d) => {
            for (const key of queryKeys) {
                if (d[key] != query[key])
                    return false;
            }
            return true;
        });
    }
    static create(type, ieeeAddr, networkAddress, manufacturerID, manufacturerName, powerSource, modelID, endpoints) {
        if (Device.byAddress(ieeeAddr)) {
            throw new Error(`Device with ieeeAddr '${ieeeAddr}' already exists`);
        }
        const endpointsMapped = endpoints.map((e) => {
            return endpoint_1.default.create(e.ID, e.profileID, e.deviceID, e.inputClusters, e.outputClusters, networkAddress, ieeeAddr);
        });
        const ID = Device.database.newID();
        const device = new Device(ID, type, ieeeAddr, networkAddress, manufacturerID, endpointsMapped, manufacturerName, powerSource, modelID, undefined, undefined, undefined, undefined, undefined, undefined, false, {});
        Device.database.insert(device.toDatabaseRecord());
        Device.lookup[device.ieeeAddr] = device;
        return device;
    }
    /**
     * Zigbee functions
     */
    interview() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.interviewing) {
                const message = `Interview - interview already in progress for '${this.ieeeAddr}'`;
                debug(message);
                throw new Error(message);
            }
            let error;
            this.interviewing = true;
            debug(`Interview - start device '${this.ieeeAddr}'`);
            try {
                yield this.interviewInternal();
                debug(`Interview - completed for device '${this.ieeeAddr}'`);
                this.interviewCompleted = true;
            }
            catch (e) {
                error = e;
            }
            finally {
                this.interviewing = false;
                this.save();
            }
            if (error) {
                throw error;
            }
        });
    }
    interviewInternal() {
        return __awaiter(this, void 0, void 0, function* () {
            const nodeDescriptorQuery = () => __awaiter(this, void 0, void 0, function* () {
                const nodeDescriptor = yield Device.adapter.nodeDescriptor(this.networkAddress);
                this.manufacturerID = nodeDescriptor.manufacturerCode;
                this.type = nodeDescriptor.type;
                this.save();
                debug(`Interview - got node descriptor for device '${this.ieeeAddr}'`);
            });
            const isXiaomiAndInterviewCompleted = () => {
                // Xiaomi end devices have a different interview procedure, after pairing they report it's
                // modelID trough a readResponse. The readResponse is received by the controller and set on the device
                // Check if we have a modelID starting with lumi.* at this point, indicating a Xiaomi end device.
                if (this.modelID && this.modelID.startsWith('lumi.')) {
                    debug('Node descriptor request failed for the second time, got modelID starting with lumi, ' +
                        'assuming Xiaomi end device');
                    this.type = 'EndDevice';
                    this.manufacturerID = 4151;
                    this.manufacturerName = 'LUMI';
                    this.powerSource = 'Battery';
                    this.interviewing = false;
                    this.interviewCompleted = true;
                    this.save();
                    return true;
                }
                else {
                    return false;
                }
            };
            try {
                yield nodeDescriptorQuery();
            }
            catch (error1) {
                try {
                    // Most of the times the first node descriptor query fails and the seconds one succeeds.
                    debug(`Interview - first node descriptor request failed for '${this.ieeeAddr}', retrying...`);
                    yield nodeDescriptorQuery();
                }
                catch (error2) {
                    if (isXiaomiAndInterviewCompleted()) {
                        return;
                    }
                    else {
                        throw error2;
                    }
                }
            }
            const activeEndpoints = yield Device.adapter.activeEndpoints(this.networkAddress);
            this.endpoints = activeEndpoints.endpoints.map((e) => {
                return endpoint_1.default.create(e, undefined, undefined, [], [], this.networkAddress, this.ieeeAddr);
            });
            this.save();
            debug(`Interview - got active endpoints for device '${this.ieeeAddr}'`);
            for (const endpoint of this.endpoints) {
                const simpleDescriptor = yield Device.adapter.simpleDescriptor(this.networkAddress, endpoint.ID);
                endpoint.set('profileID', simpleDescriptor.profileID);
                endpoint.set('deviceID', simpleDescriptor.deviceID);
                endpoint.set('inputClusters', simpleDescriptor.inputClusters);
                endpoint.set('outputClusters', simpleDescriptor.outputClusters);
                debug(`Interview - got simple descriptor for endpoint '${endpoint.ID}' device '${this.ieeeAddr}'`);
                this.save();
            }
            if (this.endpoints.length !== 0) {
                const endpoint = this.endpoints[0];
                const attributes = [
                    'manufacturerName', 'modelId', 'powerSource', 'zclVersion', 'appVersion',
                    'stackVersion', 'hwVersion', 'dateCode', 'swBuildId'
                ];
                // Split into chunks of 3, otherwise some devices fail to respond.
                for (const chunk of utils_1.ArraySplitChunks(attributes, 3)) {
                    const result = yield endpoint.read('genBasic', chunk);
                    for (const [key, value] of Object.entries(result)) {
                        if (key === 'manufacturerName')
                            this.manufacturerName = value;
                        else if (key === 'modelId')
                            this.modelID = value;
                        else if (key === 'zclVersion')
                            this.zclVersion = value;
                        else if (key === 'appVersion')
                            this.applicationVersion = value;
                        else if (key === 'stackVersion')
                            this.stackVersion = value;
                        else if (key === 'hwVersion')
                            this.hardwareVersion = value;
                        else if (key === 'dateCode')
                            this.dateCode = value;
                        else if (key === 'swBuildId')
                            this.softwareBuildID = value;
                        else {
                            /* istanbul ignore else */
                            if (key === 'powerSource')
                                this.powerSource = Zcl.PowerSource[value];
                        }
                    }
                    debug(`Interview - got '${chunk}' for device '${this.ieeeAddr}'`);
                    this.save();
                }
            }
            else {
                debug(`Interview - skip reading attributes because of no endpoint for device '${this.ieeeAddr}'`);
                throw new Error(`Interview failed because of not endpiont ('${this.ieeeAddr}')`);
            }
            // Enroll IAS device
            for (const endpoint of this.endpoints.filter((e) => e.supportsInputCluster('ssIasZone'))) {
                debug(`Interview - ssIasZone enrolling '${this.ieeeAddr}' endpoint '${endpoint.ID}'`);
                const coordinator = Device.byType('Coordinator');
                yield endpoint.write('ssIasZone', { 'iasCieAddr': coordinator.ieeeAddr });
                // According to the spec, we should wait for an enrollRequest here, but the Bosch ISW-ZPR1 didn't send it.
                yield utils_1.Wait(3000);
                yield endpoint.command('ssIasZone', 'enrollRsp', { enrollrspcode: 0, zoneid: 23 });
                debug(`Interview - succesfully enrolled '${this.ieeeAddr}' endpoint '${endpoint.ID}'`);
            }
        });
    }
    removeFromNetwork() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Device.adapter.removeDevice(this.networkAddress, this.ieeeAddr);
            this.removeFromDatabase();
        });
    }
    removeFromDatabase() {
        Device.database.remove(this.ID);
        delete Device.lookup[this.ieeeAddr];
    }
    lqi() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Device.adapter.lqi(this.networkAddress);
        });
    }
    routingTable() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Device.adapter.routingTable(this.networkAddress);
        });
    }
    ping() {
        return __awaiter(this, void 0, void 0, function* () {
            // Zigbee does not have an official pining mechamism. Use a read request
            // of a mandatory basic cluster attribute to keep it as lightweight as
            // possible.
            yield this.endpoints[0].read('genBasic', ['zclVersion']);
        });
    }
}
// This lookup contains all devices that are queried from the database, this is to ensure that always
// the same instance is returned.
Device.lookup = {};
exports.default = Device;
//# sourceMappingURL=device.js.map