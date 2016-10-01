/* tslint:disable: no-use-before-declare */

import BinaryProtocol = require('binary-protocol');
import { Parser } from 'binary-parser';
import { IPHelper } from '../utils';
import {
  KNXNETIP_VERSION_10,
  HEADER_SIZE_10,
  IndividualAddress,
  GroupAddress,
  ServiceType,
  ProtocolVersion,
  ConnectionType,
  HostProtocolCodes,
  LinkLayer,
  ErrorCodes,
  DataLinkLayer,
  FrameType,
  RepeatFlag,
  Broadcast,
  Priority,
  AckRequest,
  ConfirmFlag,
  DestAddressType,
  ExtendedFrameFormat,
  TpciCode,
  ApciType,
} from './index';

export class FramePart {
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
  protected get replace(): { [key: string]: (value: any, frame: FramePart) => string } {
    return {
      'rawBuffer': value => undefined,
      'length': value => undefined,
      'totalLength': value => undefined,
      'unused': value => undefined,
      'reserved': value => undefined,
      'protocolType': value => HostProtocolCodes[value],
      'address': value => IPHelper.toString(value),
      'connectionType': value => ConnectionType[value],
      'knxLinkLayer': value => LinkLayer[value],
      'status': value => ErrorCodes[value],
      //'protocolVersion': value => ProtocolVersion[value],
      'protocolVersion': value => undefined,
      'serviceType': value => ServiceType[value],
      'knxAddress': value => new IndividualAddress(value).toString(),

      // CEMI
      'messageCode': value => DataLinkLayer[value],
      // CEMI Control Bits
      'frameType': value => FrameType[value],
      'repeatFlag': value => RepeatFlag[value],
      'broadcast': value => Broadcast[value],
      'priority': value => Priority[value],
      'ackRequest': value => AckRequest[value],
      'confirmFlag': value => ConfirmFlag[value],
      'destAddressType': value => DestAddressType[value],
      'extendedFrameFormat': value => ExtendedFrameFormat[value],

      'sourceAddress': value => new IndividualAddress(value).toString(),
      'destinationAddress': (value: any, frame: CEMI) =>
        (frame.destAddressType === DestAddressType.INDIVIDUAL) ?
          new IndividualAddress(value).toString() :
          new GroupAddress(value).toString(),
      'tpci': value => TpciCode[value],
      'apci': value => ApciType[value] || 'UNKNOWN: ' + value,
    };
  }
  protected inspect(): string {
    return JSON.parse(JSON.stringify(this, (key: string, value: any) => {
      if (this.replace[key]) {
        var replaced = this.replace[key](value, this);
        if (replaced) {
          return replaced + ' (' + value + ')';
        }
      } else {
        return value;
      }
    }));
  }
}

interface ReaderCallback {
  (this: FrameReader, propertyName?: string): void;
}

/**
 * frame reader.
 */
class FrameReader {

  /** hold alls frame part readers */
  protected static readers = new Map<Class<FramePart>, ReaderCallback>();

  /** current reader instance */
  protected reader: ProtocolReader;

  /**
   * register a reader for a specific type of FramePart.
   */
  public static registerReader<T extends FramePart>(framePart: Class<T>, reader: ReaderCallback) {
    FrameReader.readers.set(framePart, reader);
  }

  constructor(protected buffer: Buffer) {
    var binaryProtocol = new BinaryProtocol();
    this.reader = binaryProtocol.createReader(this.buffer);
  }

  /**
   * get raw protocol reader.
   * @return {[type]} [description]
   */
  getReader() {
    return this.reader;
  }

  /** read specific frame part. */
  read<T extends FramePart>(readerClass: Class<T>, propertyName?: string) {
    if (!FrameReader.readers.has(readerClass)) {
      throw new Error('reader for ' + readerClass.prototype.constructor.name + ' not implemented!');
    }
    FrameReader.readers.get(readerClass).call(this, propertyName);
    return this;
  }

