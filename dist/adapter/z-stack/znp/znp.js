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
Object.defineProperty(exports, "__esModule", { value: true });
const unpi_1 = require("../unpi");
const utils_1 = require("../../../utils");
const zpiObject_1 = __importDefault(require("./zpiObject"));
const constants_1 = require("../unpi/constants");
const serialport_1 = __importDefault(require("serialport"));
const events_1 = __importDefault(require("events"));
const fast_deep_equal_1 = __importDefault(require("fast-deep-equal"));
const debug_1 = __importDefault(require("debug"));
const timeouts = {
    SREQ: 6000,
    reset: 30000,
    default: 10000,
};
const debug = {
    error: debug_1.default('zigbee-herdsman:znp:error'),
    timeout: debug_1.default('zigbee-herdsman:znp:timeout'),
    log: debug_1.default('zigbee-herdsman:znp:log'),
    SREQ: debug_1.default('zigbee-herdsman:znp:SREQ'),
    AREQ: debug_1.default('zigbee-herdsman:znp:AREQ'),
    SRSP: debug_1.default('zigbee-herdsman:znp:SRSP'),
};
;
class Znp extends events_1.default.EventEmitter {
    constructor(path, baudRate, rtscts) {
        super();
        this.path = path;
        this.baudRate = baudRate;
        this.rtscts = rtscts;
        this.initialized = false;
        this.queue = new utils_1.Queue();
        this.waitress = new utils_1.Waitress(this.waitressValidator, this.waitressTimeoutFormatter);
        this.onUnpiParsed = this.onUnpiParsed.bind(this);
        this.onUnpiParsedError = this.onUnpiParsedError.bind(this);
        this.onSerialPortClose = this.onSerialPortClose.bind(this);
        this.onSerialPortError = this.onSerialPortError.bind(this);
    }
    log(type, message) {
        if (type === constants_1.Type.SRSP) {
            debug.SRSP(message);
        }
        else if (type === constants_1.Type.AREQ) {
            debug.AREQ(message);
        }
        else {
            /* istanbul ignore else */
            if (type === constants_1.Type.SREQ) {
                debug.SREQ(message);
            }
            else {
                throw new Error(`Unknown type '${type}'`);
            }
        }
    }
    onUnpiParsed(frame) {
        try {
            const object = zpiObject_1.default.fromUnpiFrame(frame);
            const message = `<-- ${constants_1.Subsystem[object.subsystem]} - ${object.command} - ${JSON.stringify(object.payload)}`;
            this.log(object.type, message);
            this.waitress.resolve(object);
            this.emit('received', object);
        }
        catch (error) {
            debug.error(`Error while parsing to ZpiObject '${error.stack}'`);
        }
    }
    isInitialized() {
        return this.initialized;
    }
    onUnpiParsedError(error) {
        debug.error(`Got unpi error ${error}`);
    }
    onSerialPortClose() {
        debug.log('Serialport closed');
        this.initialized = false;
        this.emit('close');
    }
    onSerialPortError(error) {
        debug.error(`Serialport error: ${error}`);
    }
    open() {
        const options = { baudRate: this.baudRate, rtscts: this.rtscts, autoOpen: false };
        debug.log(`Opening with ${this.path} and ${JSON.stringify(options)}`);
        this.serialPort = new serialport_1.default(this.path, options);
        this.unpiWriter = new unpi_1.Writer();
        // @ts-ignore
        this.unpiWriter.pipe(this.serialPort);
        this.unpiParser = new unpi_1.Parser();
        this.serialPort.pipe(this.unpiParser);
        this.unpiParser.on('parsed', this.onUnpiParsed);
        this.unpiParser.on('error', this.onUnpiParsedError);
        return new Promise((resolve, reject) => {
            this.serialPort.open((error) => __awaiter(this, void 0, void 0, function* () {
                if (error) {
                    reject(new Error(`Error while opening serialport '${error}'`));
                    this.initialized = false;
                    this.serialPort.close();
                }
                else {
                    debug.log('Serialport opened');
                    yield this.skipBootloader();
                    this.serialPort.once('close', this.onSerialPortClose);
                    this.serialPort.once('error', this.onSerialPortError);
                    this.initialized = true;
                    resolve();
                }
            }));
        });
    }
    skipBootloader() {
        return __awaiter(this, void 0, void 0, function* () {
            // Send magic byte: https://github.com/Koenkk/zigbee2mqtt/issues/1343 to bootloader
            // and give ZNP 1 second to start.
            const buffer = Buffer.from([0xef]);
            debug.log('Writing skip bootloader payload');
            this.unpiWriter.writeBuffer(buffer);
            yield utils_1.Wait(1000);
        });
    }
    close() {
        return new Promise((resolve, reject) => {
            if (this.initialized) {
                this.serialPort.flush(() => {
                    this.serialPort.close((error) => {
                        this.initialized = false;
                        error == null ?
                            resolve() :
                            reject(new Error(`Error while closing serialport '${error}'`));
                        this.emit('close');
                    });
                });
            }
            else {
                resolve();
                this.emit('close');
            }
        });
    }
    request(subsystem, command, payload, expectedStatus = [0]) {
        if (!this.initialized) {
            throw new Error('Cannot request when znp has not been initialized yet');
        }
        const object = zpiObject_1.default.createRequest(subsystem, command, payload);
        const message = `--> ${constants_1.Subsystem[object.subsystem]} - ${object.command} - ${JSON.stringify(payload)}`;
        return this.queue.execute(() => __awaiter(this, void 0, void 0, function* () {
            this.log(object.type, message);
            const frame = object.toUnpiFrame();
            if (object.type === constants_1.Type.SREQ) {
                const timeout = object.command === 'bdbStartCommissioning' || object.command === 'startupFromApp' ?
                    20000 : timeouts.SREQ;
                const waiter = this.waitress.waitFor({ type: constants_1.Type.SRSP, subsystem: object.subsystem, command: object.command }, timeout);
                this.unpiWriter.writeFrame(frame);
                const result = yield waiter.promise;
                if (result && result.payload.hasOwnProperty('status') &&
                    !expectedStatus.includes(result.payload.status)) {
                    throw new Error(`SREQ '${message}' failed with status '${result.payload.status}' (expected '${expectedStatus}')`);
                }
                else {
                    return result;
                }
            }
            else if (object.type === constants_1.Type.AREQ && object.isResetCommand()) {
                const waiter = this.waitress.waitFor({ type: constants_1.Type.AREQ, subsystem: constants_1.Subsystem.SYS, command: 'resetInd' }, timeouts.reset);
                this.queue.clear();
                this.unpiWriter.writeFrame(frame);
                return yield waiter.promise;
            }
            else {
                /* istanbul ignore else */
                if (object.type === constants_1.Type.AREQ) {
                    this.unpiWriter.writeFrame(frame);
                    return undefined;
                }
                else {
                    throw new Error(`Unknown type '${object.type}'`);
                }
            }
        }));
    }
    waitressTimeoutFormatter(matcher, timeout) {
        return `${constants_1.Type[matcher.type]} - ${constants_1.Subsystem[matcher.subsystem]} - ${matcher.command} after ${timeout}ms`;
    }
    waitFor(type, subsystem, command, payload = {}, timeout = timeouts.default) {
        return this.waitress.waitFor({ type, subsystem, command, payload }, timeout).promise;
    }
    waitressValidator(zpiObject, matcher) {
        const requiredMatch = matcher.type === zpiObject.type && matcher.subsystem == zpiObject.subsystem &&
            matcher.command === zpiObject.command;
        let payloadMatch = true;
        if (matcher.payload) {
            for (const [key, value] of Object.entries(matcher.payload)) {
                if (!fast_deep_equal_1.default(zpiObject.payload[key], value)) {
                    payloadMatch = false;
                    break;
                }
            }
        }
        return requiredMatch && payloadMatch;
    }
}
exports.default = Znp;
//# sourceMappingURL=znp.js.map