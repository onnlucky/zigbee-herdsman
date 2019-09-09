import { DataType, Direction } from './definition';
import * as TsType from './tstype';
declare function IsDataTypeAnalogOrDiscrete(dataType: DataType): 'ANALOG' | 'DISCRETE';
declare function getCluster(key: string | number): TsType.Cluster;
declare function getGlobalCommand(key: number | string): TsType.Command;
declare function getSpecificCommand(clusterKey: number | string, direction: Direction, key: number | string): TsType.Command;
export { getCluster, getSpecificCommand, getGlobalCommand, IsDataTypeAnalogOrDiscrete, };