  /**
   * get parsed frame.
   * @return {Frame} [description]
   */
  getFrame(): Frame {
    return <Frame>this.getReader().next();
  }
}

interface WriterCallback {
  (this: FrameWriter,  ...values: any[]): void;
}
/**
 * frame writer
 */
class FrameWriter {

  /** hold alls frame part writers */
  protected static writers = new Map<Class<FramePart>, WriterCallback>();

  /** current writer instance */
  protected writer: ProtocolWriter;

  /**
   * register a writer for a specific type of FramePart.
   */
  public static registerWriter<T extends FramePart>(framePart: Class<T>, writer: WriterCallback) {
    FrameWriter.writers.set(framePart, writer);
  }

  constructor() {
    var binaryProtocol = new BinaryProtocol();
    this.writer = binaryProtocol.createWriter();
  }

  /** write specific frame part. */
  write<T extends FramePart>(writerClass: Class<T>, ...values: any[]) {
    if (!FrameWriter.writers.has(writerClass)) {
      throw new Error('writer for ' + writerClass.prototype.constructor.name + ' not implemented!');
    }
    FrameWriter.writers.get(writerClass).call(this, ...values);
    return this;
  }

  getWriter() {
    return this.writer;
  }

  getBuffer() {
    return this.writer.buffer;
  }
}

// Source: System Specifications -> Core: 2.2 Frame format
//
export class Frame extends FramePart {
  header: Header;
  rawBuffer: Buffer;
  unparsedBuffer: Buffer;
}
FrameReader.registerReader(Frame,
  function(propertyName: string) {
    var parser = this;
    this
      .read(Header)
      .getReader()
      .tap(function(data: Frame) {
        switch (data.header.serviceType) {
          case ServiceType.SEARCH_REQUEST:
            parser.read(SearchRequest);
            break;
          case ServiceType.SEARCH_RESPONSE:
            parser.read(SearchResponse);
            break;
          case ServiceType.CONNECT_REQUEST:
            parser.read(ConnectRequest);
            break;
          case ServiceType.CONNECT_RESPONSE:
            parser.read(ConnectResponse);
            break;
          case ServiceType.CONNECTIONSTATE_REQUEST:
            parser.read(ConnectionStateRequest);
            break;
          case ServiceType.CONNECTIONSTATE_RESPONSE:
            parser.read(ConnectionStateResponse);
            break;
          case ServiceType.DISCONNECT_REQUEST:
            parser.read(DisconnectRequest);
            break;
          case ServiceType.DISCONNECT_RESPONSE:
            parser.read(DisconnectResponse);
            break;
          case ServiceType.TUNNELING_REQUEST:
            parser.read(TunnelingRequest);
            break;
          case ServiceType.TUNNELING_ACK:
            parser.read(TunnelingAck);
            break;
          default:
            console.error('unimplemented service type received: ', ServiceType[data.header.serviceType], data.header.serviceType);
        }
      })
      .collect(propertyName, function(data: Frame) {
        // save raw buffer
        data.rawBuffer = this.buffer;
        // save unparsed bytes
        if (this.offset < this.buffer.length) {
          data.unparsedBuffer = this.buffer.slice(this.offset, this.buffer.length);
        }
        switch (data.header.serviceType) {
          case ServiceType.SEARCH_REQUEST:
            return new SearchRequest(data);
          case ServiceType.SEARCH_RESPONSE:
            return new SearchResponse(data);
          case ServiceType.CONNECT_REQUEST:
            return new ConnectRequest(data);
          case ServiceType.CONNECT_RESPONSE:
            return new ConnectResponse(data);
          case ServiceType.CONNECTIONSTATE_REQUEST:
            return new ConnectionStateRequest(data);
          case ServiceType.CONNECTIONSTATE_RESPONSE:
            return new ConnectionStateResponse(data);
          case ServiceType.DISCONNECT_REQUEST:
            return new DisconnectRequest(data);
          case ServiceType.DISCONNECT_RESPONSE:
            return new DisconnectResponse(data);
          case ServiceType.TUNNELING_REQUEST:
            return new TunnelingRequest(data);
          case ServiceType.TUNNELING_ACK:
            return new TunnelingAck(data);
          default:
            return data;
        }
      });
  }
);
FrameWriter.registerWriter(Frame,
  function(serviceType: ServiceType, ...args: any[]) {
    this
      .write(Header, serviceType);
    switch (serviceType) {
      case ServiceType.SEARCH_REQUEST:
        this.write(SearchRequest, ...args);
        break;
      case ServiceType.CONNECT_REQUEST:
        this.write(ConnectRequest, ...args);
        break;
      case ServiceType.CONNECT_RESPONSE:
        this.write(ConnectResponse, ...args);
        break;
      case ServiceType.CONNECTIONSTATE_REQUEST:
        this.write(ConnectionStateRequest, ...args);
        break;
      case ServiceType.CONNECTIONSTATE_RESPONSE:
        this.write(ConnectionStateResponse, ...args);
        break;
      case ServiceType.DISCONNECT_REQUEST:
        this.write(DisconnectRequest, ...args);
        break;
      case ServiceType.DISCONNECT_RESPONSE:
        this.write(DisconnectResponse, ...args);
        break;
      case ServiceType.TUNNELING_REQUEST:
        this.write(TunnelingRequest, ...args);
        break;
      case ServiceType.TUNNELING_ACK:
        this.write(TunnelingAck, ...args);
        break;
      default:
        console.error('unimplemented service type received: ', ServiceType[serviceType], serviceType);
    }
    // set total length of frame
    this.getWriter().buffer.writeUInt16BE(this.getWriter().buffer.length, 4);
  }
);

