/// <reference types="node" />
import ZpiObject from './zpiObject';
import { ZpiObjectPayload } from './tstype';
import { Subsystem, Type } from '../unpi/constants';
import events from 'events';
declare class Znp extends events.EventEmitter {
    private path;
    private baudRate;
    private rtscts;
    private serialPort;
    private unpiWriter;
    private unpiParser;
    private initialized;
    private queue;
    private waitress;
    constructor(path: string, baudRate: number, rtscts: boolean);
    private log;
    private onUnpiParsed;
    isInitialized(): boolean;
    private onUnpiParsedError;
    private onSerialPortClose;
    private onSerialPortError;
    open(): Promise<void>;
    private skipBootloader;
    close(): Promise<void>;
    request(subsystem: Subsystem, command: string, payload: ZpiObjectPayload, expectedStatus?: number[]): Promise<ZpiObject>;
    private waitressTimeoutFormatter;
    waitFor(type: Type, subsystem: Subsystem, command: string, payload?: ZpiObjectPayload, timeout?: number): Promise<ZpiObject>;
    private waitressValidator;
}
export default Znp;
