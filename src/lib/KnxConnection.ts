import { Observable, Observer, Subscription } from 'rxjs';
import {
  ConnectionState,
  IPHelper,
  UdpSocket,
  AbstractConnection,
  Timeouts,
  KNXNETIP_PORT,
  KNXNETIP_MULTICAST_ADDRESS,
  ErrorCodes,
  KnxProtocol,
  Frame,
  SearchResponse,
  ConnectResponse,
  DisconnectRequest,
  DisconnectResponse,
  ConnectionStateResponse,
  TunnelingRequest,
  ServiceType,
} from '../lib/utils';

export interface IKnxConnectionOptions {
  /** local address to listen. if not specified, tries to listen on all addresses. */
  localAddress?: string;
  /** local control port. if not specified, a random port is used. */
  localControlPort?: number;
  /** local data port. if not specified, a random port is used. only required if twoChannel is true. */
  localDataPort?: number;
  /** destination address to connect to. */
  destinationAddress?: string;
  /** destination port to connect to. defaults to KNXNETIP_PORT .*/
  destinationPort?: number;
  /** use seperate control and data channel. */
  twoChannel?: boolean;
  /** reconnect automatically if connection was not disconnected by client. */
  autoReconnect?: boolean;
  /** time waiting for search response before retries. */
  searchRequestTimeout?: number;
  /** time waiting for connect state response before retries. */
  connectRequestTimeout?: number;
  /** time waiting for connect state response before retries. */
  connectionStateRequestTimeout?: number;
  /** time waiting for tunneling ack before retries. */
  tunnelingRequestTimeout?: number;
  /** time waiting for disconnect response before retries. */
  disconnectRequestTimeout?: number;
  /** max. amount of retries for connection. */
  maxRetries?: number;
  /** interval for connection checks. */
  connectionStateIntervalDelay?: number;
  /** true for multicast connection. */
  multicast?: boolean;
  /** amount of time to wait before auto reconnect. */
  autoReconnectDelay?: number;
}

export class KnxConnectionStats {
  /** count of all messages received. */
  receivedMessages = 0;
  /** parsing errors of frames. */
  receivedMessagesParsingErrors = 0;
  /** messages which were not connection related and were forwarded to the client. */
  receivedDataMessages = 0;
  /** count of all messages sent. */
  sentMessages = 0;
  /** counter to keep track of the amount of reconnects. */
  autoReconnectCounter = 0;
  /** connection start time. */
  connectedTime: Date;
  /** connection stop time. */
  disconnectedTime: Date;
  /** seconds of the connection. */
  connectionTime: number;
}

/** KnxConnection default options. */
export class KnxConnectionOptions implements IKnxConnectionOptions {
  localAddress = undefined as string;
  localControlPort = undefined as number;
  localDataPort = undefined as number;
  destinationAddress = KNXNETIP_MULTICAST_ADDRESS;
  destinationPort = KNXNETIP_PORT;
  twoChannel = false;
  autoReconnect = true;
  connectRequestTimeout = Timeouts.CONNECT_REQUEST_TIMEOUT;
  searchRequestTimeout = 10; // TODO: check spec for defined value
  connectionStateRequestTimeout = Timeouts.CONNECTIONSTATE_REQUEST_TIMEOUT;
  tunnelingRequestTimeout = Timeouts.TUNNELING_REQUEST_TIMEOUT;
  disconnectRequestTimeout = 10; // TODO: check spec for defined value
  maxRetries = 3; // TODO: check spec for defined value
  connectionStateIntervalDelay = Timeouts.CONNECTION_ALIVE_TIME / 2; // TODO: check spec for recommeded value
  multicast = false;
  autoReconnectDelay = 1;
}

/**
 * [KnxConnectionStats description]
 * TODO: if local address is ommited, we don't know what to send to the router as local IP in connection request!!!!
 * TODO: implement multicast connection
 */
export abstract class KnxConnection extends AbstractConnection<Frame> {