// Source: System Specifications -> Core: 2.3 Header
//
export class Header extends FramePart {
  length?: number;
  protocolVersion?: ProtocolVersion;
  serviceType: ServiceType;
  totalLength?: number;
}
FrameReader.registerReader(Header,
  function(propertyName = 'header') {
    this.getReader()
      .pushStack(new Header())
      .UInt8('length')
      .UInt8('protocolVersion')
      .UInt16BE('serviceType')
      .UInt16BE('totalLength')
      .popStack(propertyName, function(header: Header) {
        return header;
      });
  }
);
FrameWriter.registerWriter(Header,
  function(serviceType: ServiceType) {
    this.getWriter()
      .UInt8(HEADER_SIZE_10)
      .UInt8(KNXNETIP_VERSION_10)
      .UInt16BE(serviceType) // service type
      .tap(function(data: any) {
        this.allocate(HEADER_SIZE_10 - this.offset).forward(HEADER_SIZE_10 - this.offset); // reserve space for totalLength
      });
  }
);

/**
 * Host Protocol Address Information (KNXnet/IP Endpoint)
 */
export class HPAI extends FramePart {
  length?: number;
  protocolType?: HostProtocolCodes;
  address: number;
  port: number;
}
FrameReader.registerReader(HPAI,
  function(propertyName: string) {
    this.getReader()
      .pushStack(new HPAI())
      .UInt8('length')
      .UInt8('protocolType')
      .UInt32BE('address')
      .UInt16BE('port')
      .popStack(propertyName, function(data: HPAI) {
        return data;
      });
  }
);
FrameWriter.registerWriter(HPAI,
  function(address: number, port: number) {
    this.getWriter()
      .UInt8(0x08) // HPAI structure len (8 bytes)
      .UInt8(HostProtocolCodes.IPV4_UDP) // protocol type (1 = UDP)
      .UInt32BE(address)
      .UInt16BE(port);
  }
);

