/// <reference types="node" />
import { Direction } from './definition';
import * as TsType from './tstype';
import { FrameType } from './definition';
interface FrameControl {
    frameType: FrameType;
    manufacturerSpecific: boolean;
    direction: Direction;
    disableDefaultResponse: boolean;
}
declare type ZclPayload = any;
interface ZclHeader {
    frameControl: FrameControl;
    manufacturerCode: number;
    transactionSequenceNumber: number;
    commandIdentifier: number;
}
declare class ZclFrame {
    readonly Header: ZclHeader;
    readonly Payload: ZclPayload;
    readonly ClusterID: number;
    constructor(header: ZclHeader, payload: ZclPayload, clusterID: number);
    /**
     * Creating
     */
    static create(frameType: FrameType, direction: Direction, disableDefaultResponse: boolean, manufacturerCode: number, transactionSequenceNumber: number, commandKey: number | string, clusterID: number, payload: ZclPayload): ZclFrame;
    toBuffer(): Buffer;
    private writeHeader;
    private writePayloadGlobal;
    private writePayloadCluster;
    /**
     * Parsing
     */
    static fromBuffer(clusterID: number, buffer: Buffer): ZclFrame;
    private static parseHeader;
    private static parsePayload;
    private static parsePayloadCluster;
    private static parsePayloadGlobal;
    /**
     * Utils
     */
    private static getDataTypeString;
    private static conditionsValid;
    isSpecific(): boolean;
    isGlobal(): boolean;
    isCluster(clusterName: 'genTime' | 'genAnalogInput' | 'genBasic'): boolean;
    isCommand(commandName: 'read' | 'report' | 'readRsp'): boolean;
    getCluster(): TsType.Cluster;
    getCommand(): TsType.Command;
}
export default ZclFrame;