  /** default options. */
  protected options: IKnxConnectionOptions;
  /** some statistics of the connection. */
  protected stats = new KnxConnectionStats();

  protected controlSocket: UdpSocket;
  protected dataSocket: UdpSocket;

  protected frame$: Observable<Frame>;

  /** current connection communication channel id. */
  protected channelId: number;

  /** inverval for connection sending connection state requests. */
  protected connectionStateInterval: NodeJS.Timer;

  /** inner subscription. */
  private subscription: Subscription;

  /**
   * create new instance of a knx connection
   *
   * TODO: if local address is ommited, we don't know what to send to the router as local IP in connection request!!!!
   */
  constructor(options?: IKnxConnectionOptions) {
    super({ 'channelId': () => this.channelId });
    this.options = Object.assign(new KnxConnectionOptions(), options);
  }

  /**
   * connection control and optional data socket.
   * returns an observable that emits only on connected and then completes.
   * @return {Observable<ConnectionState>} [description]
   */
  protected connecting(): Observable<ConnectionState> {
    return Observable.create((observer: Observer<ConnectionState>) => {
      // setup sockets
      this.controlSocket = new UdpSocket({
        localAddress: this.options.localAddress,
        localPort: this.options.localControlPort,
        multicastAddress: IPHelper.isMulticast(this.options.destinationAddress) ? this.options.destinationAddress : null
      });
      if (this.options.twoChannel) {
        this.dataSocket = new UdpSocket({
          localAddress: this.options.localAddress,
          localPort: this.options.localDataPort,
          multicastAddress: IPHelper.isMulticast(this.options.destinationAddress) ? this.options.destinationAddress : null
        });
      } else {
        this.dataSocket = this.controlSocket;
      }

      // merge sockets and translate receiving messages to frames
      this.frame$ = ((this.options.twoChannel) ? Observable.merge(this.controlSocket, this.dataSocket) : this.controlSocket)
        .do(frame => this.stats.receivedMessages++) // count messages for statistics
        .map(msg => this.msgToFrame(msg.msg)) // map msg buffer to frame
        .do(frame => this.logger.debug('frame received:', ServiceType[frame.header.serviceType]))
        .do(frame => this.logger.trace(frame, 'frame:'))
        .do(frame => this.handleMessage(frame))
        .share();

      // subscribe for sending connection request when socket(s) are connected
      this.getCombinedSocketObservableForState(ConnectionState.connected)
        .do(() => {
          // reset statistics
          this.stats.autoReconnectCounter = 0;
          this.stats.connectedTime = new Date();
        })
        .concatMap((state) => {
          if (!this.options.destinationAddress) {
            return this.searchRequestSending();
          }
          return Observable.of(null);
        })
        .concatMap(() => this.connectRequestSending())
        .subscribe(
        frame => {
          this.channelId = frame.connectionState.channelId;
          observer.next(ConnectionState.connected);
          observer.complete();
          // start interval connection state request
          Observable.timer(0, this.options.connectionStateIntervalDelay * 1000)
            .takeWhile(() => this.getState() === ConnectionState.connected)
            .concatMap(() => this.stateRequestSending())
            .subscribe(
            null, // connection still valid, nothing to do
            error => {
              // giving up
              this.logger.error('did not receive a valid connection state response after %s tries, giving up', this.options.maxRetries);
              // clear state inverval
              //stateRequestSubscription.unsubscribe();
              if (this.options.autoReconnect) {
                // reconnect if disconnect was not initiated by client and auto reconnect is enabled
                // be gentle and not reconnect to fast
                setTimeout(() => {
                  this.stats.autoReconnectCounter++;
                  this.logger.warn('reconnect (reason: autoReconnect=true, autoReconnectCounter=%s)',
                    this.stats.autoReconnectCounter);
                  /*this.connecting();*/ // TODO
                }, this.options.autoReconnectDelay * 1000);
              } else {
                /*this.disconnecting().subscribe();*/ // TODO
              }
            }
            );
        },
        error => {
          // giving up
          // TODO: distinguish between errors
          this.logger.error(error, 'error:');
          this.error(new Error('did not receive a valid connection response after ' + this.options.maxRetries + ' tries, giving up'));
        }
        );
      this.subscription = this.frame$.subscribe();
    });
  }