/** Connection Request Information */
export class ConnectRequestInformation extends FramePart {
  length?: number;
  connectionType: ConnectionType;
  knxLinkLayer: LinkLayer;
  unused?: number;
}
FrameReader.registerReader(ConnectRequestInformation,
  function(propertyName: string = 'connectionRequestInformation') {
    this.getReader()
      .pushStack(new ConnectRequestInformation())
      .UInt8('length')
      .UInt8('connectionType')
      .UInt8('knxLinkLayer')
      .UInt8('unused')
      .popStack(propertyName, function(data: ConnectRequestInformation) {
        return data;
      });
  }
);
FrameWriter.registerWriter(ConnectRequestInformation,
  function(connectionType: ConnectionType, knxLinkLayer: LinkLayer) {
    this.getWriter()
      .UInt8(0x04) // Structure len (4 bytes)
      .UInt8(connectionType)
      .UInt8(knxLinkLayer)
      .UInt8(0x00); // unused, reserved
  }
);

/**
 * connection state part of the frame.
 * status is optional in some cases.
 */
export class ConnectState extends FramePart {
  channelId: number;
  status: ErrorCodes;
}
FrameReader.registerReader(ConnectState,
  function(propertyName = 'connectionState') {
    this.getReader()
      .pushStack(new ConnectState())
      .UInt8('channelId')
      .UInt8('status')
      .popStack(propertyName, function(data: ConnectState) {
        return data;
      });
  }
);
FrameWriter.registerWriter(ConnectState,
  function(channelId: number, status: ErrorCodes) {
    this.getWriter()
      .UInt8(channelId)
      .UInt8(status);
  }
);

export class TunnelState extends FramePart {
  length: number;
  channelId: number;
  sequence: number;
  unused: number;
}
FrameReader.registerReader(TunnelState,
  function(propertyName = 'tunnelState') {
    this.getReader()
      .pushStack(new TunnelState())
      .UInt8('length')
      .UInt8('channelId')
      .UInt8('sequence')
      .UInt8('unused') // unused, reserved
      .popStack(propertyName, function(data: TunnelState) {
        return data;
      });
  }
);
FrameWriter.registerWriter(TunnelState,
  function(channelId: number, sequence: number, status: ErrorCodes) {
    this.getWriter()
      .UInt8(0x04) // tunnel state length (4 bytes)
      .UInt8(channelId)
      .UInt8(sequence)
      .UInt8(status);
  }
);

export class CEMI extends FramePart {
  messageCode: DataLinkLayer;
  additionalInformationLength: number;
  additionalInformation: Buffer; // additional information (optional), currently no info about the kind of information.
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
  data: number | Buffer;
}
class CEMIParser {
  static controlParser = new Parser()
    // byte 1
    .bit1('frameType')
    .bit1('reserved')
    .bit1('repeatFlag')
    .bit1('broadcast')
    .bit2('priority')
    .bit1('ackRequest')
    .bit1('confirmFlag')
    // byte 2
    .bit1('destAddressType')
    .bit3('hopCount')
    .bit4('extendedFrameFormat');

  static shortApduParser = new Parser()
    .bit6('tpci')
    .bit4('apci')
    .bit6('data');

  static longApduParser = new Parser()
    .bit6('tpci')
    .bit4('apci') // first 4 bits for non extended frames
    .bit6('apci_extended'); // rest, if you start to use it, probalby we should parse all bits together and adapt the ApciType?
  // data in following bytes
}
FrameReader.registerReader(CEMI,
  function(propertyName: string = 'cemi') {
    this.getReader()
      .pushStack(new CEMI())
      .UInt8('messageCode')
      .UInt8('additionalInformationLength')
      .tap(function(data: CEMI) {
        if (data.additionalInformationLength > 0) {
          // attention: raw, reads at least 1 byte even second argument is 0
          this.raw('additionalInformation', data.additionalInformationLength);
        }
      })
      .tap(function(data: CEMI) {
        var control = this.buffer.slice(this.offset, this.offset + 2);
        this.offset += 2;
        Object.assign(data, CEMIParser.controlParser.parse(control));
      })
      .UInt16BE('sourceAddress')
      .UInt16BE('destinationAddress')
      .UInt8('length')
      .tap(function(data: CEMI) {
        if (data.length < 3) {
          // short payload
          Object.assign(data, CEMIParser.shortApduParser.parse(this.buffer.slice(this.offset, this.offset + 2)));
          this.offset += 2;
          data.data = new Buffer(<number>data.data);
        } else {
          // long payload
          Object.assign(data, CEMIParser.longApduParser.parse(this.buffer.slice(this.offset, this.offset + 2)));
          this.offset += 2;
          var lengthUntilEnd = this.buffer.length - this.offset;
          if (lengthUntilEnd > 0) {
            // attention: raw, reads at least 1 byte even second argument is 0
            this.raw('data', lengthUntilEnd);
          }
        }
      })
      .popStack(propertyName, function(data: CEMI) {
        return data;
      });
  }
);
FrameWriter.registerWriter(CEMI,
  function() {
    // TODO
  }
);

