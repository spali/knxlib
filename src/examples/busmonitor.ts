import { Subscription } from 'rxjs';
import * as process from 'process';
import { KnxConnection, KnxTunnelConnection, ServiceType } from '../';
import { Logger, ConnectionState } from '../lib/utils/index';

export class BusMonitor {

  protected logger: Logger = new Logger(this.constructor.name);
  protected subscription: Subscription;

  //private connection: KnxConnection = new KnxTunnelConnection({ localAddress: null, destinationAddress: '10.2.0.239', multicast: false });
  private connection: KnxConnection = new KnxTunnelConnection({ localAddress: '10.2.0.100', destinationAddress: null, multicast: false });

  constructor() {
    process.once('exit', (code: number) => {
      this.logger.debug('process exit');
      if (this.connection.isConnected()) {
        this.disconnect();
      }
    });

    process.once('SIGINT', () => {
      this.logger.debug('process sigint received');
      var listeners = process.listeners('SIGINT');
      if (listeners.length > 0) {
        this.logger.warn('Nice SIGINT-handler, following sigint handlers could block process from immediate and clean exit:');
      }
      for (var i = 0; i < listeners.length; i++) {
        this.logger.warn(listeners[i].toString());
      }

      if (this.connection.isConnected()) {
        this.disconnect();
      }
    });

    process.once('uncaughtException', (error: Error) => {
      this.logger.error(error, 'process uncaughtException received');
      if (this.connection.isConnected()) {
        this.disconnect();
      }
      throw error;
    });

    this.connection.getState$()
      .filter(state => state === ConnectionState.connected)
      .subscribe(state => this.logger.info(ConnectionState[state]));

  }

  public connect() {
    this.subscription = this.connection.subscribe(
      frame => {
        this.logger.info('message received:', ServiceType[frame.header.serviceType]);
        this.logger.trace(frame, 'message received:', ServiceType[frame.header.serviceType]);
      }
    );
  }

  public disconnect() {
    this.logger.debug('disconnecting...');
    this.subscription.unsubscribe();
  }
}

var busmonitor: BusMonitor = new BusMonitor();
busmonitor.connect();
