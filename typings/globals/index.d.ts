declare interface Class<T> {
  new (...args: any[]): T;
}

declare namespace NodeJS {
  export interface Process {
    _getActiveRequests(): any; // undocumented debugging function
    _getActiveHandles(): any; // undocumented debugging function
  }
}

declare var expect: Chai.ExpectStatic;
declare var sinon: sinon.SinonStatic;
declare namespace NodeJS {
  interface Global {
    chai: Chai.ChaiStatic;
    expect: Chai.ExpectStatic;
    sinon: sinon.SinonStatic;
    sinonChai: any;
  }
}
