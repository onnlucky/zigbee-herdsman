import { Backup as BackupType, NetworkOptions } from '../../tstype';
import { Znp } from '../znp';
declare function Backup(znp: Znp): Promise<BackupType>;
declare function Restore(znp: Znp, backupPath: string, options: NetworkOptions): Promise<void>;
export { Backup, Restore };
