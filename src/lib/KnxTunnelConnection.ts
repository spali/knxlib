import {
  IKnxConnectionOptions,
  KnxConnection
} from './';

export class KnxTunnelConnection extends KnxConnection {

  /**
   * create new instance of a knx tunnel (unicast) connection
   *
   * TODO: if local address is ommited, we don't know what to send to the router as local IP in connection request!!!!
   * TODO: implement search request for unicast connection without known destination address.
   */
  constructor(options?: IKnxConnectionOptions) {
    super(options);
  }

}
