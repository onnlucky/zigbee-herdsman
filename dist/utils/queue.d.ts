declare class Queue {
    private jobs;
    private concurrent;
    constructor(concurrent?: number);
    execute<T>(func: () => Promise<T>, key?: string | number): Promise<T>;
    private executeNext;
    private getNext;
    clear(): void;
}
export default Queue;
