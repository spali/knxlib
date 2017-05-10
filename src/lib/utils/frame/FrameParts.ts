import { BufferType, BufferState } from './BufferUtils';
import { FramePart, PropertyDef } from './FramePart';
import {
  HEADER_SIZE_10,
  KNXNETIP_VERSION_10,
  ProtocolVersion,
  ServiceType,
  HostProtocolCodes,
  ErrorCodes,
  ConnectionType,
  LinkLayer,
} from '../KnxConstants';
import {
  DataLinkLayer,
  FrameType,
  RepeatFlag,
  Broadcast,
  Priority,
  AckRequest,
  ConfirmFlag,
  DestAddressType,
  ExtendedFrameFormat
} from '../CEMIConstants';

// Source: System Specifications -> Core: 2.3 Header
//
export class Header extends FramePart {
  @PropertyDef(BufferType.UInt8, HEADER_SIZE_10)
  length: number;
  @PropertyDef(BufferType.UInt8, KNXNETIP_VERSION_10)
  protocolVersion: ProtocolVersion;
  @PropertyDef(BufferType.UInt16BE)
  serviceType: ServiceType;
  @PropertyDef(BufferType.UInt16BE)
  totalLength: number;

  constructor(bufferState: BufferState);
  constructor(values: { serviceType: ServiceType });
  constructor(obj: any) {
    super(obj);
  }
}

/**
 * Host Protocol Address Information (KNXnet/IP Endpoint)
 */
export class HPAI extends FramePart {
  @PropertyDef(BufferType.UInt8, 0x08) // HPAI structure length (8 bytes)
  length: number;
  @PropertyDef(BufferType.UInt8, HostProtocolCodes.IPV4_UDP)
  protocolType: HostProtocolCodes;
  @PropertyDef(BufferType.UInt32BE)
  address: number;
  @PropertyDef(BufferType.UInt16BE)
  port: number;

  constructor(bufferState: BufferState);
  constructor(values: { address: number, port: number });
  constructor(obj: any) {
    super(obj);
  }
}

/**
 * connection state part of the frame.
 */
export class ConnectState extends FramePart {
  @PropertyDef(BufferType.UInt8)
  channelId: number;
  @PropertyDef(BufferType.UInt8, ErrorCodes.E_NO_ERROR) // unused, reserved for Request's
  status: ErrorCodes;

  constructor(bufferState: BufferState);
  constructor(values: { channelId: number, status?: number });
  constructor(obj: any) {
    super(obj);
  }
}

/** Connection Request Information */
export class ConnectRequestInformation extends FramePart {
  @PropertyDef(BufferType.UInt8, 0x04) // ConnectRequestInformation length (4 bytes)
  length: number;
  @PropertyDef(BufferType.UInt8)
  connectionType: ConnectionType;
  @PropertyDef(BufferType.UInt8)
  knxLinkLayer: LinkLayer;
  @PropertyDef(BufferType.UInt8, 0x00) // unused, reserved
  unused: number;

  constructor(bufferState: BufferState);
  constructor(values: { connectionType: ConnectionType, knxLinkLayer: LinkLayer });
  constructor(obj: any) {
    super(obj);
  }
}

// Connection Response Data Block
export class ConnectResponseDataBlock extends FramePart {
  @PropertyDef(BufferType.UInt8, 0x04) // ConnectResponseDataBlock length (4 bytes)
  length: number;
  @PropertyDef(BufferType.UInt8)
  connectionType: ConnectionType;
  @PropertyDef(BufferType.UInt16BE)
  knxAddress: number;

  constructor(bufferState: BufferState);
  constructor(values: { connectionType: ConnectionType, knxAddress: number });
  constructor(obj: any) {
    super(obj);
  }
}

export class TunnelState extends FramePart {
  @PropertyDef(BufferType.UInt8, 0x04) // TunnelState length (4 bytes)
  length: number;
  @PropertyDef(BufferType.UInt8)
  channelId: number;
  @PropertyDef(BufferType.UInt8)
  sequence: number;
  @PropertyDef(BufferType.UInt8, ErrorCodes.E_NO_ERROR) // unused, reserved for Request's
  status: number;

  constructor(bufferState: BufferState);
  constructor(values: { channelId: number, sequence: number, status?: number });
  constructor(obj: any) {
    super(obj);
  }
}

export class CEMI extends FramePart {
  @PropertyDef(BufferType.UInt8)
  messageCode: DataLinkLayer;
  @PropertyDef(BufferType.UInt8, 0x00) // TODO: get value dynamically based on additionan information
  additionalInformationLength: number;
  @PropertyDef(BufferType.Function, {
    reader: function(this: CEMI, bufferState: BufferState): Buffer {
      var readEnd = bufferState.offset + this.additionalInformationLength;
      var buffer = bufferState.buffer.slice(bufferState.offset, readEnd); // warn: result still reference original buffer memory
      bufferState.moveOffset(this.additionalInformationLength);
      return buffer;
    },
  length: function(this: CEMI, bufferState: BufferState): number {
  return this.additionalInformationLength;
},
default: function(this: CEMI): Buffer {
  return Buffer.alloc(this.additionalInformationLength);
}
  })
additionalInformation: Buffer; // additional information (optional), currently no info about the kind of information.
@PropertyDef(BufferType.Function, {
  reader: function(this: CEMI, bufferState: BufferState): Buffer {
  var buffer = bufferState.buffer.slice(bufferState.offset, bufferState.offset + 2); // warn: result still reference original buffer memory
  bufferState.moveOffset(2);
  return buffer;
},
length: function(this: CEMI, bufferState: BufferState): number {
  return 2;
},
default: function(this: CEMI): Buffer {
  // TODO: use bit wise calc
  // byte 1
  var control1 = parseInt(
    this.frameType.toString(2) +
    '0' + // reserved
    this.repeatFlag.toString(2) +
    this.broadcast.toString(2) +
    ('00' + this.priority.toString(2)).slice(-2) +
    this.ackRequest.toString(2) +
    this.confirmFlag.toString(2)
    , 2);
  // byte 2
  var control2 = parseInt(
    this.destAddressType.toString(2) +
    ('000' + this.hopCount.toString(2)).slice(-3) +
    ('0000' + this.extendedFrameFormat).slice(-4)
    , 2);
  return Buffer.from([control1, control2]);
}
})
__control: Buffer;
@PropertyDef(BufferType.Function, {
  reader: function(this: CEMI, bufferState: BufferState): FrameType {
  return parseInt('00000000' + this.__control.readUInt8(0).toString(2).slice(-8).slice(0, 1), 10);
},
length: function(this: CEMI, bufferState: BufferState): number {
  return 0;
},
default: function(this: CEMI): FrameType {
  return 0;
}
})
frameType: FrameType;
repeatFlag: RepeatFlag;
broadcast: Broadcast;
priority: Priority;
ackRequest: AckRequest;
confirmFlag: ConfirmFlag;
destAddressType: DestAddressType;
hopCount: number;
extendedFrameFormat: ExtendedFrameFormat;
sourceAddress: number;
destinationAddress: number;
// length of data (includes the last byte of with some APCI bits).
// length = 1: data included in the last 6 bits of the seocnd byte of the tcpi/acpi bytes.
// length > 3:  (n - 1) byte data after the two initial tcpi/acpi bytes.
length: number;
tpci: number;
apci: number;
apci_extended: number;
data: Buffer;

constructor(bufferState: BufferState);
constructor(values: { messageCode: DataLinkLayer });
constructor(obj: any) {
  super(obj);
}
}
