"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Entity {
    static injectDatabse(database) {
        this.database = database;
    }
    static injectAdapter(adapter) {
        this.adapter = adapter;
    }
}
exports.default = Entity;
//# sourceMappingURL=entity.js.map