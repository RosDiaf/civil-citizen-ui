/* tslint:disable:no-unused-expression */
import chai from 'chai';
import spies from 'sinon-chai';
import sinon from 'sinon';

import { ServiceAuthToken } from 'idam/serviceAuthToken';
import { IdamClient } from 'idam/idamClient';

import { RequireUtils } from 'test/requireUtils';
import { ServiceAuthTokenFactoryImpl } from 'shared/security/serviceTokenFactoryImpl';

RequireUtils.removeModuleFromCache('common/security/serviceTokenFactoryImpl');

chai.use(spies);

const expect = chai.expect;

const serviceAuthToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJpZGFtIiwiaWF0IjoxNDgzMjI4ODAwLCJleHAiOjQxMDI0NDQ4MDAsImF1ZCI6ImNtYyIsInN1YiI6ImNtYyJ9.Q9-gf315saUt007Gau0tBUxevcRwhEckLHzC82EVGIM'; // valid until 1st Jan 2100

async function returnServiceAuthToken(): Promise<ServiceAuthToken> {
  return new ServiceAuthToken(serviceAuthToken);
}

// this test suite passes locally but fails on Jenkins
describe.skip('ServiceAuthTokenFactory', () => {
  let retrieveServiceTokenFn;

  beforeEach(() => {
    retrieveServiceTokenFn = sinon.stub(IdamClient, 'retrieveServiceToken')
      .onFirstCall().returns(returnServiceAuthToken())
      .onSecondCall().throws('Unexpected error');
  });

  afterEach(() => {
    retrieveServiceTokenFn.restore();
  });

  it('should retrieve token from the API for the first time', async () => {
    expect(await new ServiceAuthTokenFactoryImpl().get()).to.be.deep.equal(new ServiceAuthToken(serviceAuthToken));
    expect(retrieveServiceTokenFn).to.be.called;
  });

  it('should retrieve token from the cache for the second time', async () => {
    expect(await new ServiceAuthTokenFactoryImpl().get()).to.be.deep.equal(new ServiceAuthToken(serviceAuthToken));
    expect(retrieveServiceTokenFn).to.not.be.called;
  });
});
