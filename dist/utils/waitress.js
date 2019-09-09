"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
;
class Waitress {
    constructor(validator, timeoutFormatter) {
        this.waiters = [];
        this.timeoutFormatter = timeoutFormatter;
        this.validator = validator;
        this.currentID = 0;
    }
    resolve(payload) {
        const toRemove = [];
        for (const waiter of this.waiters) {
            if (waiter.timedout) {
                toRemove.push(waiter);
            }
            else if (this.validator(payload, waiter.matcher)) {
                clearTimeout(waiter.timer);
                waiter.resolve(payload);
                toRemove.push(waiter);
            }
        }
        toRemove.forEach((waiter) => this.waiters.splice(this.waiters.indexOf(waiter), 1));
    }
    remove(ID) {
        for (let index = 0; index < this.waiters.length; index++) {
            const waiter = this.waiters[index];
            if (this.waiters[index].ID === ID) {
                if (!waiter.timedout && waiter.timer) {
                    clearTimeout(waiter.timer);
                }
                this.waiters.splice(index, 1);
                break;
            }
        }
    }
    waitFor(matcher, timeout) {
        const ID = this.currentID++;
        const promise = new Promise((resolve, reject) => {
            const object = { matcher, resolve, reject, timedout: false, ID };
            object.timer = setTimeout(() => {
                const message = this.timeoutFormatter(matcher, timeout);
                object.timedout = true;
                reject(new Error(message));
            }, timeout);
            this.waiters.push(object);
        });
        return { ID, promise };
    }
}
exports.default = Waitress;
//# sourceMappingURL=waitress.js.map