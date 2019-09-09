"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
const Constants = __importStar(require("../constants"));
const tstype_1 = require("./tstype");
const constants_1 = require("../unpi/constants");
const fs_1 = __importDefault(require("fs"));
const fast_deep_equal_1 = __importDefault(require("fast-deep-equal"));
const nvItems_1 = __importDefault(require("./nvItems"));
const NvItemsIds = Constants.COMMON.nvItemIds;
const items = {
    ZCD_NV_EXTADDR: {
        id: NvItemsIds.EXTADDR,
        offset: 0x00
    },
    ZCD_NV_NIB: {
        id: NvItemsIds.NIB,
        offset: 0x00
    },
    ZCD_NV_EXTENDED_PAN_ID: {
        id: NvItemsIds.EXTENDED_PAN_ID,
        offset: 0x00
    },
    ZCD_NV_NWK_ACTIVE_KEY_INFO: {
        id: NvItemsIds.NWK_ACTIVE_KEY_INFO,
        offset: 0x00
    },
    ZCD_NV_NWK_ALTERN_KEY_INFO: {
        id: NvItemsIds.NWK_ALTERN_KEY_INFO,
        offset: 0x00
    },
    ZCD_NV_APS_USE_EXT_PANID: {
        id: NvItemsIds.APS_USE_EXT_PANID,
        offset: 0x00
    },
    ZCD_NV_PRECFGKEY: {
        id: NvItemsIds.PRECFGKEY,
        offset: 0x00
    },
    ZCD_NV_PRECFGKEY_ENABLE: {
        id: NvItemsIds.PRECFGKEYS_ENABLE,
        offset: 0x00
    },
    ZCD_NV_TCLK_TABLE_START: {
        id: NvItemsIds.TCLK_TABLE_START,
        offset: 0x00
    },
    ZCD_NV_CHANLIST: {
        id: NvItemsIds.CHANLIST,
        offset: 0x00,
    },
    ZCD_NV_NWK_SEC_MATERIAL_TABLE_START: {
        id: NvItemsIds.NWK_SEC_MATERIAL_TABLE_START,
        offset: 0x00,
    }
};
function Backup(znp) {
    return __awaiter(this, void 0, void 0, function* () {
        const product = (yield znp.request(constants_1.Subsystem.SYS, 'version', {})).payload.product;
        if (product !== tstype_1.ZnpVersion.zStack30x && product !== tstype_1.ZnpVersion.zStack3x0) {
            throw new Error('Backup is only supported for Z-Stack 3');
        }
        // eslint-disable-next-line
        const data = {};
        for (const [key, entry] of Object.entries(items)) {
            const result = yield znp.request(constants_1.Subsystem.SYS, 'osalNvRead', entry);
            data[key] = Object.assign(Object.assign({}, entry), { value: result.payload.value.toJSON().data, len: result.payload.value.length });
        }
        return {
            adapterType: 'zStack',
            time: new Date().toUTCString(),
            meta: { product },
            data,
        };
    });
}
exports.Backup = Backup;
function Restore(znp, backupPath, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const backup = JSON.parse(fs_1.default.readFileSync(backupPath).toString());
        const product = (yield znp.request(constants_1.Subsystem.SYS, 'version', {})).payload.product;
        if (backup.adapterType !== 'zStack') {
            throw new Error(`Cannot restore backup, backup is for '${backup.adapterType}', current is 'zStack'`);
        }
        if (backup.meta.product != product) {
            throw new Error(`Cannot restore backup, backup is for '${tstype_1.ZnpVersion[backup.meta.product]}', ` +
                `current is '${tstype_1.ZnpVersion[product]}'`);
        }
        if (!fast_deep_equal_1.default(backup.data.ZCD_NV_CHANLIST.value, Constants.Utils.getChannelMask(options.channelList))) {
            throw new Error(`Cannot restore backup, channel of backup is different`);
        }
        if (!fast_deep_equal_1.default(backup.data.ZCD_NV_PRECFGKEY.value, options.networkKey)) {
            throw new Error(`Cannot restore backup, networkKey of backup is different`);
        }
        const ZCD_NV_NIB = Object.assign(Object.assign({}, backup.data.ZCD_NV_NIB), { initvalue: backup.data.ZCD_NV_NIB.value, initlen: backup.data.ZCD_NV_NIB.len });
        const bdbNodeIsOnANetwork = {
            id: NvItemsIds.BDBNODEISONANETWORK,
            len: 0x01,
            offset: 0x0,
            value: [0x01],
            initlen: 0x01,
            initvalue: [0x01]
        };
        yield znp.request(constants_1.Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_EXTADDR);
        yield znp.request(constants_1.Subsystem.SYS, 'osalNvItemInit', ZCD_NV_NIB, [9]);
        yield znp.request(constants_1.Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_EXTENDED_PAN_ID);
        yield znp.request(constants_1.Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_NWK_ACTIVE_KEY_INFO);
        yield znp.request(constants_1.Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_NWK_ALTERN_KEY_INFO);
        yield znp.request(constants_1.Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_APS_USE_EXT_PANID);
        yield znp.request(constants_1.Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_PRECFGKEY);
        yield znp.request(constants_1.Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_PRECFGKEY_ENABLE);
        yield znp.request(constants_1.Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_TCLK_TABLE_START);
        yield znp.request(constants_1.Subsystem.SYS, 'osalNvWrite', backup.data.ZCD_NV_NWK_SEC_MATERIAL_TABLE_START);
        yield znp.request(constants_1.Subsystem.SYS, 'osalNvItemInit', nvItems_1.default.znpHasConfiguredInit(product), [9]);
        yield znp.request(constants_1.Subsystem.SYS, 'osalNvWrite', nvItems_1.default.znpHasConfigured(product));
        yield znp.request(constants_1.Subsystem.SYS, 'osalNvItemInit', bdbNodeIsOnANetwork, [0, 9]);
        yield znp.request(constants_1.Subsystem.SYS, 'osalNvWrite', bdbNodeIsOnANetwork);
        yield znp.request(constants_1.Subsystem.SYS, 'resetReq', { type: Constants.SYS.resetType.SOFT });
    });
}
exports.Restore = Restore;
//# sourceMappingURL=backup.js.map