
declare class BinaryProtocol {
  /**
   * Define a data type.
   *
   * @param  {String}         name   The name of the data type.
   * @param  {Object}         config The configuration.
   * @return {BinaryProtocol}        The current object.
   */
  define(name: string, config: Config): BinaryProtocol;

  createReader(buffer?: Buffer, offset?: number): ProtocolReader;
  createWriter(buffer?: Buffer, offset?: number): ProtocolWriter;
}

declare interface Config {
  read(this: ProtocolReader, propertyName: string): void;
  write(this: ProtocolWriter, ...value: any[]): void;
}

declare class ProtocolReader {
  [key: string]: any;

  buffer: Buffer;
  offset: number;

  /**
   * Demand a certain number of bytes before continuing.
   *
   * @param  {int}            howMany The number of bytes to demand.
   * @return {ProtocolReader}         The current object.
   */
  demand(howMany: number): ProtocolReader;

  /**
   * Push an item onto the stack.
   *
   * @param  {mixed}          item The item to push.
   * @return {ProtocolReader}      The current object.
   */
  pushStack(item: any): ProtocolReader;

  /**
   * Pop an item off the stack.
   *
   * @param  {String}         propertyName The name of the property to inject the popped item into, optional.
   * @param  {Function}       fn           The collector function, optional.
   * @return {ProtocolReader}              The current object.
   */
  popStack(propertyName: string, fn: (this: ProtocolReader, data: any) => void): ProtocolReader;

/**
 * Collect data from the current stack.
 *
 * @param  {String}         propertyName The name of the property to inject the collected data into.
 * @param  {Function}       fn           The collector function.
 * @return {ProtocolReader}              The current object.
 */
collect(propertyName: string, fn: (this: ProtocolReader, data: any) => void): ProtocolReader;

/**
 * Tap into the current results, to allow conditional logic.
 *
 * @param  {Function}       fn The function to execute, receives the current data as first argument.
 * @return {ProtocolReader}    The current object.
 */
tap(fn: (this: ProtocolReader, data: any) => void): ProtocolReader;

/**
 * Read a number of raw bytes
 *
 * @param  {String} propertyName The property name to read the buffer into, if any.
 * @param  {int}    length       The number of bytes to read.
 * @return {ProtocolReader}      The current object.
 */
raw(propertyName: string, length: number): ProtocolReader;

/**
 * Read the next value.
 *
 * @return {mixed} The value read from the stream, or `AWAIT_NEXT` if the reader requires more data.
 */
next(): any;

Int8(propertyName: string): ProtocolReader;
UInt8(propertyName: string): ProtocolReader;
Int16LE(propertyName: string): ProtocolReader;
UInt16LE(propertyName: string): ProtocolReader;
Int16BE(propertyName: string): ProtocolReader;
UInt16BE(propertyName: string): ProtocolReader;
Int32LE(propertyName: string): ProtocolReader;
Int32BE(propertyName: string): ProtocolReader;
UInt32LE(propertyName: string): ProtocolReader;
UInt32BE(propertyName: string): ProtocolReader;
FloatLE(propertyName: string): ProtocolReader;
FloatBE(propertyName: string): ProtocolReader;
DoubleLE(propertyName: string): ProtocolReader;
DoubleBE(propertyName: string): ProtocolReader;
}

declare class ProtocolWriter {
  [key: string]: any;

  buffer: Buffer;
  offset: number;

  /**
   * Tap into the current chain.
   *
   * @param  {Function}        fn The tapper function.
   * @return {ProtocolWriter}     The current object.
   */
  tap(fn: (this: ProtocolWriter, data: any) => void): ProtocolWriter;

/**
 * Write a raw buffer.
 *
 * @param  {Buffer}         buffer The buffer to write.
 * @return {ProtocolWriter}        The current object.
 */
raw(buffer: Buffer): ProtocolWriter;

/**
 * Advance the offset by a number of bytes.
 *
 * @param  {int}            howMany The number of bytes to advance by.
 * @return {ProtocolWriter}         The current object.
 */
forward(howMany: number): ProtocolWriter;

/**
 * Allocate a number of bytes.
 *
 * @param  {int}            howMany The number of bytes to allocate.
 * @return {ProtocolWriter}         The current object.
 */
allocate(howMany: number): ProtocolWriter;

Int8(value: number): ProtocolWriter;
UInt8(value: number): ProtocolWriter;
Int16LE(value: number): ProtocolWriter;
UInt16LE(value: number): ProtocolWriter;
Int16BE(value: number): ProtocolWriter;
UInt16BE(value: number): ProtocolWriter;
Int32LE(value: number): ProtocolWriter;
Int32BE(value: number): ProtocolWriter;
UInt32LE(value: number): ProtocolWriter;
UInt32BE(value: number): ProtocolWriter;
FloatLE(value: number): ProtocolWriter;
FloatBE(value: number): ProtocolWriter;
DoubleLE(value: number): ProtocolWriter;
DoubleBE(value: number): ProtocolWriter;

}

declare module 'binary-protocol' {
  export = BinaryProtocol;
}
