import { IPHelper } from '../../../src/lib/utils';

type IPEntry = { str: string, num: number, valid: boolean, multicast: boolean };

describe('IPHelper', function() {

  var IPs: IPEntry[] = [
    { str: '0.0.0.0', num: 0, valid: true, multicast: false },
    { str: '127.0.0.1', num: 2130706433, valid: true, multicast: false },
    { str: '196.168.0.1', num: 3299344385, valid: true, multicast: false },
    { str: '255.255.255.255', num: 4294967295, valid: true, multicast: false },
    { str: '0', num: null, valid: false, multicast: false },
    { str: 'abc', num: null, valid: false, multicast: false },
    { str: null, num: 4294967296, valid: false, multicast: false },
    { str: null, num: -1, valid: false, multicast: false },
    { str: '223.0.0.0', num: 3741319168, valid: true, multicast: false },
    { str: '224.0.0.0', num: 3758096384, valid: true, multicast: true },
    { str: '239.255.255.255', num: 4026531839, valid: true, multicast: true },
    { str: '240.255.255.255', num: 4043309055, valid: true, multicast: false }
  ];

  it('isValid', function() {
    IPs.forEach(ip => {
      if (ip.num === null) {
        expect(IPHelper.isValid(ip.str)).to.be.equal(ip.valid, '"' + ip.str + '" is invalid');
      } else {
        expect(IPHelper.isValid(ip.str)).to.be.equal(ip.valid, '"' + ip.str + '" is valid');
      }
      if (ip.str === null) {
        expect(IPHelper.isValid(ip.num)).to.be.equal(ip.valid, ip.num + ' is invalid');
      } else {
        expect(IPHelper.isValid(ip.num)).to.be.equal(ip.valid, ip.num + ' is valid');
      }
    });
  });

  it('toNumber', function() {
    IPs.filter(ip => ip.str !== null).forEach(ip => {
      expect(IPHelper.toNumber(ip.str)).to.be.equal(ip.num, '"' + ip.str + '" returns ' + ip.num);
    });
  });

  it('toString', function() {
    IPs.filter(ip => ip.num !== null).forEach(ip => {
      expect(IPHelper.toString(ip.num)).to.be.equal(ip.str, '"' + ip.num + '" returns ' + ip.str);
    });
  });

  it('isMulticast', function() {
    IPs.forEach(ip => {
      if (ip.valid && ip.multicast) {
        expect(IPHelper.isMulticast(ip.num)).to.be.equal(true, ip.num + ' is multicast');
        expect(IPHelper.isMulticast(ip.str)).to.be.equal(true, '"' + ip.str + '" is multicast');
      } else {
        expect(IPHelper.isMulticast(ip.num)).to.be.equal(false, ip.num + ' is not multicast');
        expect(IPHelper.isMulticast(ip.str)).to.be.equal(false, '"' + ip.str + '" is not multicast');
      }
    });
  });

});
