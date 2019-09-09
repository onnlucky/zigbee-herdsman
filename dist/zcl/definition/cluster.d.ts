import DataType from './dataType';
import * as TsType from '../tstype';
interface AttributeDefinition {
    ID: number;
    type: DataType;
}
interface ClusterDefinition {
    ID: number;
    attributes: {
        [s: string]: AttributeDefinition;
    };
    commands: {
        [s: string]: CommandDefinition;
    };
    commandsResponse: {
        [s: string]: CommandDefinition;
    };
}
interface CommandDefinition {
    ID: number;
    parameters: TsType.Parameter[];
    response?: number;
}
declare const Cluster: {
    [s: string]: ClusterDefinition;
};
export default Cluster;
