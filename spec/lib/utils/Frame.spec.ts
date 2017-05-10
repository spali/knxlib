import {
  ServiceType,
  IPHelper,
  HEADER_SIZE_10,
  KNXNETIP_VERSION_10,
  HostProtocolCodes,
  ErrorCodes,
  ConnectionType,
  LinkLayer,
  DataLinkLayer,
  FrameType,
  RepeatFlag,
  Broadcast,
  Priority,
  AckRequest,
  ConfirmFlag,
  DestAddressType,
  ExtendedFrameFormat
} from '../../../src';
import {
  Frame,
  FramePart,
  Header,
  HPAI,
  ConnectState,
  ConnectRequestInformation,
  ConnectResponseDataBlock,
  TunnelState,
  CEMI,
  SearchRequest,
  SearchResponse,
  ConnectRequest,
  ConnectResponse,
  ConnectionStateRequest,
  ConnectionStateResponse,
  TunnelingRequest
} from '../../../src/lib/utils/frame'; // TODO: move to the above import, once we cleaned up the KnxProtocol class

interface ITestFramePart {
  __testClass: Class<FramePart>;
  __testContent: { [key: string]: any; };
}
interface ITestFrame {
  __testBuffer: Buffer;
  __testClass: Class<Frame>;
  __testParameter: any[];
  __testContent: { [key: string]: ITestFramePart; };
}