  protected disconnecting(): Observable<ConnectionState> {
    return this.disconnectRequestSending()
      .catch((error, observable) => {
        // log error but continue with disconnecting socket
        this.logger.error('error trying do disconnect: ' + error);
        return observable;
      })
      .do(() => this.subscription.unsubscribe())
      .concatMap(() =>
        this.getCombinedSocketObservableForState(ConnectionState.disconnected)
          .do(() => {
            this.channelId = undefined;
            this.stats.disconnectedTime = new Date();
            this.stats.connectionTime = Math.floor((this.stats.disconnectedTime.getTime() - this.stats.connectedTime.getTime()) / 1000);
            this.logger.debug(this.stats, 'stats');
          })
      )
      ;
  }

  protected _resetState() {
    super._resetState();
    this.controlSocket = null;
    this.dataSocket = null;
  }

  /**
   * observable which fires and completes when both sockets reaching the specific state.
   * @param  {ConnectionState}             requiredState state required
   * @return {Observable<ConnectionState>}
   */
  protected getCombinedSocketObservableForState(requiredState: ConnectionState): Observable<ConnectionState> {
    var socketObservable: Observable<ConnectionState>;
    if (this.options.twoChannel) { // TODO: test if we can always use zip independend of two or one channel (both getState$ should emit anyway)
      socketObservable = Observable.zip(
        this.controlSocket.getState$().first(state => state === requiredState),
        this.dataSocket.getState$().first(state => state === requiredState),
        (controlState, dataState) => {
          if (controlState === dataState) {
            return controlState;
          }
          throw new Error('control or data socket did not reach ' + ConnectionState[requiredState]);
        }
      );
    } else {
      socketObservable = this.controlSocket.getState$().first(state => state === requiredState);
    }
    return socketObservable;
  }

  /**
   * parse buffer to a frame.
   * @param  {Buffer} msg buffer
   * @return {Frame}
   */
  protected msgToFrame(msg: Buffer): Frame {
    var frame: Frame;
    try {
      frame = KnxProtocol.readFrame(msg);
    } catch (error) {
      this.stats.receivedMessagesParsingErrors++;
      this.logger.error('Frame parsing error, unsupported message received?', error, frame);
    }
    return frame;
  }

  /**
   * handles incomming messages.
   * reacts on connection related messages.
   * @param  {Frame}   frame the frame
   */
  protected handleMessage(frame: Frame) {
    if (frame instanceof DisconnectRequest) {
      // only disconnect on correct channelId
      if (frame.connectionState.channelId === this.channelId) {
        this.disconnectResponseSending();
        // TODO: disconnect
      } else {
        // TODO: check spec if we should ignore wrong channel id silently
        this.logger.debug('sending disconnect response (wrong channel id)');
        this.sendControl(
          () => KnxProtocol.createDisconnectResponse(this.channelId, ErrorCodes.E_CONNECTION_ID),
        )
          .subscribe({
            next: null // TODO: close connection gracefully andf probably reconnect
          });
      }
    } else if (frame instanceof TunnelingRequest) {
      // TODO: check spec if we should ignore wrong channel id
      // TODO: check spec for sequence number (probalby we should save acked sequences to prevent double ack?)
      this.send(
        () => KnxProtocol.createTunnelingAck(this.channelId, (<TunnelingRequest>frame).tunnelState.sequence)
      )
        .subscribe();
      this.stats.receivedDataMessages++;
      this.next(frame);
    }
  }

