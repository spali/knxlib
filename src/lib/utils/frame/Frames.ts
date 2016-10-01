import { Frame, BufferState } from './Frame';
import { HPAI } from './FrameParts';

export class SearchRequest extends Frame {
  discoveryEndpoint: HPAI;

  fromBuffer(parserState: BufferState): void {
    this.discoveryEndpoint = new HPAI(parserState);
  }

  toBuffer(): Buffer {
    return this.buildBuffer([this.discoveryEndpoint.toBuffer(8)]);
  }
}