// Connection Response Data Block
export class ConnectResponseDataBlock extends FramePart {
  length: number;
  connectionType: ConnectionType;
  knxAddress: number;
}
FrameReader.registerReader(ConnectResponseDataBlock,
  function(propertyName: string = 'connectionResponseDataBlock') {
    this.getReader()
      .pushStack(new ConnectResponseDataBlock())
      .UInt8('length')
      .UInt8('connectionType')
      .UInt16BE('knxAddress')
      .popStack(propertyName, function(data: ConnectResponseDataBlock) {
        return data;
      });
  }
);
FrameWriter.registerWriter(ConnectResponseDataBlock,
  function() {
    // TODO
  }
);

/**
 * Definition of the Frames
 */
export class SearchRequest extends Frame {
  discoveryEndpoint: HPAI;
}
FrameReader.registerReader(SearchRequest,
  function(propertyName: string) {
    this
      .read(HPAI, 'discoveryEndpoint');
  }
);
FrameWriter.registerWriter(SearchRequest,
  function(sourceAddress: number, sourcePort: number) {
    this
      .write(HPAI, sourceAddress, sourcePort);
  }
);

export class SearchResponse extends Frame {
  controlEndpoint: HPAI;
}
FrameReader.registerReader(SearchResponse,
  function(propertyName: string) {
    this
      .read(HPAI, 'controlEndpoint');
  }
);
FrameWriter.registerWriter(SearchResponse,
  function() {
    // TODO
  }
);

export class ConnectRequest extends Frame {
  discoveryEndpoint: HPAI;
  dataEndpoint: HPAI;
  connectionRequestInformation: ConnectRequestInformation;
}
FrameReader.registerReader(ConnectRequest,
  function(propertyName: string) {
    this
      .read(HPAI, 'discoveryEndpoint')
      .read(HPAI, 'dataEndpoint')
      .read(ConnectRequestInformation);
  }
);
FrameWriter.registerWriter(ConnectRequest,
  function(sourceAddress: number, sourcePort: number, destinationAddress: number, destinationPort: number) {
    this
      .write(HPAI, sourceAddress, sourcePort)
      .write(HPAI, destinationAddress, destinationPort)
      .write(ConnectRequestInformation, ConnectionType.TUNNEL_CONNECTION, LinkLayer.LINK_LAYER);
  }
);

export class ConnectResponse extends Frame {
  connectionState: ConnectState;
  dataEndpoint: HPAI;
  connectionResponseDataBlock: ConnectResponseDataBlock;
}
FrameReader.registerReader(ConnectResponse,
  function(propertyName: string) {
    this
      .read(ConnectState)
      .read(HPAI, 'dataEndpoint')
      .read(ConnectResponseDataBlock);
  }
);
FrameWriter.registerWriter(ConnectResponse,
  function() {
    // TODO
  }
);

export class ConnectionStateRequest extends Frame {
  connectionState: ConnectState;
  controlEndpoint: HPAI;
}
FrameReader.registerReader(ConnectionStateRequest,
  function(propertyName: string) {
    this
      .read(ConnectState)
      .read(HPAI, 'controlEndpoint');
  }
);
FrameWriter.registerWriter(ConnectionStateRequest,
  function(channelId: number, address: number, port: number) {
    this
      .write(ConnectState, channelId, 0x00)
      .write(HPAI, address, port);
  }
);

