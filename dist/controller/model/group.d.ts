import { KeyValue } from '../tstype';
import Entity from './entity';
declare class Group extends Entity {
    private databaseID;
    groupID: number;
    private members;
    private meta;
    private static lookup;
    static reload(): void;
    private constructor();
    isType(type: string): boolean;
    get(key: 'groupID'): number;
    /**
     * CRUD
     */
    static fromDatabaseRecord(record: KeyValue): Group;
    private toDatabaseRecord;
    static all(): Group[];
    static byID(groupID: number): Group | undefined;
    static findSingle(query: {
        groupID?: number;
        [key: string]: unknown;
    }): Group | undefined;
    static find(query: {
        groupID?: number;
        [key: string]: unknown;
    }): Group[];
    static create(groupID: number): Group;
    removeFromDatabase(): void;
    /**
     * Zigbee functions
     */
    command(clusterKey: number | string, commandKey: number | string, payload: KeyValue): Promise<void>;
}
export default Group;
