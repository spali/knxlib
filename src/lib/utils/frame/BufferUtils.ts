/** types of supported buffer read and write operations. */
export enum BufferType {
  UInt8,
  UInt16BE,
  UInt32BE,
  Function
}

/** map of BufferType to length used in byte. */
export const BufferTypeLength: number[] = [];
BufferTypeLength[BufferType.UInt8] = 1;
BufferTypeLength[BufferType.UInt16BE] = 2;
BufferTypeLength[BufferType.UInt32BE] = 4;

/**
 * state to hold offset during processing a Buffer.
 * @param  {Buffer} buffer   initial buffer
 */
export class BufferState {
  /** current offset. */
  public offset: number = 0;
  constructor(public buffer: Buffer) { }
  moveOffset(offset: number) {
    this.offset = this.offset + offset;
  }
}
