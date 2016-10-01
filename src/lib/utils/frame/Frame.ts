import { SearchRequest } from './'; // TODO: curcular dependecy when imported from ./Frames
import { ServiceType, HEADER_SIZE_10 } from '../KnxConstants';
import { Header } from './FrameParts';

export class BufferState {
  constructor(public buffer: Buffer, public offset = 0) { }
  moveOffset(offset: number) {
    this.offset = this.offset + offset;
  }
}

export abstract class Frame {
  header: Header;

  static createFromBuffer(buffer: Buffer): Frame {
    var parserState = new BufferState(buffer);

    var header = new Header(parserState);
    switch (header.serviceType) {
      case ServiceType.SEARCH_REQUEST:
        var frame = new SearchRequest();
        frame.header = header;
        frame.fromBuffer(parserState);
        return frame;
    }
    throw new Error('unimplemented service type: ' + header.serviceType);
  }

  /**
   * concats the Buffer array together and inserts the header at the beginning of the buffer.
   * @param  {Buffer[]} buffers the Buffer array
   * @return {Buffer}           the Buffer
   */
  protected buildBuffer(buffers: Buffer[]): Buffer {
    this.header.totalLength = buffers.reduce((sum, buffer) => sum + buffer.length, 0) + HEADER_SIZE_10;
    buffers.unshift(this.header.toBuffer(HEADER_SIZE_10));
    return Buffer.concat(buffers);
  }

  /**
   * used by Frame to build a frame from a Buffer.
   * @return {Buffer}
   */
  protected abstract fromBuffer(parserState: BufferState): void;

  /**
   * returns the frame as Buffer.
   * @return {Buffer}
   */
  abstract toBuffer(): Buffer;
}
