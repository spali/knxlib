import {
  IKnxConnectionOptions,
  KnxConnection
} from './';

export class KnxRouterConnection extends KnxConnection {

  /**
   * create new instance of a knx router (multicast) connection
   *
   * TODO: if local address is ommited, we don't know what to send to the router as local IP in connection request!!!!
   * TODO: implement multicast connection
   */
  constructor(options?: IKnxConnectionOptions) {
    super(options);
    throw new Error('multicast connection is not yet implemented');
  }

}
