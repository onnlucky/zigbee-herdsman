import { FoundationParameterDefinition } from './tstype';
interface FoundationDefinition {
    ID: number;
    parseStrategy: 'repetitive' | 'flat' | 'oneof';
    parameters: FoundationParameterDefinition[];
    response?: number;
}
declare const Foundation: {
    [s: string]: FoundationDefinition;
};
export default Foundation;
