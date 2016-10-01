export class GroupAddress {

  constructor(protected address: number) {
  }

  /**
   * get main group number.
   * last 5 bits (bit 11-15)
   * @return {number} [description]
   */
  getMainGroup(): number {
    return this.address >>> 11 & 0x1F;
  }

  /**
   * get middle group for 3 level address presentation.
   * 3 bits (bit 8-10)
   * @return {number} [description]
   */
  getMiddleGroup(): number {
    return this.address >>> 8 & 0x07;
  }

  /**
   * get sub group for 3 level presentation.
   * 8 bits (bit 0-7)
   * @return {number} [description]
   */
  getSubGroup8(): number {
    return this.address & 0xFF;
  }

  /**
   * get sub group for 2 level presentation.
   * 11 bits (bit 0-10)
   * @return {number} [description]
   */
  getSubGroup11(): number {
    return this.address & 0x07FF;
  }

  toString(presentation?: number): string {
    switch (presentation) {
      case 1:
        return this.address.toString();
      case 2:
        return this.getMainGroup() + '/' + this.getSubGroup11();
      default:
        return this.getMainGroup() + '/' + this.getMiddleGroup() + '/' + this.getSubGroup8();
    }
  }
}
