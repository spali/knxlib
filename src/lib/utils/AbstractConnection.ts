import { Subject, Subscriber, Subscription, BehaviorSubject, Observable } from 'rxjs';
import { Logger, LoggerProperties } from './';

export enum ConnectionState {
  disconnected,
  connecting,
  connected,
  disconnecting
}

export abstract class AbstractConnection<T> extends Observable<T> {

  protected loggerProperties: LoggerProperties = { 'state': () => ConnectionState[this.stateSubject.getValue()] };
  protected logger: Logger;
  protected outputSubject: Subject<T>;
  protected stateSubject = new BehaviorSubject<ConnectionState>(ConnectionState.disconnected);
  protected stateObservable = this.stateSubject.asObservable().skip(1);

  /**
   * create new instance of AbstractConnection.
   * @param  {LoggerProperties} loggerProperties         additional logger properties
   */
  public constructor(loggerProperties: LoggerProperties = {}) {
    super();
    this.logger = new Logger(this.constructor.name, Object.assign({}, this.loggerProperties, loggerProperties));
    // subscribe state changes for debugging
    this.stateSubject
      .skip(1) // ingore initial disconnected state
      .subscribe(state => this.logger.debug('statechange'));
    this._resetState();
  }

  public isConnected(): boolean {
    return this.stateSubject.getValue() === ConnectionState.connected;
  }

  public getState(): ConnectionState {
    return this.stateSubject.getValue();
  }

  public getState$(): Observable<ConnectionState> {
    return this.stateObservable;
  }

  protected next(next: T) {
    this.outputSubject.next(next);
  }

  protected error(error: Error) {
    this.outputSubject.error(error);
    this.stateSubject.error(error);
  }

  protected _subscribe(subscriber: Subscriber<T>): Subscription {
    if (this.stateSubject.getValue() === ConnectionState.disconnected) {
      this.stateSubject.next(ConnectionState.connecting);
      this.connecting()
        .subscribe(() => this.stateSubject.next(ConnectionState.connected));
    }
    let subscription = new Subscription();
    subscription.add(this.outputSubject.subscribe(subscriber));
    subscription.add(() => {
      if (this.outputSubject.observers.length === 0) {
        this.stateSubject.next(ConnectionState.disconnecting);
        this.disconnecting()
          .subscribe(() => {
            this.stateSubject.next(ConnectionState.disconnected);
            this.outputSubject.complete();
            this.stateSubject.complete();
            this._resetState();
          });
      }
    });
    return subscription;
  }

  /**
   * implement connecting of the connection.
   * implemenentaion must return an Observable which emits and complets when disconnection is done.
   * @param {Function} done has to be called after connecting
   */
  protected abstract connecting(): Observable<ConnectionState>;

  /**
   * implement disconnecting of the connection.
   * implemenentaion must return an Observable which emits and complets when disconnection is done.
   * @param {Function} done has to be called after disconnecting
   */
  protected abstract disconnecting(): Observable<ConnectionState>;

  /**
   * reset state.
   */
  protected _resetState(): void {
    this.outputSubject = new Subject<T>();
  }

}
