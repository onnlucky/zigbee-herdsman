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
const events_1 = __importDefault(require("events"));
const database_1 = __importDefault(require("./database"));
const adapter_1 = require("../adapter");
const model_1 = require("./model");
const helpers_1 = require("./helpers");
const Events = __importStar(require("./events"));
const debug_1 = __importDefault(require("debug"));
const fs_1 = __importDefault(require("fs"));
// @ts-ignore
const mixin_deep_1 = __importDefault(require("mixin-deep"));
const group_1 = __importDefault(require("./model/group"));
;
const DefaultOptions = {
    network: {
        networkKeyDistribute: false,
        networkKey: [0x01, 0x03, 0x05, 0x07, 0x09, 0x0B, 0x0D, 0x0F, 0x00, 0x02, 0x04, 0x06, 0x08, 0x0A, 0x0C, 0x0D],
        panID: 0x1a62,
        extenedPanID: [0xDD, 0xDD, 0xDD, 0xDD, 0xDD, 0xDD, 0xDD, 0xDD],
        channelList: [11],
    },
    serialPort: {
        baudRate: 115200,
        rtscts: true,
        path: undefined,
    },
    databasePath: undefined,
    backupPath: undefined,
};
const debug = {
    error: debug_1.default('zigbee-herdsman:controller:error'),
    log: debug_1.default('zigbee-herdsman:controller:log'),
};
const OneJanuary2000 = new Date('January 01, 2000 00:00:00').getTime();
function reviveValue(value) {
    if (value.type === 'Group') {
        return group_1.default.fromDatabaseRecord(value);
    }
    return model_1.Device.fromDatabaseRecord(value);
}
class Controller extends events_1.default.EventEmitter {
    constructor(options) {
        super();
        this.options = mixin_deep_1.default(DefaultOptions, options);
        this.adapter = new adapter_1.ZStackAdapter(this.options.network, this.options.serialPort, this.options.backupPath);
        this.adapter.on(adapter_1.Events.Events.deviceJoined, this.onDeviceJoined.bind(this));
        this.adapter.on(adapter_1.Events.Events.zclData, this.onZclData.bind(this));
        this.adapter.on(adapter_1.Events.Events.disconnected, this.onAdapterDisconnected.bind(this));
        this.adapter.on(adapter_1.Events.Events.deviceAnnounce, this.onDeviceAnnounce.bind(this));
        this.adapter.on(adapter_1.Events.Events.deviceLeave, this.onDeviceLeave.bind(this));
        // Validate options
        for (const channel of this.options.network.channelList) {
            if (channel < 11 || channel > 26) {
                throw new Error(`'${channel}' is an invalid channel, use a channel between 11 - 26.`);
            }
        }
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            debug.log(`Starting with options '${JSON.stringify(this.options)}'`);
            model_1.Device.reload();
            group_1.default.reload();
            this.database = yield database_1.default.open(this.options.databasePath, reviveValue);
            const startResult = yield this.adapter.start();
            debug.log(`Started with result '${startResult}'`);
            // Inject adapter and database in entity
            model_1.Entity.injectAdapter(this.adapter);
            model_1.Entity.injectDatabse(this.database);
            if (startResult === 'resetted') {
                debug.log('Clearing database...');
                for (const group of group_1.default.all()) {
                    group.removeFromDatabase();
                }
                for (const device of model_1.Device.all()) {
                    device.removeFromDatabase();
                }
            }
            // Add coordinator to the database if it is not there yet.
            if ((model_1.Device.byType('Coordinator')) === null) {
                debug.log('No coordinator in database, querying...');
                const coordinator = yield this.adapter.getCoordinator();
                model_1.Device.create('Coordinator', coordinator.ieeeAddr, coordinator.networkAddress, coordinator.manufacturerID, undefined, undefined, undefined, coordinator.endpoints);
            }
            // Set backup timer to 1 day.
            yield this.backup();
            this.backupTimer = setInterval(() => this.backup(), 86400000);
        });
    }
    permitJoin(permit) {
        return __awaiter(this, void 0, void 0, function* () {
            if (permit && !this.getPermitJoin()) {
                debug.log('Permit joining');
                yield this.adapter.permitJoin(254);
                // Zigbee 3 networks automatically close after max 255 seconds, keep network open.
                this.permitJoinTimer = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                    debug.log('Permit joining');
                    yield this.adapter.permitJoin(254);
                }), 200 * 1000);
            }
            else if (permit && this.getPermitJoin()) {
                debug.log('Joining already permitted');
            }
            else {
                debug.log('Disable joining');
                yield this.adapter.permitJoin(0);
                if (this.permitJoinTimer) {
                    clearInterval(this.permitJoinTimer);
                    this.permitJoinTimer = null;
                }
            }
        });
    }
    getPermitJoin() {
        return this.permitJoinTimer != null;
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.permitJoin(false);
            clearInterval(this.backupTimer);
            yield this.backup();
            yield this.adapter.stop();
        });
    }
    backup() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.options.backupPath && this.adapter.supportsBackup()) {
                debug.log('Creating coordinator backup');
                const backup = yield this.adapter.backup();
                fs_1.default.writeFileSync(this.options.backupPath, JSON.stringify(backup, null, 2));
                debug.log(`Wrote coordinator backup to '${this.options.backupPath}'`);
            }
        });
    }
    softReset() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.adapter.softReset();
        });
    }
    getCoordinatorVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.adapter.getCoordinatorVersion();
        });
    }
    getNetworkParameters() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.adapter.getNetworkParameters();
        });
    }
    getDeviceByAddress(ieeeAddr) {
        return model_1.Device.byAddress(ieeeAddr);
    }
    getDevice(query) {
        return model_1.Device.findSingle(query);
    }
    getDevices(query) {
        return model_1.Device.find(query);
    }
    createGroup(groupID) {
        return group_1.default.create(groupID);
    }
    getGroupByID(groupID) {
        return group_1.default.byID(groupID);
    }
    getGroup(query) {
        return group_1.default.findSingle(query);
    }
    getGroups(query) {
        return group_1.default.find(query);
    }
    disableLED() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.adapter.disableLED();
        });
    }
    onDeviceAnnounce(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            debug.log(`Device announce '${payload.ieeeAddr}'`);
            const data = { device: model_1.Device.byAddress(payload.ieeeAddr) };
            this.emit(Events.Events.deviceAnnounce, data);
        });
    }
    onDeviceLeave(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            debug.log(`Device leave '${payload.ieeeAddr}'`);
            const device = model_1.Device.byAddress(payload.ieeeAddr);
            if (device) {
                debug.log(`Removing device from database '${payload.ieeeAddr}'`);
                device.removeFromDatabase();
            }
            const data = { ieeeAddr: payload.ieeeAddr };
            this.emit(Events.Events.deviceLeave, data);
        });
    }
    onAdapterDisconnected() {
        return __awaiter(this, void 0, void 0, function* () {
            debug.log(`Adapter disconnected'`);
            try {
                yield this.adapter.stop();
            }
            catch (error) {
            }
            this.emit(Events.Events.adapterDisconnected);
        });
    }
    onDeviceJoined(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            let device = model_1.Device.byAddress(payload.ieeeAddr);
            debug.log(`Device joined '${payload.ieeeAddr}'`);
            if (!device) {
                debug.log(`New device '${payload.ieeeAddr}' joined`);
                debug.log(`Creating device '${payload.ieeeAddr}'`);
                device = model_1.Device.create(undefined, payload.ieeeAddr, payload.networkAddress, undefined, undefined, undefined, undefined, []);
                const eventData = { device };
                this.emit(Events.Events.deviceJoined, eventData);
            }
            else if (device.networkAddress !== payload.networkAddress) {
                debug.log(`Device '${payload.ieeeAddr}' is already in database with different networkAddress, ` +
                    `updating networkAddress`);
                device.set('networkAddress', payload.networkAddress);
            }
            if (!device.interviewCompleted && !device.interviewing) {
                const payloadStart = { status: 'started', device };
                debug.log(`Interview '${device.ieeeAddr}' start`);
                this.emit(Events.Events.deviceInterview, payloadStart);
                try {
                    yield device.interview();
                    debug.log(`Succesfully interviewed '${device.ieeeAddr}'`);
                    const event = { status: 'successful', device };
                    this.emit(Events.Events.deviceInterview, event);
                }
                catch (error) {
                    debug.error(`Interview failed for '${device.ieeeAddr} with error '${error}'`);
                    const event = { status: 'failed', device };
                    this.emit(Events.Events.deviceInterview, event);
                }
            }
            else {
                debug.log(`Not interviewing '${payload.ieeeAddr}', completed '${device.interviewCompleted}', ` +
                    `in progress '${device.interviewing}'`);
            }
        });
    }
    onZclData(zclData) {
        return __awaiter(this, void 0, void 0, function* () {
            debug.log(`Received ZCL data '${JSON.stringify(zclData)}'`);
            const device = model_1.Device.byNetworkAddress(zclData.networkAddress);
            if (!device) {
                debug.log(`ZCL data is from unknown device with network adress '${zclData.networkAddress}', skipping...`);
                return;
            }
            let endpoint = device.getEndpoint(zclData.endpoint);
            if (!endpoint) {
                debug.log(`ZCL data is from unknown endpoint '${zclData.endpoint}' from device with network adress` +
                    `'${zclData.networkAddress}', creating it...`);
                endpoint = device.createEndpoint(zclData.endpoint);
            }
            // Parse command for event
            const frame = zclData.frame;
            const command = frame.getCommand();
            let type = undefined;
            let data;
            if (frame.isGlobal()) {
                if (frame.isCommand('report')) {
                    type = 'attributeReport';
                    data = helpers_1.ZclFrameConverter.attributeList(zclData.frame);
                }
                else {
                    /* istanbul ignore else */
                    if (frame.isCommand('readRsp')) {
                        type = 'readResponse';
                        data = helpers_1.ZclFrameConverter.attributeList(zclData.frame);
                    }
                }
            }
            else {
                /* istanbul ignore else */
                if (frame.isSpecific()) {
                    if (Events.CommandsLookup[command.name]) {
                        type = Events.CommandsLookup[command.name];
                        data = zclData.frame.Payload;
                    }
                    else {
                        debug.log(`Skipping command '${command.name}' because it is missing from the lookup`);
                    }
                }
            }
            // Some device report it's modelID through a readResponse or attributeReport
            if ((type === 'readResponse' || type === 'attributeReport') && data.modelId && !device.modelID) {
                device.set('modelID', data.modelId);
            }
            if (type && data) {
                const endpoint = device.getEndpoint(zclData.endpoint);
                const linkquality = zclData.linkquality;
                const groupID = zclData.groupID;
                const cluster = frame.getCluster().name;
                const eventData = {
                    type: type, device, endpoint, data, linkquality, groupID, cluster
                };
                this.emit(Events.Events.message, eventData);
            }
            // Send a default response if necessary.
            if (!zclData.frame.Header.frameControl.disableDefaultResponse) {
                try {
                    yield endpoint.defaultResponse(zclData.frame.getCommand().ID, 0, zclData.frame.ClusterID, zclData.frame.Header.transactionSequenceNumber);
                }
                catch (error) {
                    debug.error(`Default response to ${zclData.networkAddress} failed`);
                }
            }
            // Reponse to time reads
            if (frame.isGlobal() && frame.isCluster('genTime') && frame.isCommand('read')) {
                const time = Math.round(((new Date()).getTime() - OneJanuary2000) / 1000);
                endpoint.readResponse(frame.getCluster().ID, frame.Header.transactionSequenceNumber, { time });
            }
        });
    }
}
exports.default = Controller;
//# sourceMappingURL=controller.js.map