  /**
   * send seaerch request and emits the response frame on the returning obserable if valid response is received.
   * @return {Observable<ConnectResponse>}
   */
  protected searchRequestSending(): Observable<SearchResponse> {
    if (IPHelper.toNumber(this.controlSocket.getAddress()) === 0) {
      throw new Error('require local address for discovery when no destination address is given');
    }
    return this.sendControl(
      () => KnxProtocol.createSearchRequest(
        IPHelper.toNumber(this.controlSocket.getAddress()), // control socket
        this.controlSocket.getPort() // control socket
      ),
      KNXNETIP_MULTICAST_ADDRESS // always use multicast address for search request
    )
      .first(frame => frame instanceof SearchResponse)
      .map(frame => (<SearchResponse>frame))
      .map(frame => {
        // TODO: should be saved somewhere else to distinguish between option and dynamic retrived settings
        this.options.destinationAddress = IPHelper.toString(frame.controlEndpoint.address);
        this.options.destinationPort = frame.controlEndpoint.port;
        return frame;
      })
      .timeout(this.options.searchRequestTimeout * 1000) // timeout
      .retryWhen(errors => errors
        .do((error: Error) => this.logger.warn(error.message)) // log error
        .scan<number>((errorCount, err) => {
          errorCount++;
          if (errorCount >= this.options.maxRetries) {
            throw err;
          }
          return errorCount;
        }, 0)
        .delay(1000)
      );
  }

  /**
   * send connect request and emits the response frame on the returning obserable if valid response is received.
   * @return {Observable<ConnectResponse>}
   */
  protected connectRequestSending(): Observable<ConnectResponse> {
    return this.sendControl(
      () => KnxProtocol.createConnectRequest(
        IPHelper.toNumber(this.controlSocket.getAddress()), // control socket
        this.controlSocket.getPort(), // control socket
        (this.options.twoChannel) // TODO: can be removed since we always set dataSocket
          ? IPHelper.toNumber(this.dataSocket.getAddress())
          : IPHelper.toNumber(this.controlSocket.getAddress()),  // data socket
        (this.options.twoChannel)
          ? this.dataSocket.getPort()
          : this.controlSocket.getPort()  // data socket
      )
    )
      .first(frame => frame instanceof ConnectResponse)
      .map(frame => (<ConnectResponse>frame))
      .map(frame => {
        // check response status
        if (frame.connectionState.status !== ErrorCodes.E_NO_ERROR) {
          throw new Error('connect response contained error: ' +
            ErrorCodes[frame.connectionState.status] + ' (' + frame.connectionState.status + ')'
          );
        }
        return frame;
      })
      .timeout(this.options.connectRequestTimeout * 1000) // timeout
      .retryWhen(errors => errors
        .do((error: Error) => this.logger.warn(error.message)) // log error
        .scan<number>((errorCount, err) => {
          errorCount++;
          if (errorCount >= this.options.maxRetries) {
            throw err;
          }
          return errorCount;
        }, 0)
        .delay(1000)
      );
  }

  /**
   * send connection state request and emits the response frame on the returning obserable if valid response is received.
   * @return {Observable<ConnectionStateResponse>}
   */
  protected stateRequestSending(): Observable<ConnectionStateResponse> {
    return this.sendControl(
      () => KnxProtocol.createConnectionStateRequest(
        this.channelId, IPHelper.toNumber(this.controlSocket.getAddress()), this.controlSocket.getPort()
      )
    )
      .first(frame => frame instanceof ConnectionStateResponse && frame.connectionState.channelId === this.channelId)
      .map(frame => (<ConnectionStateResponse>frame))
      .map(frame => {
        // check response status
        if (frame.connectionState.status !== ErrorCodes.E_NO_ERROR) {
          throw new Error('connection state response contained error: ' +
            ErrorCodes[frame.connectionState.status] + ' (' + frame.connectionState.status + ')'
          );
        }
        return frame;
      })
      .timeout(this.options.connectionStateRequestTimeout * 1000) // timeout
      .retryWhen(errors => errors
        .do((error: Error) => this.logger.warn(error.message)) // log error
        .scan<number>((errorCount, err) => {
          errorCount++;
          if (errorCount >= this.options.maxRetries) {
            throw err;
          }
          return errorCount;
        }, 0)
        .delay(1000)
      );
  }

