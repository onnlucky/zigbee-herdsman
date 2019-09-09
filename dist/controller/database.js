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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
class Database {
    constructor(data, path) {
        this.data = data;
        this.path = path;
        this.lastID = 0;
    }
    static open(path, revive) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = [];
            if (path && fs.existsSync(path)) {
                const json = fs.readFileSync(path, "UTF8");
                if (json.trim().length > 0) {
                    data = JSON.parse(json);
                    if (!Array.isArray(data)) {
                        data = [];
                    }
                }
            }
            const db = new Database(data, path);
            db.data.forEach(value => revive(value));
            return db;
        });
    }
    save() {
        if (!this.path)
            return;
        const data = JSON.stringify(this.data);
        fs.writeFileSync(this.path, data, "UTF8");
    }
    findById(id) {
        return this.data.find(d => d.id === id);
    }
    find(query) {
        const queryKeys = Object.keys(query);
        return this.data.filter(d => {
            for (const key of queryKeys) {
                if (d[key] != query[key])
                    return false;
            }
            return true;
        });
    }
    insert(object) {
        const id = object.id;
        if (typeof id !== "number")
            throw Error("no object.id: " + JSON.stringify(object));
        if (this.findById(id))
            throw Error("object with that id already exists");
        this.data.push(object);
        this.save();
    }
    update(id, object) {
        const at = this.data.findIndex(d => d.id === id);
        if (at < 0)
            throw Error("no object with that ID exists");
        this.data[at] = object;
        this.save();
    }
    remove(id) {
        const at = this.data.findIndex(d => d.id === id);
        if (at < 0)
            throw Error("no object with that ID exists");
        this.data.splice(at, 1);
        this.save();
    }
    newID() {
        if (this.data.length === 0) {
            this.lastID = 0;
        }
        for (let i = 0; i < 100000; i++) {
            const id = ++this.lastID;
            if (!this.findById(id))
                return id;
        }
        throw Error("unable to allocate new ID");
    }
}
exports.default = Database;
//# sourceMappingURL=database.js.map