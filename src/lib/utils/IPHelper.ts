const inet = require('inet');

/**
 * IPv4 ip helper class.
 */
export class IPHelper {

  private static multicastRangeStart = inet.aton('224.0.0.0');
  private static multicastRangeEnd = inet.aton('239.255.255.255');

  public static isValid(address: string | number) {
    if (typeof address === 'string') {
      return IPHelper.toNumber(address) !== null;
    }
    if (typeof address === 'number') {
      return IPHelper.toString(address) !== null;
    }
    return false;
  }

  public static toNumber(address: string) {
    var num = inet.aton(address);
    var str = inet.ntoa(num);
    return (address === str) ? num : null;
  }

  public static toString(address: number) {
    var str = inet.ntoa(address);
    var num = inet.aton(str);
    return (address === num) ? str : null;
  }

  public static isMulticast(address: string | number) {
    if (typeof address === 'string') {
      address = IPHelper.toNumber(address);
    }
    return (address !== null && address >= IPHelper.multicastRangeStart && address <= IPHelper.multicastRangeEnd);
  }

}
