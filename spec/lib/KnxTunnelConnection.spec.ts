/* tslint:disable: no-unused-variable */

import { createTestObserver } from '../testhelper';
import { Observable } from 'rxjs';
import { KnxTunnelConnection, IKnxConnectionOptions, KnxConnection } from '../../src';
import { ConnectionState } from '../../src/lib/utils';

type Setting = {
  name: string,
  knxOptions: IKnxConnectionOptions
};

// TODO:
// - test when no connect response received within timeout and retries
// - test when no connection state  response received within timeout and retries
// - test when disconnect request is received
describe('KnxTunnelConnection', function() {

  var settingList: Setting[] = [
    {
      name: 'default',
      knxOptions: {}
    }
  ];

  settingList.filter(() => false).forEach(function(setting) {
    var knxConnection1: KnxTunnelConnection;
    var knxConnection2: KnxTunnelConnection;

    var controlSocketConnectSpy: sinon.SinonSpy;
    var controlSocketDisconnectSpy: sinon.SinonSpy;
    var dataSocketConnectSpy: sinon.SinonSpy;
    var dataSocketDisconnectSpy: sinon.SinonSpy;

    describe(setting.name + ' settings', function() {

      before(function() {
        knxConnection1 = new KnxTunnelConnection(setting.knxOptions);
        controlSocketConnectSpy = sinon.spy(knxConnection1['controlSocket'], 'connect');
        controlSocketDisconnectSpy = sinon.spy(knxConnection1['controlSocket'], 'disconnect');
        if (setting.knxOptions.twoChannel) {
          dataSocketConnectSpy = sinon.spy(knxConnection1['dataSocket'], 'connect');
          dataSocketDisconnectSpy = sinon.spy(knxConnection1['dataSocket'], 'disconnect');
        }
      });

      after(function() {
        controlSocketConnectSpy.restore();
        controlSocketDisconnectSpy.restore();
        if (setting.knxOptions.twoChannel) {
          dataSocketConnectSpy.restore();
          dataSocketDisconnectSpy.restore();
        }
      });

      it('should be created', function() {
        expect(knxConnection1).to.be.instanceOf(KnxConnection);
        expect(knxConnection1).to.be.instanceOf(KnxTunnelConnection);
        expect(knxConnection1.isConnected()).to.be.false;
        expect(knxConnection1.getState()).to.be.equal(ConnectionState.disconnected);
      });

      it('unbound socket does not know address and port', function() {
        /*assert.isNull(knxConnection1.getLocalAddress());
        assert.isNull(knxConnection1.getLocalPort());*/
      });

      it('connect returns observable', function() {
        var connectObservable;// = knxConnection1.connect();
        expect(connectObservable).to.be.instanceOf(Observable, 'returns Observable');
        expect(knxConnection1.isConnected()).to.be.equal(false, 'is disconnected');
        expect(knxConnection1.getState()).to.be.equal(ConnectionState.disconnected, 'is disconnected');
        expect(controlSocketConnectSpy).to.have.not.been.called;
        expect(dataSocketConnectSpy).to.have.not.been.called;
      });

      it('connects on subscribe', function(done) {
        done();
        /*var testObserver = createTestObserver<ConnectionState>(
          (next, spies) => { }, (error, spies) => { }, function(spies) {
            assert.isTrue(knxConnection1.isConnected(), 'is connected');
            assert.equal(knxConnection1.getState(), ConnectionState.connected, 'is connected');
            assert.doesNotThrow(() => sinon.assert.calledOnce(spies.nextSpy), 'emit only once');
            assert.doesNotThrow(() => sinon.assert.calledWith(spies.nextSpy, ConnectionState.connected), 'emits connected');
            assert.doesNotThrow(() => sinon.assert.calledOnce(spies.completeSpy), 'completes');
            // test if multiple subscriptions create unwanted side effect
            assert.doesNotThrow(() => sinon.assert.calledOnce(controlSocketConnectSpy), 'bind is called only once');
            assert.doesNotThrow(() => sinon.assert.notCalled(spies.errorSpy), 'throws no error');
            if (setting.multicastAddress === null) {
              assert.doesNotThrow(() => sinon.assert.notCalled(internalKnxConnection1AddMembershipSpy),
                'addMembership is not called on socket');
            } else {
              var memberships: number = (setting.multicastAddress instanceof Array) ? setting.multicastAddress.length : 1;
              assert.doesNotThrow(() => sinon.assert.callCount(internalKnxConnection1AddMembershipSpy, memberships),
                'addMembership is called ' + memberships + ' time(s) on socket');
            }
            done();
          });
        var connectObservable = knxConnection1.connect();
        connectObservable.subscribe(testObserver);
        connectObservable.subscribe(); // should not invoke second connect
        assert.isFalse(knxConnection1.isConnected(), 'is not connected');
        assert.equal(knxConnection1.getState(), ConnectionState.connecting, 'is connecting after subscribe');*/
      });

      it('bound socket does know address and port', function() {
        /*var localAddressExpected = setting.localAddress;
        var localPortExpected = setting.localPort;
        if (setting.localAddress === null) {
          // listen to all addresses
          localAddressExpected = '0.0.0.0';
        }
        assert.isNotNull(knxConnection1.getLocalAddress(), 'valid address');
        assert.equal(knxConnection1.getLocalAddress(), localAddressExpected, 'as defined');
        assert.isNotNull(knxConnection1.getLocalPort(), 'valid port');
        assert.isAbove(knxConnection1.getLocalPort(), 0, 'valid port');
        assert.isBelow(knxConnection1.getLocalPort(), 65536, 'valid port');
        if (localPortExpected !== null) {
          assert.equal(knxConnection1.getLocalPort(), setting.localPort);
        }*/
      });

      it('communication', function(done) {
        done();
        /*var knxConnection1DestAddress: string;
        var knxConnection2DestAddress: string;
        if (setting.multicastAddress !== null) {
          knxConnection2 = new TunnelConnection(setting.localAddress, setting.localPort, setting.multicastAddress);
          if (setting.multicastAddress instanceof Array) {
            knxConnection1DestAddress = setting.multicastAddress[0];
            knxConnection2DestAddress = setting.multicastAddress[0];
          } else {
            knxConnection1DestAddress = setting.multicastAddress;
            knxConnection2DestAddress = setting.multicastAddress;
          }
        } else {
          knxConnection2DestAddress = knxConnection1.getLocalAddress();
          if (knxConnection2DestAddress === '0.0.0.0') {
            knxConnection2DestAddress = '127.0.0.1'; // use loopback when no specific ip is defined
          }
          knxConnection2 = new TunnelConnection(setting.localAddress, setting.localPort);
          knxConnection1DestAddress = knxConnection2.getLocalAddress();
          if (knxConnection1DestAddress === '0.0.0.0') {
            knxConnection1DestAddress = '127.0.0.1'; // use loopback when no specific ip is defined
          }
        }
        knxConnection2.connect().subscribe(null, null, () => {
          knxConnection1.message$.first().subscribe(msg => {
            console.log('knxConnection1 received', msg.msg.toString());
            assert.equal(msg.msg.toString(), 'tic');
            knxConnection2.message$.first().subscribe(msg => {
              console.log('knxConnection2 received', msg.msg.toString());
              assert.equal(msg.msg.toString(), 'tac');
              knxConnection2.disconnect().subscribe(null, null, done);
            });
            knxConnection1.send(new Buffer('tac'), knxConnection1DestAddress, knxConnection2.getLocalPort()).subscribe();
          });
          knxConnection2.send(new Buffer('tic'), knxConnection2DestAddress, knxConnection1.getLocalPort()).subscribe();
        });*/
      });

      it('disconnect returns observable', function() {
        var disconnectObservable;// = knxConnection1.disconnect();
        expect(disconnectObservable).to.be.instanceOf(Observable, 'returns Observable');
        expect(knxConnection1.isConnected()).to.be.equal(true, 'is connected');
        expect(knxConnection1.getState()).to.be.equal(ConnectionState.connected, 'is connected');
        expect(controlSocketDisconnectSpy).to.have.not.been.called;
        expect(dataSocketDisconnectSpy).to.have.not.been.called;
      });

      it('disconnect on subscribe', function(done) {
        done();
        /*var testObserver = createTestObserver<ConnectionState>(
          (next, spies) => { }, (error, spies) => { }, function(spies) {
            assert.isFalse(knxConnection1.isConnected(), 'is disconnected');
            assert.equal(knxConnection1.getState(), ConnectionState.disconnected, 'is disconnected');
            assert.doesNotThrow(() => sinon.assert.calledOnce(spies.nextSpy), 'emit only once');
            assert.doesNotThrow(() => sinon.assert.calledWith(spies.nextSpy,
              ConnectionState.disconnected), 'emits disconnected');
            assert.doesNotThrow(() => sinon.assert.calledOnce(spies.completeSpy), 'completes');
            // test if multiple subscriptions create unwanted side effect
            assert.doesNotThrow(() => sinon.assert.calledOnce(internalKnxConnection1CloseSpy), 'close is called only once');
            assert.doesNotThrow(() => sinon.assert.notCalled(spies.errorSpy), 'throws no error');
            if (setting.multicastAddress === null) {
              assert.doesNotThrow(() => sinon.assert.notCalled(internalKnxConnection1DropMembershipSpy),
                'dropMembership is not called on socket');
            } else {
              var memberships: number = (setting.multicastAddress instanceof Array) ? setting.multicastAddress.length : 1;
              assert.doesNotThrow(() => sinon.assert.callCount(internalKnxConnection1AddMembershipSpy, memberships),
                'dropMembership is called ' + memberships + ' time(s) on socket');
            }
            done();
          });
        var disconnectObservable = knxConnection1.disconnect();
        disconnectObservable.subscribe(testObserver);
        disconnectObservable.subscribe(); // should not invoke second disconnect
        assert.isFalse(knxConnection1.isConnected(), 'is not connected');
        assert.equal(knxConnection1.getState(), ConnectionState.disconnecting, 'is disconnecting after subscribe');*/
      });

    });
  });
});
