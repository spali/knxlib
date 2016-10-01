import * as sinon from 'sinon';
import { Observer } from 'rxjs';

global.chai = require('chai');
global.chai.should();
global.expect = global.chai.expect;
global.sinon = require('sinon');
// setup chai with sinon-chai
global.sinonChai = require('sinon-chai');
global.chai.use(global.sinonChai);

export type ObserverSpies = {
  nextSpy: sinon.SinonSpy,
  errorSpy: sinon.SinonSpy,
  completeSpy: sinon.SinonSpy
};

export type ObserverSpies2 = {
  next: sinon.SinonSpy,
  error: sinon.SinonSpy,
  complete: sinon.SinonSpy
};

/**
 * Observer implementation with injected spies for test of next, error and complete.
 * NOTE: remember to call done() from inside the last expected to be executed function in case the functions contains asserts.
 */
export class SpyObserver<T> implements Observer<T> {
  public nextSpy = sinon.spy(this, 'next');
  public errorSpy = sinon.spy(this, 'error');
  public completeSpy = sinon.spy(this, 'complete');

  /**
   * Observer implementation with injected spies for test of next, error and complete.
   * NOTE: remember to call done() from inside the last expected to be executed function in case the functions contains asserts.
   */
  constructor(
    public nextFnc?: (next: T, spies: SpyObserver<T>) => void,
    public errorFnc?: (error: any, spies: SpyObserver<T>) => void,
    public completeFnc?: (spies: SpyObserver<T>) => void) {
  }

  public next(next: T) {
    try {
      if (this.nextFnc) this.nextFnc(next, this);
    } catch (error) {
      this.restore();
      throw error;
    }
  }

  public error(error: any) {
    try {
      if (this.errorFnc) this.errorFnc(error, this);
      this.restore();
    } catch (error) {
      this.restore();
      throw error;
    }
  }

  public complete() {
    try {
      if (this.completeFnc) this.completeFnc(this);
      this.restore();
    } catch (error) {
      this.restore();
      throw error;
    }
  }

  private restore() {
    this.nextSpy.restore();
    this.errorSpy.restore();
    this.completeSpy.restore();
  }

}

/**
 * creates a test observer with injected spies for test of next, error and complete.
 * NOTE: remember to call done() from inside the last expected to be executed function in case the functions contains asserts.
 */
export function createTestObserver<T>(
  nextFnc?: (next: T, spies: ObserverSpies) => void,
  errorFnc?: (error: any, spies: ObserverSpies) => void,
  completeFnc?: (spies: ObserverSpies) => void) {

  var spies: ObserverSpies;

  var testObserver: Observer<T> = {
    next: function(next) {
      try {
        if (nextFnc) nextFnc(next, spies);
      } catch (error) {
        throw error;
      } finally {
        spies.nextSpy.restore();
        spies.errorSpy.restore();
        spies.completeSpy.restore();
      }
    },
    error: function(error) {
      try {
        if (errorFnc) errorFnc(error, spies);
      } catch (error) {
        throw error;
      } finally {
        spies.nextSpy.restore();
        spies.errorSpy.restore();
        spies.completeSpy.restore();
      }
    },
    complete: function() {
      try {
        if (completeFnc) completeFnc(spies);
      } catch (error) {
        throw error;
      } finally {
        spies.nextSpy.restore();
        spies.errorSpy.restore();
        spies.completeSpy.restore();
      }
    }
  };
  spies = {
    nextSpy: sinon.spy(testObserver, 'next'),
    errorSpy: sinon.spy(testObserver, 'error'),
    completeSpy: sinon.spy(testObserver, 'complete')
  };
  return testObserver;
}

/**
 * default error observer which just throws the error.
 */
export function ErrorObserver(error: Error) {
  throw error;
}
