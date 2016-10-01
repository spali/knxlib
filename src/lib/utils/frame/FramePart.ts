import { BufferState} from './Frame';

export enum ParserType {
  UInt8,
  UInt16BE,
  UInt32BE
}

export interface FramePartDef {
  name?: string;
  type: ParserType;
  default?: any;
}

/**
 * property decorator for FramePart properties.
 * @param  {ParserType}        type         the property buffer type
 * @param  {any}               defaultValue optional default value
 * @return {PropertyDecorator}
 */
export function PropertyDef(type: ParserType, defaultValue?: any): PropertyDecorator {
  return (target: any, key: string) => {
    if (!target.PROPERTIES) {
      Object.defineProperty(target, 'PROPERTIES', { value: [], enumerable: true });
    }
    target.PROPERTIES.push({ name: key, type: type, defaultValue });
  };
}

export abstract class FramePart {
  protected PROPERTIES: FramePartDef[];

  constructor(parserState: BufferState) {
    this.createFromBuffer(parserState);
  }

  protected createFromBuffer(parserState: BufferState): void {
    this.PROPERTIES.forEach(def => {
      switch (def.type) {
        case ParserType.UInt8:
          (<{ [key: string]: any }>this)[def.name] = parserState.buffer.readUInt8(parserState.offset);
          parserState.moveOffset(1);
          break;
        case ParserType.UInt16BE:
          (<{ [key: string]: any }>this)[def.name] = parserState.buffer.readUInt16BE(parserState.offset);
          parserState.moveOffset(2);
          break;
        case ParserType.UInt32BE:
          (<{ [key: string]: any }>this)[def.name] = parserState.buffer.readUInt32BE(parserState.offset);
          parserState.moveOffset(4);
          break;
      }
    });
  }

  public toBuffer(length: number): Buffer {
    var state = new BufferState(Buffer.alloc(length));
    this.PROPERTIES.forEach(def => {
      var value = (<{ [key: string]: any }>this)[def.name] || def.default;
      if (!value) {
        throw new Error('value for "' + def.name + '" in "' + this.constructor.name + '" required');
      }
      switch (def.type) {
        case ParserType.UInt8:
          state.buffer.writeUInt8(value, state.offset);
          state.moveOffset(1);
          break;
        case ParserType.UInt16BE:
          state.buffer.writeUInt16BE(value, state.offset);
          state.moveOffset(2);
          break;
        case ParserType.UInt32BE:
          state.buffer.writeUInt32BE(value, state.offset);
          state.moveOffset(4);
          break;
      }
    });
    return state.buffer;
  }
}
