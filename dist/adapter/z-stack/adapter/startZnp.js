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
const unpi_1 = require("../unpi");
const Constants = __importStar(require("../constants"));
const fast_deep_equal_1 = __importDefault(require("fast-deep-equal"));
const Zcl = __importStar(require("../../../zcl"));
const tstype_1 = require("./tstype");
const debug_1 = __importDefault(require("debug"));
const backup_1 = require("./backup");
const nvItems_1 = __importDefault(require("./nvItems"));
const fs_1 = __importDefault(require("fs"));
const debug = debug_1.default('zigbee-herdsman:controller:zStack:startZnp');
const Subsystem = unpi_1.Constants.Subsystem;
const EndpointDefaults = {
    appdeviceid: 0x0005,
    appdevver: 0,
    appnuminclusters: 0,
    appinclusterlist: [],
    appnumoutclusters: 0,
    appoutclusterlist: [],
    latencyreq: Constants.AF.networkLatencyReq.NO_LATENCY_REQS,
};
const Endpoints = [
    Object.assign({}, EndpointDefaults, { endpoint: 1, appprofid: 0x0104 }),
    Object.assign({}, EndpointDefaults, { endpoint: 2, appprofid: 0x0101 }),
    Object.assign({}, EndpointDefaults, { endpoint: 3, appprofid: 0x0105 }),
    Object.assign({}, EndpointDefaults, { endpoint: 4, appprofid: 0x0107 }),
    Object.assign({}, EndpointDefaults, { endpoint: 5, appprofid: 0x0108 }),
    Object.assign({}, EndpointDefaults, { endpoint: 6, appprofid: 0x0109 }),
    Object.assign({}, EndpointDefaults, { endpoint: 11, appprofid: 0x0104, appdeviceid: 0x0400, appnumoutclusters: 1, appoutclusterlist: [Zcl.Utils.getCluster('ssIasZone').ID] }),
];
function validateItem(znp, item, message, subsystem = Subsystem.SYS, command = 'osalNvRead') {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield znp.request(subsystem, command, item);
        if (!fast_deep_equal_1.default(result.payload.value, item.value)) {
            debug(`Item '${message}' is invalid, got '${JSON.stringify(result.payload.value)}', ` +
                `expected '${JSON.stringify(item.value)}'`);
            throw new Error();
        }
        else {
            debug(`Item '${message}' is valid`);
        }
    });
}
function needsToBeInitialised(znp, version, options) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield validateItem(znp, nvItems_1.default.znpHasConfigured(version), 'hasConfigured');
            yield validateItem(znp, nvItems_1.default.channelList(options.channelList), 'channelList');
            yield validateItem(znp, nvItems_1.default.networkKeyDistribute(options.networkKeyDistribute), 'networkKeyDistribute');
            if (version === tstype_1.ZnpVersion.zStack3x0) {
                yield validateItem(znp, nvItems_1.default.networkKey(options.networkKey), 'networkKey');
            }
            else {
                yield validateItem(znp, nvItems_1.default.networkKey(options.networkKey), 'networkKey', Subsystem.SAPI, 'readConfiguration');
            }
            if (version === tstype_1.ZnpVersion.zStack12) {
                // TODO: add extendedPanID and panID for zStack 3
                yield validateItem(znp, nvItems_1.default.panID(options.panID), 'panID');
                yield validateItem(znp, nvItems_1.default.extendedPanID(options.extenedPanID), 'extendedPanID');
            }
            return false;
        }
        catch (e) {
            debug(`Error while validating items: '${e}'`);
            return true;
        }
    });
}
function boot(znp) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield znp.request(Subsystem.UTIL, 'getDeviceInfo', {});
        if (result.payload.devicestate !== Constants.COMMON.devStates.ZB_COORD) {
            debug('Start ZNP as coordinator...');
            const started = znp.waitFor(unpi_1.Constants.Type.AREQ, Subsystem.ZDO, 'stateChangeInd', { state: 9 }, 60000);
            znp.request(Subsystem.ZDO, 'startupFromApp', { startdelay: 100 }, [0, 1]);
            yield started;
            debug('ZNP started as coordinator');
        }
        else {
            debug('ZNP is already started as coordinator');
        }
    });
}
function registerEndpoints(znp) {
    return __awaiter(this, void 0, void 0, function* () {
        const activeEpResponse = znp.waitFor(unpi_1.Constants.Type.AREQ, Subsystem.ZDO, 'activeEpRsp');
        znp.request(Subsystem.ZDO, 'activeEpReq', { dstaddr: 0, nwkaddrofinterest: 0 });
        const activeEp = yield activeEpResponse;
        for (const endpoint of Endpoints) {
            if (activeEp.payload.activeeplist.includes(endpoint.endpoint)) {
                debug(`Endpoint '${endpoint.endpoint}' already registered`);
            }
            else {
                debug(`Registering endpoint '${endpoint.endpoint}'`);
                yield znp.request(Subsystem.AF, 'register', endpoint);
            }
        }
    });
}
function initialise(znp, version, options) {
    return __awaiter(this, void 0, void 0, function* () {
        debug('Initialising coordinator');
        yield znp.request(Subsystem.SYS, 'resetReq', { type: Constants.SYS.resetType.SOFT });
        yield znp.request(Subsystem.SYS, 'osalNvWrite', nvItems_1.default.startupOption(0x02));
        yield znp.request(Subsystem.SYS, 'resetReq', { type: Constants.SYS.resetType.SOFT });
        yield znp.request(Subsystem.SYS, 'osalNvWrite', nvItems_1.default.logicalType(Constants.ZDO.deviceLogicalType.COORDINATOR));
        yield znp.request(Subsystem.SYS, 'osalNvWrite', nvItems_1.default.networkKeyDistribute(options.networkKeyDistribute));
        yield znp.request(Subsystem.SYS, 'osalNvWrite', nvItems_1.default.zdoDirectCb());
        yield znp.request(Subsystem.SYS, 'osalNvWrite', nvItems_1.default.channelList(options.channelList));
        if (version === tstype_1.ZnpVersion.zStack12) {
            // TODO: add extendedPanID and panID for zStack 3
            yield znp.request(Subsystem.SYS, 'osalNvWrite', nvItems_1.default.panID(options.panID));
            yield znp.request(Subsystem.SYS, 'osalNvWrite', nvItems_1.default.extendedPanID(options.extenedPanID));
        }
        if (version === tstype_1.ZnpVersion.zStack30x || version === tstype_1.ZnpVersion.zStack3x0) {
            yield znp.request(Subsystem.SYS, 'osalNvWrite', nvItems_1.default.networkKey(options.networkKey));
            // Default link key is already OK for Z-Stack 3 ('ZigBeeAlliance09')
            const channelMask = Buffer.from(Constants.Utils.getChannelMask(options.channelList)).readUInt32LE(0);
            yield znp.request(Subsystem.APP_CNF, 'bdbSetChannel', { isPrimary: 0x1, channel: channelMask });
            yield znp.request(Subsystem.APP_CNF, 'bdbSetChannel', { isPrimary: 0x0, channel: 0x0 });
            const started = znp.waitFor(unpi_1.Constants.Type.AREQ, Subsystem.ZDO, 'stateChangeInd', { state: 9 }, 60000);
            yield znp.request(Subsystem.APP_CNF, 'bdbStartCommissioning', { mode: 0x04 });
            yield started;
            yield znp.request(Subsystem.APP_CNF, 'bdbStartCommissioning', { mode: 0x02 });
        }
        else {
            yield znp.request(Subsystem.SAPI, 'writeConfiguration', nvItems_1.default.networkKey(options.networkKey));
            yield znp.request(Subsystem.SYS, 'osalNvWrite', nvItems_1.default.tcLinkKey());
        }
        // expect status code 9 (= item created and initialized)
        yield znp.request(Subsystem.SYS, 'osalNvItemInit', nvItems_1.default.znpHasConfiguredInit(version), [0, 9]);
        yield znp.request(Subsystem.SYS, 'osalNvWrite', nvItems_1.default.znpHasConfigured(version));
    });
}
exports.default = (znp, version, options, backupPath) => __awaiter(this, void 0, void 0, function* () {
    let result = 'resumed';
    let hasConfigured = false;
    try {
        yield validateItem(znp, nvItems_1.default.znpHasConfigured(version), 'hasConfigured');
        hasConfigured = true;
    }
    catch (_a) {
        hasConfigured = false;
    }
    // Restore from backup when the coordinator has never been configured yet.
    if (backupPath && fs_1.default.existsSync(backupPath) && !hasConfigured) {
        debug('Restoring coordinator from backup');
        yield backup_1.Restore(znp, backupPath, options);
        result = 'restored';
    }
    else if (yield needsToBeInitialised(znp, version, options)) {
        yield initialise(znp, version, options);
        result = 'resetted';
    }
    yield boot(znp);
    yield registerEndpoints(znp);
    if (result === 'restored') {
        // Write channellist again, otherwise it doesnt seem to stick.
        yield znp.request(Subsystem.SYS, 'osalNvWrite', nvItems_1.default.channelList(options.channelList));
    }
    return result;
});
//# sourceMappingURL=startZnp.js.map