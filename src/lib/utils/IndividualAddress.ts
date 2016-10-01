export class IndividualAddress {

  constructor(protected address: number) {
  }

  /**
   * get area address number.
   * last 4 bits (bit 12-15)
   * @return {number} [description]
   */
  getArea(): number {
    return this.address >>> 12;
  }

  /**
   * get line address.
   * 4 bits (bit 8-11)
   * @return {number} [description]
   */
  getLine(): number {
    return this.address >>> 8 & 0x0F;
  }

  /**
   * get device address.
   * 8 bits (bit 0-7)
   * @return {number} [description]
   */
  getDevice(): number {
    return this.address & 0xFF;
  }

  toString(): string {
    return this.getArea() + '.' + this.getLine() + '.' + this.getDevice();
  }
}
