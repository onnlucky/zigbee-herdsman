import { KeyValue } from './tstype';
import { Entity } from './model';
declare type ReviveFunction = (value: KeyValue) => Entity;
declare class Database {
    private data;
    private path;
    private lastID;
    constructor(data: KeyValue[], path: string);
    static open(path: string | undefined, revive: ReviveFunction): Promise<Database>;
    private save;
    findById(id: number): KeyValue | undefined;
    find(query: KeyValue): KeyValue[];
    insert(object: KeyValue): void;
    update(id: number, object: KeyValue): void;
    remove(id: number): void;
    newID(): number;
}
export default Database;
