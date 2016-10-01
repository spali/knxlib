import * as pino from 'pino';

export interface LoggerProperties {
  [key: string]: () => any;
}

/**
 * Logger wrapper for pino.
 * Optional support providing properties by callbacks (i.e. states which should be logged by every message).
 */
export class Logger {

  public properties: LoggerProperties;
  protected internalLogger: pino.Logger;
  protected formatString: string;

  constructor(protected name: string, properties: LoggerProperties = {}) {
    var pretty = pino.pretty({});
    pretty.pipe(process.stdout);
    this.internalLogger = pino({
      name: name,
      level: 'debug'
    }, pretty);

    this.setProperties(properties);
  }

  public setProperties(properties: LoggerProperties) {
    this.properties = properties;
    var array = Object.getOwnPropertyNames(this.properties).map(propertyName => propertyName + '=%s');
    if (array.length > 0) {
      this.formatString = '(' + (array.join(', ')) + ') ';
    } else {
      this.formatString = ' ';
    }
  }

  public error(obj: any, msg: string, ...args: any[]): void;
  public error(msg: string, ...args: any[]): void;
  public error(...args: any[]): void {
    if (typeof args[0] === 'object') {
      var obj = args.shift();
    }
    var msg = args.shift();
    if (obj) {
      this.internalLogger.error(obj, this.formatString + msg, ...this.resolveProperties(), ...args);
    } else {
      this.internalLogger.error(this.formatString + msg, ...this.resolveProperties(), ...args);
    }
  }

  public warn(obj: any, msg: string, ...args: any[]): void;
  public warn(msg: string, ...args: any[]): void;
  public warn(...args: any[]): void {
    if (typeof args[0] === 'object') {
      var obj = args.shift();
    }
    var msg = args.shift();
    if (obj) {
      this.internalLogger.warn(obj, this.formatString + msg, ...this.resolveProperties(), ...args);
    } else {
      this.internalLogger.warn(this.formatString + msg, ...this.resolveProperties(), ...args);
    }
  }

  public info(obj: any, msg: string, ...args: any[]): void;
  public info(msg: string, ...args: any[]): void;
  public info(...args: any[]): void {
    if (typeof args[0] === 'object') {
      var obj = args.shift();
    }
    var msg = args.shift();
    if (obj) {
      this.internalLogger.info(obj, this.formatString + msg, ...this.resolveProperties(), ...args);
    } else {
      this.internalLogger.info(this.formatString + msg, ...this.resolveProperties(), ...args);
    }
  }

  public debug(obj: any, msg: string, ...args: any[]): void;
  public debug(msg: string, ...args: any[]): void;
  public debug(...args: any[]): void {
    if (typeof args[0] === 'object') {
      var obj = args.shift();
    }
    var msg = args.shift();
    if (obj) {
      this.internalLogger.debug(obj, this.formatString + msg, ...this.resolveProperties(), ...args);
    } else {
      this.internalLogger.debug(this.formatString + msg, ...this.resolveProperties(), ...args);
    }
  }

  public trace(obj: any, msg: string, ...args: any[]): void;
  public trace(msg: string, ...args: any[]): void;
  public trace(...args: any[]): void {
    if (typeof args[0] === 'object') {
      var obj = args.shift();
    }
    var msg = args.shift();
    if (obj) {
      this.internalLogger.trace(obj, this.formatString + msg, ...this.resolveProperties(), ...args);
    } else {
      this.internalLogger.trace(this.formatString + msg, ...this.resolveProperties(), ...args);
    }
  }

  protected resolveProperties(): string[] {
    return Object.getOwnPropertyNames(this.properties)
      .map(key => this.properties[key])
      .map((property) => {
        return property();
      });
  }

}
