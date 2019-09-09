import { ZclFrame } from '../../zcl';
interface KeyValue {
    [s: string]: number | string;
}
declare function attributeList(frame: ZclFrame): KeyValue;
export { attributeList, };
