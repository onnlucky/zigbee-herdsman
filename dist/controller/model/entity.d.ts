import Database from '../database';
import { Adapter } from '../../adapter';
declare abstract class Entity {
    protected static database: Database;
    protected static adapter: Adapter;
    static injectDatabse(database: Database): void;
    static injectAdapter(adapter: Adapter): void;
    abstract isType(type: string): boolean;
}
export default Entity;
