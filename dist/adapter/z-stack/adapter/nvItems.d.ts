import { ZnpVersion } from './tstype';
import { NvItem } from './tstype';
declare const _default: {
    znpHasConfiguredInit: (version: ZnpVersion) => NvItem;
    znpHasConfigured: (version: ZnpVersion) => NvItem;
    panID: (panID: number) => NvItem;
    extendedPanID: (extendedPanID: number[]) => NvItem;
    channelList: (channelList: number[]) => NvItem;
    networkKeyDistribute: (distribute: boolean) => NvItem;
    networkKey: (key: number[]) => NvItem;
    startupOption: (value: number) => NvItem;
    logicalType: (value: number) => NvItem;
    zdoDirectCb: () => NvItem;
    tcLinkKey: () => NvItem;
};
export default _default;
