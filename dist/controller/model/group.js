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
const entity_1 = __importDefault(require("./entity"));
const zclTransactionSequenceNumber_1 = __importDefault(require("../helpers/zclTransactionSequenceNumber"));
const Zcl = __importStar(require("../../zcl"));
const assert_1 = __importDefault(require("assert"));
class Group extends entity_1.default {
    constructor(databaseID, groupID, members, meta) {
        super();
        this.databaseID = databaseID;
        this.groupID = groupID;
        this.members = members;
        this.meta = meta;
    }
    static reload() { this.lookup = {}; }
    isType(type) {
        return type === 'group';
    }
    get(key) {
        return this[key];
    }
    /**
     * CRUD
     */
    static fromDatabaseRecord(record) {
        const group = new Group(record.id, record.groupID, record.members, record.meta);
        this.lookup[group.groupID] = group;
        return group;
    }
    toDatabaseRecord() {
        return { id: this.databaseID, type: 'Group', groupID: this.groupID, members: this.members, meta: this.meta };
    }
    static all() {
        return Object.values(this.lookup);
    }
    static byID(groupID) {
        return this.lookup[groupID];
    }
    static findSingle(query) {
        const results = this.find(query);
        if (results.length === 1)
            return results[0];
        return undefined;
    }
    static find(query) {
        const queryKeys = Object.keys(query);
        // fast path
        if (queryKeys.length === 1 && query.groupID) {
            const group = this.byID(query.groupID);
            return group ? [group] : [];
        }
        return this.all().filter((d) => {
            for (const key of queryKeys) {
                if (d[key] != query[key])
                    return false;
            }
            return true;
        });
    }
    static create(groupID) {
        assert_1.default(typeof groupID === 'number', 'GroupID must be a number');
        if (this.byID(groupID)) {
            throw new Error(`Group with groupID '${groupID}' already exists`);
        }
        const databaseID = this.database.newID();
        const group = new Group(databaseID, groupID, [], {});
        this.database.insert(group.toDatabaseRecord());
        this.lookup[group.groupID] = group;
        return group;
    }
    removeFromDatabase() {
        Group.database.remove(this.databaseID);
        delete Group.lookup[this.groupID];
    }
    /**
     * Zigbee functions
     */
    command(clusterKey, commandKey, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const cluster = Zcl.Utils.getCluster(clusterKey);
            const command = cluster.getCommand(commandKey);
            for (const parameter of command.parameters) {
                if (!payload.hasOwnProperty(parameter.name)) {
                    throw new Error(`Parameter '${parameter.name}' is missing`);
                }
            }
            const frame = Zcl.ZclFrame.create(Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true, null, zclTransactionSequenceNumber_1.default.next(), command.ID, cluster.ID, payload);
            yield Group.adapter.sendZclFrameGroup(this.groupID, frame);
        });
    }
}
// This lookup contains all groups that are queried from the database, this is to ensure that always
// the same instance is returned.
Group.lookup = {};
exports.default = Group;
//# sourceMappingURL=group.js.map