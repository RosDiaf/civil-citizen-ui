import { expect } from 'chai';
import request from 'supertest';
import config from 'config';

import { attachDefaultHooks } from 'test/routes/hooks';
import 'test/routes/expectations';
import { checkAuthorizationGuards } from 'test/features/claim/routes/checks/authorization-check';
import { checkEligibilityGuards } from 'test/features/claim/routes/checks/eligibility-check';

import { Paths as ClaimPaths } from 'claim/paths';

import { app } from 'main/app';

import { idamServiceMock } from 'test/http-mocks/idam';
import { draftStoreServiceMock } from 'test/http-mocks/draft-store';

const cookieName: string = config.get<string>('session.cookieName');

describe('Claim issue: resolving this dispute page', () => {
  attachDefaultHooks(app);

  describe('on GET', () => {
    checkAuthorizationGuards(app, 'get', ClaimPaths.resolvingThisDisputerPage.uri);
    checkEligibilityGuards(app, 'get', ClaimPaths.resolvingThisDisputerPage.uri);

    it('should render page when everything is fine', async () => {
      idamServiceMock.resolveRetrieveUserFor('1', 'citizen');
      draftStoreServiceMock.resolveFind('claim');

      await request(app)
        .get(ClaimPaths.resolvingThisDisputerPage.uri)
        .set('Cookie', `${cookieName}=ABC`)
        .expect(res => expect(res).to.be.successful.withText('Try to resolve the dispute'));
    });
  });

  describe('on POST', () => {
    checkAuthorizationGuards(app, 'post', ClaimPaths.resolvingThisDisputerPage.uri);
    checkEligibilityGuards(app, 'post', ClaimPaths.resolvingThisDisputerPage.uri);

    describe('for authorized user', () => {
      beforeEach(() => {
        idamServiceMock.resolveRetrieveUserFor('1', 'citizen');
      });

      it('should return 500 and render error page when cannot save draft', async () => {
        draftStoreServiceMock.resolveFind('claim');
        draftStoreServiceMock.rejectUpdate();

        await request(app)
          .post(ClaimPaths.resolvingThisDisputerPage.uri)
          .set('Cookie', `${cookieName}=ABC`)
          .expect(res => expect(res).to.be.serverError.withText('Error'));
      });

      it('should redirect to task list when everything is fine', async () => {
        draftStoreServiceMock.resolveFind('claim');
        draftStoreServiceMock.resolveUpdate();

        await request(app)
          .post(ClaimPaths.resolvingThisDisputerPage.uri)
          .set('Cookie', `${cookieName}=ABC`)
          .expect(res => expect(res).to.be.redirect.toLocation(ClaimPaths.taskListPage.uri));
      });
    });
  });
});
