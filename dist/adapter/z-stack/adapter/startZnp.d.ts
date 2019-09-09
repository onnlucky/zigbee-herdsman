import { Znp } from '../znp';
import * as TsType from '../../tstype';
import { ZnpVersion } from './tstype';
declare const _default: (znp: Znp, version: ZnpVersion, options: TsType.NetworkOptions, backupPath?: string) => Promise<TsType.StartResult>;
export default _default;