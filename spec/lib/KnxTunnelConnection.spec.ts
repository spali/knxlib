/* tslint:disable: no-unused-variable */

import { createTestObserver } from '../testhelper';
import { Observable } from 'rxjs';
import { KnxTunnelConnection, IKnxConnectionOptions, KnxConnection } from '../../src';
import { ConnectionState } from '../../src/lib/utils';

type Setting = {
  name: string,
  knxOptions: IKnxConnectionOptions
};

describe('KnxTunnelConnection', function() {

  var settingList: Setting[] = [
    /*{
      name: 'default',
      knxOptions: {}
    }*/
  ];

  settingList.forEach(function(setting) {
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

      it('connect returns observable', function() {
        var connectObservable;// = knxConnection1.connect();
        expect(connectObservable).to.be.instanceOf(Observable, 'returns Observable');
        expect(knxConnection1.isConnected()).to.be.equal(false, 'is disconnected');
        expect(knxConnection1.getState()).to.be.equal(ConnectionState.disconnected, 'is disconnected');
        expect(controlSocketConnectSpy).to.have.not.been.called;
        expect(dataSocketConnectSpy).to.have.not.been.called;
      });

      it('connects on subscribe');

      it('test when no connect response received within timeout and retries');
      it('test when no connection state  response received within timeout and retries');
      it('test when disconnect request is received');

      it('communication');

      it('disconnect returns observable', function() {
        var disconnectObservable;// = knxConnection1.disconnect();
        expect(disconnectObservable).to.be.instanceOf(Observable, 'returns Observable');
        expect(knxConnection1.isConnected()).to.be.equal(true, 'is connected');
        expect(knxConnection1.getState()).to.be.equal(ConnectionState.connected, 'is connected');
        expect(controlSocketDisconnectSpy).to.have.not.been.called;
        expect(dataSocketDisconnectSpy).to.have.not.been.called;
      });

      it('disconnect on subscribe');

    });
  });
});