  protected disconnectRequestSending(): Observable<DisconnectResponse> {
    return this.sendControl(
      () => KnxProtocol.createDisconnectRequest(
        this.channelId, IPHelper.toNumber(this.controlSocket.getAddress()), this.controlSocket.getPort()
      )
    )
      .first(frame => frame instanceof DisconnectResponse && frame.connectionState.channelId === this.channelId)
      .map(frame => (<DisconnectResponse>frame))
      .map(frame => {
        // check response status
        if (frame.connectionState.status !== ErrorCodes.E_NO_ERROR) {
          throw new Error('disconnection response contained error: ' +
            ErrorCodes[frame.connectionState.status] + ' (' + frame.connectionState.status + ')'
          );
        }
        return frame;
      })
      .timeout(this.options.disconnectRequestTimeout * 1000) // timeout
      //.retry(this.options.maxRetries) // tetry on errors (including timeout))
      .retryWhen(errors => errors
        .do((error: Error) => this.logger.warn(error.message)) // log error
        .scan<number>((errorCount, err) => {
          errorCount++;
          if (errorCount >= this.options.maxRetries) {
            throw err;
          }
          return errorCount;
        }, 0)
        .delay(1000)
      );
  }

  protected disconnectResponseSending(): void {
    this.sendControl(
      () => KnxProtocol.createDisconnectResponse(this.channelId, ErrorCodes.E_NO_ERROR),
    )
      .subscribe({
        next: null,
        error: (error: Error) => {
          //this.knxLinkDisconnected();
          // clear state inverval
          clearInterval(this.connectionStateInterval);
          if (this.options.autoReconnect) {
            // reconnect if disconnect was not initiated by client and auto reconnect is enabled
            // be gentle and not reconnect to fast
            setTimeout(() => {
              this.stats.autoReconnectCounter++;
              this.logger.info('reconnect (reason: autoReconnect=true, autoReconnectCounter=%s)',
                this.stats.autoReconnectCounter);

              /*this.connectRequestSending();*/ // TODO
            }, this.options.autoReconnectDelay * 1000);
          } else {

            /*this.disconnecting().subscribe();*/ // TODO
          }
        }
      });
  }

  /**
   * send a frame.
   * returns an observable for receiving frames.
   * NOTE: requires a subscription for the frame to be sent !
   * @param  {() => Frame}      createFrame function which creates the frame
   * @param  {string}           address     destination address (allow overwriting of options)
   */
  protected sendControl(createFrame: () => Frame, address?: string): Observable<Frame> {
    return Observable.defer(() => {
      this.sendInt(this.controlSocket, createFrame, address);
      return this.frame$;
    });
  }

  /**
   * send a frame.
   * returns an observable for receiving frames.
   * NOTE: requires a subscription for the frame to be sent !
   * @param  {() => Frame}      createFrame function which creates the frame
   */
  protected send(createFrame: () => Frame): Observable<Frame> {
    return Observable.defer(() => {
      this.sendInt(this.dataSocket, createFrame);
      return this.frame$;
    });
  }

  /**
   * send a frame throught the specific socket.
   * @param  {SocketConnection} socket      the socket to send the frame throught
   * @param  {() => Frame}      createFrame function which creates the frame
   */
  protected sendInt(socket: UdpSocket, createFrame: () => Frame, address?: string) {
    var frame = createFrame();
    socket.send(frame.rawBuffer, (address) ? address : this.options.destinationAddress, this.options.destinationPort);
    this.stats.sentMessages++; // count messages for statistics
    this.logger.debug('sent frame:', ServiceType[frame.header.serviceType]);
    this.logger.trace(frame, 'frame:');
  }

}
