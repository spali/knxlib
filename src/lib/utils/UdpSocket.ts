import { Observable, Observer } from 'rxjs';
import { createSocket, Socket } from 'dgram';
import { IPHelper } from './index';
import { AbstractConnection, ConnectionState } from './AbstractConnection';

export interface RemoteInfo {
  address: string;
  family?: string;
  port: number;
}

export interface SocketMessage {
  msg: Buffer;
  rinfo: RemoteInfo;
}

export interface UdpSocketConfig {
  /** local address to listen. if not specified, tries to listen on all addresses. */
  localAddress: string;
  /** local port to listen. if not specified, tries to listen on a random port. */
  localPort: number;
  /** set for joining multicast networks. */
  multicastAddress?: string | string[];
}

export class UdpSocket extends AbstractConnection<SocketMessage> {

  private socket: Socket;
  private config: UdpSocketConfig;

  /**
   * create new instance of udp socket connection subject.
   * @param  {UdpSocketConfig}   config         config options
   */
  static create(config: UdpSocketConfig) {
    return new UdpSocket(config);
  }

  /**
   * create new instance of udp socket connection subject.
   * @param  {UdpSocketConfig}   config         config options
   */
  public constructor(config: UdpSocketConfig) {
    super();
    if (config.multicastAddress !== null) {
      if (typeof config.multicastAddress === 'string' && IPHelper.isMulticast(config.multicastAddress) === false) {
        throw new Error('invalid multicast address: ' + config.multicastAddress);
      }
      if (config.multicastAddress instanceof Array) {
        config.multicastAddress.forEach(address => {
          if (IPHelper.isMulticast(address) === false) {
            throw new Error('invalid multicast address: ' + address);
          }
        });
      }
    }
    this.config = config;
  }

  /**
   * returns the local address the socket is bound to.
   * till the socket is not connected this returns null.
   * @return {string} the local address the socket is bound to
   */
  public getAddress(): string {
    try {
      return this.socket.address().address;
    } catch (error) {
      return null;
    }
  }

  /**
   * returns the local port the socket is bound to.
   * till the socket is not connected this returns null.
   * @return {number} the local port the socket is bound to
   */
  public getPort(): number {
    try {
      return this.socket.address().port;
    } catch (error) {
      return null;
    }
  }

  /**
   * send a message.
   * returns the observable for receiving messages.
   * @param  {Buffer}                    msg     [description]
   * @param  {string}                    address [description]
   * @param  {number}                    port    [description]
   * @return {Observable<SocketMessage>}         [description]
   */
  public send(msg: Buffer, address: string, port: number): Observable<SocketMessage> {
    var fncSend = () =>
      this.socket.send(msg, port, address, (error?) => {
        if (error) {
          this.error(error);
        }
      });
    if (this.getState() !== ConnectionState.connected) {
      this.getState$()
        .first(state => state === ConnectionState.connected)
        .subscribe(fncSend, this.error);
    } else {
      fncSend();
    }
    return this;
  }

  protected connecting(): Observable<ConnectionState> {
    return Observable.create((observer: Observer<ConnectionState>) => {
      this.socket = this.socket = createSocket('udp4');
      this.socket.on('listening', () => {
        if (this.config.multicastAddress !== null) {
          if (typeof this.config.multicastAddress === 'string') {
            this.addMulticastMembership(this.config.multicastAddress);
          } else if (this.config.multicastAddress instanceof Array) {
            this.config.multicastAddress.forEach(address => {
              this.addMulticastMembership(address);
            });
          }
        }
        this.logger.debug(`listening ${this.socket.address().address}:${this.socket.address().port}`);
        observer.next(ConnectionState.connected);
        observer.complete();
      });
      this.socket.on('error', error => {
        this.error(error);
      });
      this.socket.on('message', (msg, rinfo) => {
        this.logger.debug('message received:', msg.toString('hex'));
        this.next({ msg: msg, rinfo: rinfo });
      });
      this.socket.bind(this.config.localPort, this.config.localAddress);
    });
  }

  /**
   * disconnect socket and reset state.
   */
  protected disconnecting(): Observable<ConnectionState> {
    return Observable.create((observer: Observer<ConnectionState>) => {
      if (this.socket !== null) {
        if (this.config.multicastAddress !== null) {
          if (typeof this.config.multicastAddress === 'string') {
            this.dropMulticastMembership(this.config.multicastAddress);
          } else if (this.config.multicastAddress instanceof Array) {
            this.config.multicastAddress.forEach(address => {
              this.dropMulticastMembership(address);
            });
          }
        }
        this.socket.close(() => {
          observer.next(ConnectionState.disconnected);
          observer.complete();
        });
      }
    });
  }

  protected _resetState() {
    super._resetState();
    this.socket = null;
  }

  /**
   * dedicated method for simpler testing.
   */
  private addMulticastMembership(multicastAddress: string, multicastInterface?: string): void {
    try {
      this.socket.addMembership(multicastAddress, multicastInterface);
    } catch (error) {
      throw new Error('adding multicast membership (' + multicastAddress + ' on ' + multicastInterface + ') failed with: ' + error);
    }
  }

  /**
   * dedicated method for simpler testing.
   */
  private dropMulticastMembership(multicastAddress: string, multicastInterface?: string): void {
    try {
      this.socket.dropMembership(multicastAddress, multicastInterface);
    } catch (error) {
      throw new Error('dropping multicast membership (' + multicastAddress + ' on ' + multicastInterface + ') failed with: ' + error);
    }
  }

}
