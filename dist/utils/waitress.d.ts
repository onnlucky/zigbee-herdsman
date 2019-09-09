declare type Validator<TPayload, TMatcher> = (payload: TPayload, matcher: TMatcher) => boolean;
declare type TimeoutFormatter<TMatcher> = (matcher: TMatcher, timeout: number) => string;
declare class Waitress<TPayload, TMatcher> {
    private waiters;
    private validator;
    private timeoutFormatter;
    private currentID;
    constructor(validator: Validator<TPayload, TMatcher>, timeoutFormatter: TimeoutFormatter<TMatcher>);
    resolve(payload: TPayload): void;
    remove(ID: number): void;
    waitFor(matcher: TMatcher, timeout: number): {
        promise: Promise<TPayload>;
        ID: number;
    };
}
export default Waitress;
