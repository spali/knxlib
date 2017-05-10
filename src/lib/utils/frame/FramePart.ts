import * as deepExtend from 'deep-extend';
import { BufferType, BufferState, BufferTypeLength } from './BufferUtils';

/** data types containing data in the frame parts. */
export type PropertyDataTypes = string | number | Buffer;

export interface FramePartAsObject {
  [key: string]: PropertyDataTypes;
}

export type BufferReaderCallback = (this: FramePart, bufferState: BufferState) => PropertyDataTypes;
export type BufferLengthCallback = (this: FramePart, bufferState: BufferState) => number;
export type BufferDefaultCallback = (this: FramePart) => PropertyDataTypes;

export interface BufferCallbacks {
  reader: BufferReaderCallback;
  length: BufferLengthCallback;
  default: BufferDefaultCallback;
}

/** property metatype definition of frame parts. */
export interface IPropertyDef {
  name?: string;
  type: BufferType;
  default?: PropertyDataTypes;
  functions?: BufferCallbacks;
}

/**
 * property decorator for FramePart properties.
 * used to garantee the order of properties in frame parts and also to provide buffer type and default information.
 * @param  {BufferType}        type         the property buffer type
 * @param  {PropertyDataTypes} defaultValue optional default value
 * @return {PropertyDecorator}
 */
export function PropertyDef(type: BufferType, defaultValue?: PropertyDataTypes): PropertyDecorator;
/**
 * read and write the buffer by the provided callbacks.
 * @param  {BufferType}        type      must be BufferType.Function
 * @param  {BufferCallbacks}   functions callback functions
 * @return {PropertyDecorator}
 */
export function PropertyDef(type: BufferType, functions: BufferCallbacks): PropertyDecorator;
export function PropertyDef(type: BufferType, arg1?: PropertyDataTypes | BufferCallbacks): PropertyDecorator {
  return (target: typeof FramePart, key: string) => {
    var staticTarget = <typeof FramePart>target.constructor;
    if (!staticTarget.hasOwnProperty('__meta')) {
      var parentMeta = Object.getPrototypeOf(staticTarget).__meta;
      // TODO: eliminate dependecy to deepExtend
      Object.defineProperty(staticTarget, '__meta', { value: deepExtend({ properties: [] }, parentMeta), enumerable: true });
    }
    switch (type) {
      case BufferType.Function:
        staticTarget.__meta.properties.push({ name: key, type: type, functions: <BufferCallbacks>arg1 });
        break;
      default:
        staticTarget.__meta.properties.push({ name: key, type: type, default: <PropertyDataTypes>arg1 });
        break;
    }
  };
}

export abstract class FramePart {
  static __meta: { properties: IPropertyDef[] };

  constructor(bufferState: BufferState);
  constructor(framePart: FramePartAsObject)
  constructor(obj: BufferState | FramePartAsObject) {
    if (obj instanceof BufferState) {
      this.fromBuffer(obj);
    } else {
      this.getStatic().__meta.properties.forEach(def => {
        var value = obj[def.name];
        switch (def.type) {
          case BufferType.Function:
            value = (value !== undefined && value !== null) ? value : def.functions.default.apply(this);
            break;
          default:
            value = (value !== undefined && value !== null) ? value : def.default;
            break;
        }
        (<{ [key: string]: any }>this)[def.name] = value;
      });
    }
  }

  /**
   * get the buffer length of this frame part.
   * @return {number}
   */
  public getBufferLength(): number {
    return this.getStatic().__meta.properties.reduce((sum, def) => {
      switch (def.type) {
        case BufferType.Function:
          return sum + def.functions.length.apply(this);
        default:
          return sum + BufferTypeLength[def.type];
      }
    }, 0);
  }

  /**
   * get static constructor to access static properties on sub class.
   */
  public getStatic(): typeof FramePart {
    return <typeof FramePart>this.constructor;
  }

  private fromBuffer(bufferState: BufferState): void {
    this.getStatic().__meta.properties.forEach(def => {
      switch (def.type) {
        case BufferType.UInt8:
          (<{ [key: string]: any }>this)[def.name] = bufferState.buffer.readUInt8(bufferState.offset);
          bufferState.moveOffset(BufferTypeLength[def.type]);
          break;
        case BufferType.UInt16BE:
          (<{ [key: string]: any }>this)[def.name] = bufferState.buffer.readUInt16BE(bufferState.offset);
          bufferState.moveOffset(BufferTypeLength[def.type]);
          break;
        case BufferType.UInt32BE:
          (<{ [key: string]: any }>this)[def.name] = bufferState.buffer.readUInt32BE(bufferState.offset);
          bufferState.moveOffset(BufferTypeLength[def.type]);
          break;
        case BufferType.Function:
          (<{ [key: string]: any }>this)[def.name] = def.functions.reader.apply(this, [bufferState]);
          break;
      }
    });
  }

}
