import { FramePart, PropertyDef, ParserType } from './FramePart';
import { HEADER_SIZE_10, KNXNETIP_VERSION_10, ProtocolVersion, ServiceType, HostProtocolCodes } from '../KnxConstants';

export class Header extends FramePart {
  @PropertyDef(ParserType.UInt8, HEADER_SIZE_10)
  length: number;
  @PropertyDef(ParserType.UInt8, KNXNETIP_VERSION_10)
  protocolVersion: ProtocolVersion;
  @PropertyDef(ParserType.UInt16BE)
  serviceType: ServiceType;
  @PropertyDef(ParserType.UInt16BE)
  totalLength: number;
}

export class HPAI extends FramePart {
  @PropertyDef(ParserType.UInt8, 0x08) // HPAI structure len (8 bytes)
  length: number;
  @PropertyDef(ParserType.UInt8, HostProtocolCodes.IPV4_UDP)
  protocolType: HostProtocolCodes;
  @PropertyDef(ParserType.UInt32BE)
  address: number;
  @PropertyDef(ParserType.UInt16BE)
  port: number;
}
