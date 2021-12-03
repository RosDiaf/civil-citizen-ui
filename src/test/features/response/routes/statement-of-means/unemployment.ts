import { expect } from 'chai';
import * as request from 'supertest';
import * as config from 'config';
import 'test/routes/expectations';
import { StatementOfMeansPaths } from 'response/paths';
import * as idamServiceMock from 'test/http-mocks/idam';
import * as draftStoreServiceMock from 'test/http-mocks/draft-store';
import * as claimStoreServiceMock from 'test/http-mocks/claim-store';
import { attachDefaultHooks } from 'test/routes/hooks';
import { checkAuthorizationGuards } from 'test/common/checks/authorization-check';
import { checkAlreadySubmittedGuard } from 'test/common/checks/already-submitted-check';
import { checkCountyCourtJudgmentRequestedGuard } from 'test/common/checks/ccj-requested-check';
import { app } from 'main/app';
import { checkNotDefendantInCaseGuard } from 'test/common/checks/not-defendant-in-case-check';
import { UnemploymentType } from 'response/form/models/statement-of-means/unemploymentType';
import {
  verifyRedirectForGetWhenAlreadyPaidInFull,
  verifyRedirectForPostWhenAlreadyPaidInFull,
} from 'test/app/guards/alreadyPaidInFullGuard';

const externalId: string = claimStoreServiceMock.sampleClaimObj.externalId;
const cookieName: string = config.get<string>('session.cookieName');
const pagePath: string = StatementOfMeansPaths.unemployedPage.evaluateUri({ externalId: externalId });
const nextPagePath: string = StatementOfMeansPaths.courtOrdersPage.evaluateUri({ externalId: externalId });

describe('Defendant response: Statement of means: unemployment page', () => {

  attachDefaultHooks(app);

  describe('on GET', () => {

    const method = 'get';
    checkAuthorizationGuards(app, method, pagePath);
    checkNotDefendantInCaseGuard(app, method, pagePath);

    context('when user authorised', () => {

      beforeEach(() => {
        idamServiceMock.resolveRetrieveUserFor(claimStoreServiceMock.sampleClaimObj.defendantId, 'citizen', 'defendant');
      });

      checkAlreadySubmittedGuard(app, method, pagePath);
      checkCountyCourtJudgmentRequestedGuard(app, method, pagePath);
      verifyRedirectForGetWhenAlreadyPaidInFull(pagePath);

      context('when response and CCJ not submitted', () => {

        it('should return 500 and render error page when cannot retrieve claim', async () => {
          claimStoreServiceMock.rejectRetrieveClaimByExternalId('HTTP error');

          await request(app)
            .get(pagePath)
            .set('Cookie', `${cookieName}=ABC`)
            .expect(res => expect(res).to.be.serverError.withText('Error'));
        });

        it('should return 500 and render error page when cannot retrieve draft', async () => {
          claimStoreServiceMock.resolveRetrieveClaimByExternalId();
          draftStoreServiceMock.rejectFind('Error');

          await request(app)
            .get(pagePath)
            .set('Cookie', `${cookieName}=ABC`)
            .expect(res => expect(res).to.be.serverError.withText('Error'));
        });

        it('should render page when everything is fine', async () => {
          claimStoreServiceMock.resolveRetrieveClaimByExternalId();
          draftStoreServiceMock.resolveFind('response:full-admission');
          draftStoreServiceMock.resolveFind('mediation');

          await request(app)
            .get(pagePath)
            .set('Cookie', `${cookieName}=ABC`)
            .expect(res => expect(res).to.be.successful.withText('Are you unemployed or retired?'));
        });
      });
    });
  });

  describe('on POST', () => {

    const method = 'post';
    checkAuthorizationGuards(app, method, pagePath);
    checkNotDefendantInCaseGuard(app, method, pagePath);

    describe('for authorized user', () => {

      beforeEach(() => {
        idamServiceMock.resolveRetrieveUserFor(claimStoreServiceMock.sampleClaimObj.defendantId, 'citizen', 'defendant');
      });

      checkAlreadySubmittedGuard(app, method, pagePath);
      checkCountyCourtJudgmentRequestedGuard(app, method, pagePath);
      verifyRedirectForPostWhenAlreadyPaidInFull(pagePath);

      describe('errors are handled properly', () => {

        it('should return 500 and render error page when cannot retrieve claim', async () => {
          claimStoreServiceMock.rejectRetrieveClaimByExternalId('HTTP error');

          await request(app)
            .post(pagePath)
            .set('Cookie', `${cookieName}=ABC`)
            .expect(res => expect(res).to.be.serverError.withText('Error'));
        });

        it('should return 500 and render error page when cannot retrieve draft', async () => {
          claimStoreServiceMock.resolveRetrieveClaimByExternalId();
          draftStoreServiceMock.rejectFind('Error');

          await request(app)
            .post(pagePath)
            .set('Cookie', `${cookieName}=ABC`)
            .expect(res => expect(res).to.be.serverError.withText('Error'));
        });

        context('should redirect to Task list page when', () => {

          it('UNEMPLOYED selected', async () => {
            claimStoreServiceMock.resolveRetrieveClaimByExternalId();
            draftStoreServiceMock.resolveFind('response:full-admission');
            draftStoreServiceMock.resolveFind('mediation');
            draftStoreServiceMock.resolveUpdate();

            await request(app)
              .post(pagePath)
              .send({ option: UnemploymentType.UNEMPLOYED.value, unemploymentDetails: { years: 0, months: 1 } })
              .set('Cookie', `${cookieName}=ABC`)
              .expect(res => expect(res).to.be.redirect.toLocation(nextPagePath));
          });

          it('RETIRED selected', async () => {
            claimStoreServiceMock.resolveRetrieveClaimByExternalId();
            draftStoreServiceMock.resolveFind('response:full-admission');
            draftStoreServiceMock.resolveFind('mediation');
            draftStoreServiceMock.resolveUpdate();

            await request(app)
              .post(pagePath)
              .send({ option: UnemploymentType.RETIRED.value })
              .set('Cookie', `${cookieName}=ABC`)
              .expect(res => expect(res).to.be.redirect.toLocation(nextPagePath));
          });

          it('OTHER selected', async () => {
            claimStoreServiceMock.resolveRetrieveClaimByExternalId();
            draftStoreServiceMock.resolveFind('response:full-admission');
            draftStoreServiceMock.resolveFind('mediation');
            draftStoreServiceMock.resolveUpdate();

            await request(app)
              .post(pagePath)
              .send({ option: UnemploymentType.OTHER.value, otherDetails: { details: 'story' } })
              .set('Cookie', `${cookieName}=ABC`)
              .expect(res => expect(res).to.be.redirect.toLocation(nextPagePath));
          });
        });
      });
    });
  });
});
