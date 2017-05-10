import 'reflect-metadata';
import { BufferType, BufferState, BufferTypeLength } from './BufferUtils';
import { ServiceType, HEADER_SIZE_10 } from '../KnxConstants';
import { FramePart } from './FramePart';
import { Header } from './FrameParts';

export interface IFramePartDef {
  name: string;
  type: typeof FramePart;
  argumentDefinition: { [key: string]: number };
}

/**
 * property decorator for Frame classes.
 * used to register a class for a service type.
 * @return {ClassDecorator}
 */
export function FrameServiceType(serviceType: ServiceType): ClassDecorator {
  return (target: Class<Frame>) => {
    if (!Frame.hasOwnProperty('__meta')) {
      Object.defineProperty(Frame, '__meta', { value: {}, enumerable: true });
    }
    if (!Frame.__meta.hasOwnProperty('serviceTypeClass')) {
      Object.defineProperty(Frame.__meta, 'serviceTypeClass',
        { value: new Map<ServiceType, Class<Frame>>(), enumerable: true });
    }
    if (!Frame.__meta.hasOwnProperty('classServiceType')) {
      Object.defineProperty(Frame.__meta, 'classServiceType',
        { value: new Map<ServiceType, Class<Frame>>(), enumerable: true });
    }
    Frame.__meta.serviceTypeClass.set(serviceType, target);
    Frame.__meta.classServiceType.set(target, serviceType);
  };
}

/**
 * property decorator for FramePart's.
 * used to garantee the order of the frame parts inside a frame
 * and to define the argument positions of the FramePart arguments based on the arguments of the frame.
 * @return {PropertyDecorator}
 */
export function FramePartDef(argumentDefinition?: { [key: string]: number }): PropertyDecorator {
  return (target: typeof Frame, key: string) => {
    var staticTarget = <typeof Frame>target.constructor;
    var framePartType = Reflect.getMetadata('design:type', target, key);
    if (!staticTarget.hasOwnProperty('__meta')) {
      Object.defineProperty(staticTarget, '__meta', { value: {}, enumerable: true });
    }
    if (!staticTarget.__meta.hasOwnProperty('properties')) {
      var parentMeta = Object.getPrototypeOf(staticTarget).__meta;
      var parentProperties = [];
      if (parentMeta && parentMeta.hasOwnProperty('properties')) {
        parentProperties = parentMeta.properties;
      }
      Object.defineProperty(staticTarget.__meta, 'properties',
        { value: Object.assign([], parentProperties), enumerable: true });
    }
    staticTarget.__meta.properties.push({ name: key, type: framePartType, argumentDefinition: argumentDefinition });
  };
}

export abstract class Frame {
  static __meta: {
    serviceTypeClass: Map<ServiceType, Class<Frame>>,
    classServiceType: Map<Class<Frame>, ServiceType>,
    properties: IFramePartDef[]
  };
  @FramePartDef()
  header: Header;

  /**
   * create a frame from buffer.
   * returns the specific frame class instance.
   * @param  {Buffer} buffer the buffer to parse
   * @return {Frame}         the resulting frame
   */
  static fromBuffer(buffer: Buffer): Frame {
    var bufferState = new BufferState(buffer);
    var header = new Header(bufferState);
    if (!Frame.__meta.serviceTypeClass.has(header.serviceType)) {
      throw new Error('unimplemented service type: ' + ServiceType[header.serviceType] + ' (' + header.serviceType + ')');
    }
    var frameClazz = Frame.__meta.serviceTypeClass.get(header.serviceType);
    var frame = new frameClazz(header, bufferState);
    return frame;
  }

  constructor(header: Header, bufferState: BufferState)
  constructor(...args: any[]);
  constructor(...args: any[]) {
    if (args[0] instanceof Header && args[1] instanceof BufferState) {
      this.header = args[0];
      // build each framepart
      this.getStatic().__meta.properties
        .filter(def => def.type !== Header)
        .forEach(def => {
          // create FramePart instance
          (<{ [key: string]: any }>this)[def.name] = new (<any>def.type)(args[1]);
        });
      console.log('frame from buffer', this);
    } else {
      // create header based on service type of this constructor (subclass)
      var serviceType = Frame.__meta.classServiceType.get(<Class<Frame>>this.constructor);
      this.header = new Header({ serviceType: serviceType });
      // build each frame part
      this.getStatic().__meta.properties
        .filter(def => def.type !== Header) // except header, because we need to set the totalLength at the end when all frame part's are created
        .forEach(def => {
          // build arguments object for the framepart constructor
          var argsObj: { [key: string]: any } = {};
          if (def.argumentDefinition !== undefined && def.argumentDefinition !== null) {
            Object.getOwnPropertyNames(def.argumentDefinition).forEach(argumentName => {
              argsObj[argumentName] = args[def.argumentDefinition[argumentName]];
            });
          }
          (<{ [key: string]: any }>this)[def.name] = new (<any>def.type)(argsObj);
        });
      this.header.totalLength = this.getBufferLength(); // TODO: we should provide this information already to the Header constructor
      console.log('frame param', this);
    }
  }

  /**
   * returns the frame as Buffer.
   * @return {Buffer}
   */
  public toBuffer(): Buffer {
    var bufferState = new BufferState(Buffer.alloc(this.header.totalLength));
    this.getStatic().__meta.properties
      .map(def => <FramePart>(<{ [key: string]: any }>this)[def.name])
      .forEach(framePart => {
        this.writeFramePartBuffer(framePart, bufferState);
      });
    return bufferState.buffer;
  }

  /**
   * write the frame part to the buffer.
   * @param  {FramePart}   framePart   the frame part
   * @param  {BufferState} bufferState the buffer state
   */
  private writeFramePartBuffer(framePart: FramePart, bufferState: BufferState): void {
    framePart.getStatic().__meta.properties.forEach(def => {
      console.log('writing', def);
      var value = (<{ [key: string]: any }>framePart)[def.name];
      value = (value !== undefined && value !== null) ? value : def.default;
      if (value === undefined || value === null) {
        throw new Error('value for "' + def.name + '" in "' + framePart.constructor.name + '" required');
      }
      switch (def.type) {
        case BufferType.UInt8:
          bufferState.buffer.writeUInt8(value, bufferState.offset);
          bufferState.moveOffset(BufferTypeLength[def.type]);
          break;
        case BufferType.UInt16BE:
          bufferState.buffer.writeUInt16BE(value, bufferState.offset);
          bufferState.moveOffset(BufferTypeLength[def.type]);
          break;
        case BufferType.UInt32BE:
          bufferState.buffer.writeUInt32BE(value, bufferState.offset);
          bufferState.moveOffset(BufferTypeLength[def.type]);
          break;
      }
    });
  }

  /**
   * get the buffer length of this frame.
   * @return {number}
   */
  private getBufferLength(): number {
    return this.getStatic().__meta.properties
      .map(def => <FramePart>(<{ [key: string]: any }>this)[def.name])
      .map(framePart => {
        return framePart;
      })
      .reduce((sum, framePart) => sum + framePart.getBufferLength(), 0);
  }

  /**
   * get static constructor to access static properties on sub class.
   */
  private getStatic(): typeof Frame {
    return <typeof Frame>this.constructor;
  }

  /**
   * get static constructor to access static properties on sub class.
   */
  private getStaticFramePart(framePart: FramePart): typeof FramePart {
    return <typeof FramePart>framePart.constructor;
  }

}
