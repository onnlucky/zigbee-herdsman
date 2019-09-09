import { Controller } from "./controller";
import { Events } from "./controller/events";
export { Controller, Events };
import { MessagePayload, DeviceAnnouncePayload, DeviceJoinedPayload, DeviceInterviewPayload, DeviceLeavePayload } from "./controller/events";
export declare type MessageEvent = MessagePayload;
export declare type AnnounceEvent = DeviceAnnouncePayload;
export declare type JoinedEvent = DeviceJoinedPayload;
export declare type InterviewEvent = DeviceInterviewPayload;
export declare type LeaveEvent = DeviceLeavePayload;
