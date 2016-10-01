import { Frame, SearchRequest } from '../lib/utils/frame';

//var createdFrame = new SearchRequest(IPHelper.toNumber('10.2.0.100'), 3671);
var buffer = new Buffer('06100201000e08010a0200640e57', 'hex');

var frame = Frame.createFromBuffer(buffer);
console.log((<SearchRequest>frame));

if (frame instanceof SearchRequest) {
  delete frame.header.totalLength; // test syntetic frame
  var newBuffer = frame.toBuffer();
  console.log(newBuffer);
}
