
declare module BinaryParser {
  export class Parser {

    bit1(propertyName: string): Parser;
    bit2(propertyName: string): Parser;
    bit3(propertyName: string): Parser;
    bit4(propertyName: string): Parser;
    bit6(propertyName: string): Parser;
    bit10(propertyName: string): Parser;

    parse(buf: Buffer): {};
  }
}

declare module 'binary-parser' {
  export = BinaryParser;
}

declare module 'binary-parser' {

}
