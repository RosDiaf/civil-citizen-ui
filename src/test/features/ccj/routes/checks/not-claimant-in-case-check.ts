import { expect } from 'chai';
import request from 'supertest';
import config from 'config';

import 'test/routes/expectations';

import { claimStoreServiceMock } from 'test/http-mocks/claim-store';
import { idamServiceMock } from 'test/http-mocks/idam';

const cookieName: string = config.get<string>('session.cookieName');

export function checkNotClaimantInCaseGuard(app: any, method: string, pagePath: string) {
  it(`for ${method} should return 403 and render forbidden error page not claimant in case`, async () => {
    claimStoreServiceMock.resolveRetrieveClaimByExternalId();
    idamServiceMock.resolveRetrieveUserFor('4', 'citizen');

    await request(app)[method](pagePath)
      .set('Cookie', `${cookieName}=ABC`)
      .expect(res => expect(res).to.be.forbidden.withText('Forbidden'));
  });
}
