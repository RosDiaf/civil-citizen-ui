import { expect } from 'chai';
import request from 'supertest';
import config from 'config';

import 'test/routes/expectations';

import { claimStoreServiceMock } from 'test/http-mocks/claim-store';
import { idamServiceMock } from 'test/http-mocks/idam';

const cookieName: string = config.get<string>('session.cookieName');

export function checkOnlyClaimantHasAccess(app: any, method: string, pagePath: string) {
  it(`for ${method} should return 403 and render forbidden error page when user is not claimant on the case`, async () => {
    idamServiceMock.resolveRetrieveUserFor('1', 'citizen');
    claimStoreServiceMock.resolveRetrieveClaimByExternalId({ submitterId: '999', defendantId: '1' });

    await request(app)[method](pagePath)
      .set('Cookie', `${cookieName}=ABC`)
      .expect(res => expect(res).to.be.forbidden.withText('Forbidden'));
  });
}
