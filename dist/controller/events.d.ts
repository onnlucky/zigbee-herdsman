import { Device, Endpoint } from "./model";
import { KeyValue } from "./tstype";
declare enum Events {
    message = "message",
    adapterDisconnected = "adapterDisconnected",
    deviceJoined = "deviceJoined",
    deviceInterview = "deviceInterview",
    deviceAnnounce = "deviceAnnounce",
    deviceLeave = "deviceLeave"
}
interface DeviceJoinedPayload {
    device: Device;
}
interface DeviceInterviewPayload {
    status: 'started' | 'successful' | 'failed';
    device: Device;
}
interface DeviceAnnouncePayload {
    device: Device;
}
interface DeviceLeavePayload {
    ieeeAddr: string;
}
declare const CommandsLookup: {
    [s: string]: MessagePayloadType;
};
declare type MessagePayloadType = 'attributeReport' | 'readResponse' | 'commandOn' | 'commandOffWithEffect' | 'commandStep' | 'commandStop' | 'commandHueNotification' | 'commandOff' | 'commandStepColorTemp' | 'commandMoveWithOnOff' | 'commandMove' | 'commandMoveHue' | 'commandMoveToSaturation' | 'commandStopWithOnOff' | 'commandMoveToLevelWithOnOff' | 'commandToggle' | 'commandTradfriArrowSingle' | 'commandTradfriArrowHold' | 'commandTradfriArrowRelease' | 'commandStepWithOnOff' | 'commandMoveToColorTemp' | 'commandMoveToColor' | 'commandOnWithTimedOff' | 'commandRecall' | 'commandArm' | 'commandPanic' | 'commandEmergency' | 'commandOperationEventNotification' | 'commandStatusChangeNotification';
interface MessagePayload {
    type: MessagePayloadType;
    device: Device;
    endpoint: Endpoint;
    linkquality: number;
    groupID: number;
    cluster: string;
    data: KeyValue;
}
export { Events, MessagePayload, MessagePayloadType, CommandsLookup, DeviceInterviewPayload, DeviceAnnouncePayload, DeviceLeavePayload, DeviceJoinedPayload, };
