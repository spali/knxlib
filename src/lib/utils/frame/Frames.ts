import { BufferType, BufferState } from './BufferUtils';
import { Frame, FrameServiceType, FramePartDef } from './Frame';
import {
  ServiceType,
  ErrorCodes,
  ConnectionType,
  LinkLayer,
  DataLinkLayer
} from '../';
import {
  HPAI,
  ConnectState,
  ConnectRequestInformation,
  ConnectResponseDataBlock,
  TunnelState,
  CEMI
} from './FrameParts';

@FrameServiceType(ServiceType.SEARCH_REQUEST)
export class SearchRequest extends Frame {
  @FramePartDef({ address: 0, port: 1 })
  discoveryEndpoint: HPAI;

  constructor(discoveryEndpointAddress: number, discoveryEndpointPort: number);
  constructor(...args: any[]) {
    super(...args);
  }
}

@FrameServiceType(ServiceType.SEARCH_RESPONSE)
export class SearchResponse extends Frame {
  @FramePartDef({ address: 0, port: 1 })
  controlEndpoint: HPAI;
  // TODO: DIB: DEVICE_INFO
  // TODO: DIB: SUPP_SVC_FAMILIES

  constructor(controlEndpointAddress: number, controlEndpointPort: number);
  constructor(...args: any[]) {
    super(...args);
  }
}

@FrameServiceType(ServiceType.CONNECT_REQUEST)
export class ConnectRequest extends Frame {
  @FramePartDef({ address: 0, port: 1 })
  discoveryEndpoint: HPAI;
  @FramePartDef({ address: 2, port: 3 })
  dataEndpoint: HPAI;
  @FramePartDef({ connectionType: 4, knxLinkLayer: 5 })
  connectionRequestInformation: ConnectRequestInformation;

  constructor(
    discoveryEndpointAddress: number, discoveryEndpointPort: number,
    dataEndpointAddress: number, dataEndpointPort: number,
    connectionType: ConnectionType, knxLinkLayer: LinkLayer
  );
  constructor(...args: any[]) {
    super(...args);
  }
}

@FrameServiceType(ServiceType.CONNECT_RESPONSE)
export class ConnectResponse extends Frame {
  @FramePartDef({ channelId: 0, status: 1 })
  connectionState: ConnectState;
  @FramePartDef({ address: 2, port: 3 })
  dataEndpoint: HPAI;
  @FramePartDef({ connectionType: 4, knxAddress: 5 })
  connectResponseDataBlock: ConnectResponseDataBlock;

  constructor(
    channelId: number, status: ErrorCodes,
    dataEndpointAddress: number, dataEndpointPort: number,
    connectionType: ConnectionType, knxAddress: number
  );
  constructor(...args: any[]) {
    super(...args);
  }
}

@FrameServiceType(ServiceType.CONNECTIONSTATE_REQUEST)
export class ConnectionStateRequest extends Frame {
  @FramePartDef({ channelId: 0 })
  connectionState: ConnectState;
  @FramePartDef({ address: 1, port: 2 })
  controlEndpoint: HPAI;

  constructor(channelId: number, controlEndpointAddress: number, controlEndpointPort: number);
  constructor(...args: any[]) {
    super(...args);
  }
}

@FrameServiceType(ServiceType.CONNECTIONSTATE_RESPONSE)
export class ConnectionStateResponse extends Frame {
  @FramePartDef({ channelId: 0, status: 1 })
  connectionState: ConnectState;

  constructor(channelId: number, status: ErrorCodes);
  constructor(...args: any[]) {
    super(...args);
  }
}

@FrameServiceType(ServiceType.TUNNELING_REQUEST)
export class TunnelingRequest extends Frame {
  @FramePartDef({ channelId: 0, sequence: 1 })
  tunnelState: TunnelState;
  @FramePartDef({ messageCode: 2 })
  cemi: CEMI;

  constructor(
    channelId: number, sequence: number,
    messageCode: DataLinkLayer
  );
  constructor(...args: any[]) {
    super(...args);
  }
}
