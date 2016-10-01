import { SpyObserver } from '../../testhelper';
import { Observable, Subscription } from 'rxjs';
import { ConnectionState } from '../../../src/lib/utils';
import { UdpSocket, SocketMessage, UdpSocketConfig } from '../../../src/lib/utils/UdpSocket';

interface UdpSocketTestConfig extends UdpSocketConfig {
  name: string;
}

// TODO:
// - test returned observable of send()
// - test error on send
//
describe('UdpSocket', function() {

  it('initialize with multicast address(es)', function() {
    expect(function() {
      new UdpSocket({ localAddress: null, localPort: null, multicastAddress: '127.0.0.1' });
    }).to.throw(Error, 'invalid multicast address: 127.0.0.1');
    expect(function() {
      new UdpSocket({ localAddress: null, localPort: null, multicastAddress: ['224.0.0.0', '127.0.0.1'] });
    }).to.throw(Error, 'invalid multicast address: 127.0.0.1');
    expect(function() {
      new UdpSocket({ localAddress: null, localPort: null, multicastAddress: '224.0.0.0' });
    }).to.not.throw('is valid multicast address');
    expect(function() {
      new UdpSocket({ localAddress: null, localPort: null, multicastAddress: ['224.0.0.0', '224.0.0.1'] });
    }).to.not.throw('are valid multicast addresses');
  });

  var settingList: UdpSocketTestConfig[] = [
    {
      name: 'default',
      localAddress: null,
      localPort: null,
      multicastAddress: null
    },
    {
      name: 'loopback',
      localAddress: '127.0.0.1',
      localPort: null,
      multicastAddress: null
    },
    {
      name: 'multicast - single network',
      localAddress: '0.0.0.0',
      localPort: null,
      multicastAddress: '224.0.0.0'
    },
    {
      name: 'multicast  - multiple networks',
      localAddress: '0.0.0.0',
      localPort: null,
      multicastAddress: ['224.0.0.1', '224.0.0.114']
    }
  ];

  settingList.forEach(function(setting) {
    var socket1: UdpSocket;
    var socket1Subscription: Subscription;
    var socket1Subscription2: Subscription;
    var socket1StateObserver: SpyObserver<ConnectionState>;
    var socket1Observer: SpyObserver<SocketMessage>;

    var socketConnectSpy: sinon.SinonSpy;
    var socketDisconnectSpy: sinon.SinonSpy;
    var socketAddMembershipSpy: sinon.SinonSpy;
    var socketDropMembershipSpy: sinon.SinonSpy;

    describe(setting.name, function() {

      it('should be created', function() {
        socket1 = new UdpSocket(setting);
        expect(socket1).to.be.instanceOf(UdpSocket);
        expect(socket1).to.be.instanceOf(Observable);
        expect(socket1.getState()).to.be.equal(ConnectionState.disconnected);

        socketConnectSpy = sinon.spy(socket1, 'connecting');
        socketDisconnectSpy = sinon.spy(socket1, 'disconnecting');
        socketAddMembershipSpy = sinon.spy(socket1, 'addMulticastMembership');
        socketDropMembershipSpy = sinon.spy(socket1, 'dropMulticastMembership');
      });

      it('unbound socket does not know address and port', function() {
        expect(socket1.getAddress()).to.be.null;
        expect(socket1.getPort()).to.be.null;
      });

      it('connecting', function() {
        socket1StateObserver = new SpyObserver();
        socket1.getState$().subscribe(socket1StateObserver);

        expect(socket1.getState()).to.be.equal(ConnectionState.disconnected);
        expect(socket1StateObserver.nextSpy).have.not.been.called;
        expect(socket1StateObserver.errorSpy).have.not.been.called;
        expect(socket1StateObserver.completeSpy).have.not.been.called;

        socket1Observer = new SpyObserver();
        socket1Subscription = socket1.subscribe(socket1Observer);
        expect(socket1Observer.nextSpy).have.not.been.called;
        expect(socket1Observer.errorSpy).have.not.been.called;
        expect(socket1Observer.completeSpy).have.not.been.called;

        expect(socket1.getState()).to.be.equal(ConnectionState.connecting);
        expect(socket1StateObserver.nextSpy).have.been.calledOnce;
        expect(socket1StateObserver.nextSpy).have.been.calledWith(ConnectionState.connecting);
        expect(socket1StateObserver.errorSpy).have.not.been.called;
        expect(socket1StateObserver.completeSpy).have.not.been.called;

        expect(socketConnectSpy).have.been.calledOnce;
        expect(socketDisconnectSpy).have.not.been.called;
        expect(socketAddMembershipSpy).have.not.been.called;
        expect(socketDropMembershipSpy).have.not.been.called;

        // subscribe a second time to find unwanted side effects
        socket1Subscription2 = socket1.subscribe(new SpyObserver());
      });

      // wait a tick to let socket establishing the connection (implicitly done by new test block, otherwise we must make use of setTimeout)
      it('connected', function() {
        expect(socket1Observer.nextSpy).have.not.been.called;
        expect(socket1Observer.errorSpy).have.not.been.called;
        expect(socket1Observer.completeSpy).have.not.been.called;

        expect(socket1.getState()).to.be.equal(ConnectionState.connected);
        expect(socket1StateObserver.nextSpy).have.been.calledTwice;
        expect(socket1StateObserver.nextSpy).have.been.calledWith(ConnectionState.connected);
        expect(socket1StateObserver.errorSpy).have.not.been.called;
        expect(socket1StateObserver.completeSpy).have.not.been.called;

        expect(socketConnectSpy).have.been.calledOnce;
        expect(socketDisconnectSpy).have.not.been.called;
        if (setting.multicastAddress === null) {
          expect(socketAddMembershipSpy).have.not.been.called;
        } else {
          var memberships: number = (setting.multicastAddress instanceof Array) ? setting.multicastAddress.length : 1;
          expect(socketAddMembershipSpy).have.been.callCount(memberships);
        }
        expect(socketDropMembershipSpy).have.not.been.called;

        var localAddressExpected = setting.localAddress;
        var localPortExpected = setting.localPort;
        if (setting.localAddress === null) {
          // listen to all addresses
          localAddressExpected = '0.0.0.0';
        }
        expect(socket1.getAddress()).to.be.not.null;
        expect(socket1.getAddress()).to.be.equal(localAddressExpected, 'as defined');
        expect(socket1.getPort()).to.be.not.null;
        expect(socket1.getPort()).to.be.within(1, 65535, 'valid port');
        if (localPortExpected !== null) {
          expect(socket1.getPort()).to.be.equal(setting.localPort, 'as defined');
        }
      });

      it('communication1', function(done) {
        var socket2: UdpSocket;
        var socket1DestAddress: string;
        var socket2DestAddress: string;
        if (setting.multicastAddress !== null) {
          socket2 = new UdpSocket(setting);
          if (setting.multicastAddress instanceof Array) {
            socket1DestAddress = setting.multicastAddress[0];
            socket2DestAddress = setting.multicastAddress[0];
          } else {
            socket1DestAddress = setting.multicastAddress;
            socket2DestAddress = setting.multicastAddress;
          }
        } else {
          socket2DestAddress = socket1.getAddress();
          if (socket2DestAddress === '0.0.0.0') {
            socket2DestAddress = '127.0.0.1'; // use loopback when no specific ip is defined
          }
          socket2 = new UdpSocket(setting);
          socket1DestAddress = socket2.getAddress();
          if (socket1DestAddress === '0.0.0.0') {
            socket1DestAddress = '127.0.0.1'; // use loopback when no specific ip is defined
          }
        }

        var socket2Observer = new SpyObserver<SocketMessage>(msg => {
          expect(msg.msg.toString()).to.be.equal('tic');
          socket2.send(new Buffer('tac'), socket1DestAddress, socket1.getPort());
        });
        var socket2Subscription = socket2.subscribe(socket2Observer);

        socket1Observer.nextFnc = msg => {
          expect(msg.msg.toString()).to.be.equal('tac');
          expect(socket1Observer.nextSpy).have.been.calledOnce;
          expect(socket1Observer.errorSpy).have.not.been.called;
          expect(socket1Observer.completeSpy).have.not.been.called;
          socket1Subscription2.unsubscribe();
          socket2Subscription.unsubscribe();
          done();
        };

        // wait a tick to let socket establishing the connection
        setTimeout(() => {
          socket1.send(new Buffer('tic'), socket2DestAddress, socket2.getPort());
        });
      });

      it('disconnecting', function() {
        // be sure unsubscription of socket1Subscription2 didn't change anything
        expect(socket1Observer.nextSpy).have.been.calledOnce;
        expect(socket1Observer.errorSpy).have.not.been.called;
        expect(socket1Observer.completeSpy).have.not.been.called;

        socket1Subscription.unsubscribe();
        expect(socket1Observer.nextSpy).have.been.calledOnce;
        expect(socket1Observer.errorSpy).have.not.been.called;
        expect(socket1Observer.completeSpy).have.not.been.called;

        expect(socket1.getState()).to.be.equal(ConnectionState.disconnecting);
        expect(socket1StateObserver.nextSpy).have.been.calledThrice;
        expect(socket1StateObserver.nextSpy).have.been.calledWith(ConnectionState.disconnecting);
        expect(socket1StateObserver.errorSpy).have.not.been.called;
        expect(socket1StateObserver.completeSpy).have.not.been.called;

        expect(socketConnectSpy).have.been.calledOnce;
        expect(socketDisconnectSpy).have.been.calledOnce;
        if (setting.multicastAddress === null) {
          expect(socketAddMembershipSpy).have.not.been.called;
        } else {
          let memberships: number = (setting.multicastAddress instanceof Array) ? setting.multicastAddress.length : 1;
          expect(socketAddMembershipSpy).have.been.callCount(memberships);
        }
        if (setting.multicastAddress === null) {
          expect(socketDropMembershipSpy).have.not.been.called;
        } else {
          let memberships: number = (setting.multicastAddress instanceof Array) ? setting.multicastAddress.length : 1;
          expect(socketDropMembershipSpy).have.been.callCount(memberships);
        }
      });

      // wait a tick to let socket establishing the connection (implicitly done by new test block, otherwise we must make use of setTimeout)
      it('disconnected', function() {
        expect(socket1Observer.nextSpy).have.been.calledOnce;
        expect(socket1Observer.errorSpy).have.not.been.called;
        //expect(socket1Observer.completeSpy).have.been.calledOnce; // cannot be tested because of unsubscribe required to disconnect

        expect(socket1.getState()).to.be.equal(ConnectionState.disconnected);
        /* cannot be tested because of unsubscribe required to disconnect
        expect(socket1StateObserver.nextSpy).have.been.callCount(4);
        expect(socket1StateObserver.nextSpy).have.been.calledWith(ConnectionState.disconnected); */
        expect(socket1StateObserver.errorSpy).have.not.been.called;
        expect(socket1StateObserver.completeSpy).have.been.calledOnce;
      });

    });
  });
});