describe('Frame', function() {
  var TESTDATA: ITestFrame[][] = [];
  Object.keys(ServiceType)
    .map(value => <ServiceType>parseInt(value, 10)).filter(value => !isNaN(value)) // only numbers of the enum
    .forEach(serviceType => TESTDATA[serviceType] = []);
  TESTDATA[ServiceType.SEARCH_REQUEST].push({
    __testBuffer: new Buffer('06100201000e08010a0200640e57', 'hex'),
    __testClass: SearchRequest,
    __testParameter: [IPHelper.toNumber('10.2.0.100'), 3671],
    __testContent: {
      header: {
        __testClass: Header,
        __testContent: {
          length: HEADER_SIZE_10,
          protocolVersion: KNXNETIP_VERSION_10,
          serviceType: ServiceType.SEARCH_REQUEST,
          totalLength: 14
        }
      },
      discoveryEndpoint: {
        __testClass: HPAI,
        __testContent: {
          length: 8,
          protocolType: HostProtocolCodes.IPV4_UDP,
          address: IPHelper.toNumber('10.2.0.100'),
          port: 3671
        }
      }
    }
  });
  TESTDATA[ServiceType.SEARCH_RESPONSE].push({
    /*__testBuffer: new Buffer('06100202004e08010a0200ef0e57360102001100000000c9068f6807e000170c00246dff086d4b'
      + '4e585f50533634302d49500000000000000000000000000000000000000a020201030104010501'
      , 'hex'),*/
    __testBuffer: new Buffer('06100202000e08010a0200ef0e57', 'hex'),
    __testClass: SearchResponse,
    __testParameter: [IPHelper.toNumber('10.2.0.239'), 3671],
    __testContent: {
      header: {
        __testClass: Header,
        __testContent: {
          length: HEADER_SIZE_10,
          protocolVersion: KNXNETIP_VERSION_10,
          serviceType: ServiceType.SEARCH_RESPONSE,
          //totalLength: 78
          totalLength: 14
        }
      },
      controlEndpoint: {
        __testClass: HPAI,
        __testContent: {
          length: 8,
          protocolType: HostProtocolCodes.IPV4_UDP,
          address: IPHelper.toNumber('10.2.0.239'),
          port: 3671
        }
      }
    }
    // TODO: DIB: DEVICE_INFO
    // TODO: DIB: SUPP_SVC_FAMILIES
  });
  TESTDATA[ServiceType.CONNECT_REQUEST].push({
    __testBuffer: new Buffer('06100205001a08010a020064f1da08010a020064f1da04040200', 'hex'),
    __testClass: ConnectRequest,
    __testParameter: [
      IPHelper.toNumber('10.2.0.100'), 61914,
      IPHelper.toNumber('10.2.0.100'), 61914,
      ConnectionType.TUNNEL_CONNECTION, LinkLayer.LINK_LAYER
    ],
    __testContent: {
      header: {
        __testClass: Header,
        __testContent: {
          length: HEADER_SIZE_10,
          protocolVersion: KNXNETIP_VERSION_10,
          serviceType: ServiceType.CONNECT_REQUEST,
          totalLength: 26
        }
      },
      discoveryEndpoint: {
        __testClass: HPAI,
        __testContent: {
          length: 8,
          protocolType: HostProtocolCodes.IPV4_UDP,
          address: IPHelper.toNumber('10.2.0.100'),
          port: 61914
        }
      },
      dataEndpoint: {
        __testClass: HPAI,
        __testContent: {
          length: 8,
          protocolType: HostProtocolCodes.IPV4_UDP,
          address: IPHelper.toNumber('10.2.0.100'),
          port: 61914
        }
      },
      connectionRequestInformation: {
        __testClass: ConnectRequestInformation,
        __testContent: {
          length: 4,
          connectionType: ConnectionType.TUNNEL_CONNECTION,
          knxLinkLayer: LinkLayer.LINK_LAYER,
          unused: 0x00
        }
      }
    }
  });
  TESTDATA[ServiceType.CONNECT_RESPONSE].push({
    __testBuffer: new Buffer('061002060014270008010a0200ef0e57040411fc', 'hex'),
    __testClass: ConnectResponse,
    __testParameter: [
      39, ErrorCodes.E_NO_ERROR,
      IPHelper.toNumber('10.2.0.239'), 3671,
      ConnectionType.TUNNEL_CONNECTION, 4604 /* 1.1.252 */
    ],
    __testContent: {
      header: {
        __testClass: Header,
        __testContent: {
          length: HEADER_SIZE_10,
          protocolVersion: KNXNETIP_VERSION_10,
          serviceType: ServiceType.CONNECT_RESPONSE,
          totalLength: 20
        }
      },
      connectionState: {
        __testClass: ConnectState,
        __testContent: {
          channelId: 39,
          status: ErrorCodes.E_NO_ERROR
        }
      },
      dataEndpoint: {
        __testClass: HPAI,
        __testContent: {
          length: 8,
          protocolType: HostProtocolCodes.IPV4_UDP,
          address: IPHelper.toNumber('10.2.0.239'),
          port: 3671
        }
      },
      connectResponseDataBlock: {
        __testClass: ConnectResponseDataBlock,
        __testContent: {
          length: 4,
          connectionType: ConnectionType.TUNNEL_CONNECTION,
          knxAddress: 4604/* 1.1.252 */
        }
      }
    }
  });
  TESTDATA[ServiceType.CONNECTIONSTATE_REQUEST].push({
    __testBuffer: new Buffer('0610020700100a0008010a020064e70d', 'hex'),
    __testClass: ConnectionStateRequest,
    __testParameter: [10, IPHelper.toNumber('10.2.0.100'), 59149],
    __testContent: {
      header: {
        __testClass: Header,
        __testContent: {
          length: HEADER_SIZE_10,
          protocolVersion: KNXNETIP_VERSION_10,
          serviceType: ServiceType.CONNECTIONSTATE_REQUEST,
          totalLength: 16
        }
      },
      connectionState: {
        __testClass: ConnectState,
        __testContent: {
          channelId: 10,
          status: ErrorCodes.E_NO_ERROR
        }
      },
      controlEndpoint: {
        __testClass: HPAI,
        __testContent: {
          length: 8,
          protocolType: HostProtocolCodes.IPV4_UDP,
          address: IPHelper.toNumber('10.2.0.100'),
          port: 59149
        }
      }
    }
  });
  TESTDATA[ServiceType.CONNECTIONSTATE_RESPONSE].push({
    __testBuffer: new Buffer('0610020800080a21', 'hex'),
    __testClass: ConnectionStateResponse,
    __testParameter: [10, ErrorCodes.E_CONNECTION_ID],
    __testContent: {
      header: {
        __testClass: Header,
        __testContent: {
          length: HEADER_SIZE_10,
          protocolVersion: KNXNETIP_VERSION_10,
          serviceType: ServiceType.CONNECTIONSTATE_RESPONSE,
          totalLength: 8
        }
      },
      connectionState: {
        __testClass: ConnectState,
        __testContent: {
          channelId: 10,
          status: ErrorCodes.E_CONNECTION_ID
        }
      }
    }
  });
  TESTDATA[ServiceType.TUNNELING_REQUEST].push({
    __testBuffer: new Buffer('061004200017042700002900bce011a42b0a0300800c38', 'hex'),
    __testClass: TunnelingRequest,
    __testParameter: [39, 0, DataLinkLayer.L_Data_ind],
    __testContent: {
      header: {
        __testClass: Header,
        __testContent: {
          length: HEADER_SIZE_10,
          protocolVersion: KNXNETIP_VERSION_10,
          serviceType: ServiceType.TUNNELING_REQUEST,
          totalLength: 23
        }
      },
      tunnelState: {
        __testClass: TunnelState,
        __testContent: {
          length: 4,
          channelId: 39,
          sequence: 0,
          status: ErrorCodes.E_NO_ERROR
        }
      },
      cemi: {
        __testClass: CEMI,
        __testContent: {
          messageCode: DataLinkLayer.L_Data_ind,
          additionalInformationLength: 0,
          additionalInformation: Buffer.alloc(0),
          __control: new Buffer('bc', 'hex'),
          frameType: FrameType.STANDARD,
          repeatFlag: RepeatFlag.NO_REPEAT,
          broadcast: Broadcast.BROADCAST,
          priority: Priority.LOW,
          ackRequest: AckRequest.NO_ACK_REQUESTED,
          confirmFlag: ConfirmFlag.E_NO_ERROR,
          destAddressType: DestAddressType.GROUP_ADDRESS,
          hopCount: 6,
          extendedFrameFormat: ExtendedFrameFormat.STANDARD_FRAME,
          sourceAddress: 4516, // 1.1.164
          destinationAddress: 11018, // 5/3/10
          length: 3,
          tpci: 0x0,
          apci: 0x0002,
          apci_extended: 0, // TODO
          data: new Buffer('0c38', 'hex'),
        }
      }
    }
  });

  function testFrameClass(frame: Frame, serviceType: ServiceType, frameTestData: ITestFrame) {
    describe('Frame: ' + frame.constructor.name, function() {
      it('type', function() {
        expect(frame).to.be.instanceOf(frameTestData.__testClass);
      });
      Object.getOwnPropertyNames(frameTestData.__testContent).forEach(function(framePartName) {
        describe('FramePart: ' + framePartName, function() {
          it('exists', function() {
            expect(framePartName in frame, 'FramePart "' + framePartName + '" exists on frame of type ' + ServiceType[serviceType]).to.be.true;
          });
          var framePart = (<{ [key: string]: FramePart }><any>frame)[framePartName];
          var referenceFramePart = frameTestData.__testContent[framePartName];
          it('type', function() {
            expect(framePart,
              'FramePart "' + framePartName + '" is a FramePart type on frame of type ' + ServiceType[serviceType])
              .to.be.instanceOf(FramePart);
            expect(framePart,
              'FramePart "' + framePartName + '" is a specific FramePart type on frame of type ' + ServiceType[serviceType])
              .to.be.instanceOf(referenceFramePart.__testClass);
          });
          Object.getOwnPropertyNames(referenceFramePart.__testContent).forEach(function(propertyName) {
            describe('property: ' + propertyName, function() {
              it('exists', function() {
                expect(propertyName in framePart, 'property "' + propertyName + '" exists on frame part' + framePart).to.be.true;
              });
              it('content', function() {
                expect((<any>framePart)[propertyName]).to.be.equal(referenceFramePart.__testContent[propertyName]);
              });
            });
          });

        });
      });
    });
  }

  Object.keys(ServiceType)
    .map(value => <ServiceType>parseInt(value, 10)).filter(value => !isNaN(value)) // only numbers of the enum
    .filter(serviceType => serviceType === ServiceType.TUNNELING_REQUEST) // TODO: TEMP
    .forEach(function(serviceType) {
      TESTDATA[serviceType].forEach(function(frameTestData) {
        if (TESTDATA[serviceType]) {
          describe('build frame from parameters - ' + ServiceType[serviceType], function() {
            var frameFromParameters = new frameTestData.__testClass(...frameTestData.__testParameter);
            testFrameClass(frameFromParameters, serviceType, frameTestData);
          });
          describe('create Frame from buffer - ' + ServiceType[serviceType], function() {
            var frameFromBuffer = Frame.fromBuffer(frameTestData.__testBuffer);
            testFrameClass(frameFromBuffer, serviceType, frameTestData);
          });
          describe('buffer from syntetic frame - ' + ServiceType[serviceType], function() {
            var frameFromParameters = new frameTestData.__testClass(...frameTestData.__testParameter);
            var bufferFromSynteticFrame = frameFromParameters.toBuffer();
            it('create', function() {
              expect(bufferFromSynteticFrame).to.be.instanceOf(Buffer);
              expect(bufferFromSynteticFrame.toString('hex')).to.be.equal(frameTestData.__testBuffer.toString('hex'));
            });
          });
          describe('create buffer from frame - ' + ServiceType[serviceType], function() {
            var bufferFromFrame = Frame.fromBuffer(frameTestData.__testBuffer).toBuffer();
            it('create', function() {
              expect(bufferFromFrame).to.be.instanceOf(Buffer);
              expect(bufferFromFrame.toString('hex')).to.be.equal(frameTestData.__testBuffer.toString('hex'));
            });
          });
        } else {
          it('Frame - ' + ServiceType[serviceType]); // pending frame test for missing test data
        }
      });
    });
});