export class ConnectionStateResponse extends Frame {
  connectionState: ConnectState;
}
FrameReader.registerReader(ConnectionStateResponse,
  function(propertyName: string) {
    this
      .read(ConnectState);
  }
);
FrameWriter.registerWriter(ConnectionStateResponse,
  function() {
    // TODO
  }
);

export class DisconnectRequest extends Frame {
  connectionState: ConnectState;
  controlEndpoint: HPAI;
}
FrameReader.registerReader(DisconnectRequest,
  function(propertyName: string) {
    this
      .read(ConnectState)
      .read(HPAI, 'controlEndpoint');
  }
);
FrameWriter.registerWriter(DisconnectRequest,
  function(channelId: number, address: number, port: number) {
    this
      .write(ConnectState, channelId, 0x00)
      .write(HPAI, address, port);
  }
);

export class DisconnectResponse extends Frame {
  connectionState: ConnectState;
  controlEndpoint: HPAI;
}
FrameReader.registerReader(DisconnectResponse,
  function(propertyName: string) {
    this
      .read(ConnectState);
  }
);
FrameWriter.registerWriter(DisconnectResponse,
  function(channelId: number, status: ErrorCodes) {
    this
      .write(ConnectState, channelId, status);
  }
);

export class TunnelingRequest extends Frame {
  tunnelState: TunnelState;
  cemi: CEMI;
}
FrameReader.registerReader(TunnelingRequest,
  function(propertyName: string) {
    this
      .read(TunnelState)
      .read(CEMI);
  }
);
FrameWriter.registerWriter(TunnelingRequest,
  function() {
    // TODO
  }
);

export class TunnelingAck extends Frame {
  tunnelState: TunnelState;
}
FrameReader.registerReader(TunnelingAck,
  function(propertyName: string) {
    this
      .read(TunnelState);
  }
);
FrameWriter.registerWriter(TunnelingAck,
  function(channelId: number, sequence: number) {
    this
      .write(TunnelState, channelId, sequence, 0x00);
  }
);

export class KnxProtocol {

  public static readFrame(buffer: Buffer): Frame {
    var parser = new FrameReader(buffer).read(Frame);
    var frame = parser.getFrame();
    return frame;
  }

  public static createSearchRequest(discoveryAddress: number, discoveryPort: number): Frame {
    var parser = new FrameWriter();
    parser.write(Frame, ServiceType.SEARCH_REQUEST, discoveryAddress, discoveryPort);
    return KnxProtocol.readFrame(parser.getBuffer());
  }

  public static createConnectRequest(discoveryAddress: number, discoveryPort: number, dataAddress: number, dataPort: number): Frame {
    var parser = new FrameWriter();
    parser.write(Frame, ServiceType.CONNECT_REQUEST, discoveryAddress, discoveryPort, dataAddress, dataPort);
    return KnxProtocol.readFrame(parser.getBuffer());
  }

  public static createConnectionStateRequest(channelId: number, address: number, port: number): Frame {
    var parser = new FrameWriter();
    parser.write(Frame, ServiceType.CONNECTIONSTATE_REQUEST, channelId, address, port);
    return KnxProtocol.readFrame(parser.getBuffer());
  }

  public static createDisconnectRequest(channelId: number, address: number, port: number): Frame {
    var parser = new FrameWriter();
    parser.write(Frame, ServiceType.DISCONNECT_REQUEST, channelId, address, port);
    return KnxProtocol.readFrame(parser.getBuffer());
  }

  public static createDisconnectResponse(channelId: number, status: ErrorCodes): Frame {
    var parser = new FrameWriter();
    parser.write(Frame, ServiceType.DISCONNECT_RESPONSE);
    return KnxProtocol.readFrame(parser.getBuffer());
  }

  public static createTunnelingAck(channelId: number, sequence: number): Frame {
    var parser = new FrameWriter();
    parser.write(Frame, ServiceType.TUNNELING_ACK, channelId, sequence);
    return KnxProtocol.readFrame(parser.getBuffer());
  }

}
