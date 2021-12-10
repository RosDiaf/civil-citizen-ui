import { expect } from 'chai';
import request from 'supertest';
import config from 'config';

import { attachDefaultHooks } from 'test/routes/hooks';
import 'test/routes/expectations';

import { PartAdmissionPaths, Paths } from 'response/paths';

import { app } from 'main/app';

import idamServiceMock from 'test/http-mocks/idam';
import claimStoreServiceMock from 'test/http-mocks/claim-store';
import draftStoreServiceMock from 'test/http-mocks/draft-store';
import { checkAuthorizationGuards } from 'test/common/checks/authorization-check';
import { ResponseType } from 'response/form/models/responseType';
import { checkNotDefendantInCaseGuard } from 'test/common/checks/not-defendant-in-case-check';
import {
  verifyRedirectForGetWhenAlreadyPaidInFull,
  verifyRedirectForPostWhenAlreadyPaidInFull,
} from 'test/app/guards/alreadyPaidInFullGuard';

const cookieName: string = config.get<string>('session.cookieName');
const externalId = claimStoreServiceMock.sampleClaimObj.externalId;
const pagePath = PartAdmissionPaths.whyDoYouDisagreePage.evaluateUri({ externalId });

const validFormData = { text: 'I will not pay!' };
const header: string = 'Why do you disagree with the claim amount?';

describe('Defendant: partial admission - why do you disagree?', () => {

  attachDefaultHooks(app);

  describe('on GET', () => {
    const method = 'get';
    checkAuthorizationGuards(app, method, pagePath);
    checkNotDefendantInCaseGuard(app, method, pagePath);

    context('when user authorised', () => {
      beforeEach(() => {
        idamServiceMock.resolveRetrieveUserFor(claimStoreServiceMock.sampleClaimObj.defendantId, 'citizen');
      });

      verifyRedirectForGetWhenAlreadyPaidInFull(pagePath);

      context('when service is unhealthy', () => {
        it('should return 500 and render error page when cannot retrieve claim by external id', async () => {
          claimStoreServiceMock.rejectRetrieveClaimByExternalId('HTTP error');

          await request(app)
            .get(pagePath)
            .set('Cookie', `${cookieName}=ABC`)
            .expect(res => expect(res).to.be.serverError.withText('Error'));
        });

        it('should return 500 and render error page when cannot retrieve response draft', async () => {
          claimStoreServiceMock.resolveRetrieveClaimByExternalId();
          draftStoreServiceMock.rejectFind('Error');

          await request(app)
            .get(pagePath)
            .set('Cookie', `${cookieName}=ABC`)
            .expect(res => expect(res).to.be.serverError.withText('Error'));
        });
      });

      context('when service is healthy', () => {
        it(`should render page asking '${header}' when partial admission was selected`, async () => {
          claimStoreServiceMock.resolveRetrieveClaimByExternalId();
          draftStoreServiceMock.resolveFind('response:partial-admission', {
            response: {
              type: ResponseType.PART_ADMISSION,
            },
          });
          draftStoreServiceMock.resolveFind('mediation');
          await request(app)
            .get(pagePath)
            .set('Cookie', `${cookieName}=ABC`)
            .expect(res => expect(res).to.be.successful.withText(header));
        });
      });
    });

    describe('on POST', () => {
      const method = 'post';
      checkAuthorizationGuards(app, method, pagePath);
      checkNotDefendantInCaseGuard(app, method, pagePath);

      context('when user authorised', () => {
        beforeEach(() => {
          idamServiceMock.resolveRetrieveUserFor(claimStoreServiceMock.sampleClaimObj.defendantId, 'citizen');
        });

        verifyRedirectForPostWhenAlreadyPaidInFull(pagePath);

        context('when service is unhealthy', () => {
          it('should return 500 and render error page when cannot retrieve claim by external id', async () => {
            claimStoreServiceMock.rejectRetrieveClaimByExternalId('HTTP error');

            await request(app)
              .post(pagePath)
              .set('Cookie', `${cookieName}=ABC`)
              .send(validFormData)
              .expect(res => expect(res).to.be.serverError.withText('Error'));
          });

          it('should return 500 and render error page when cannot retrieve response draft', async () => {
            claimStoreServiceMock.resolveRetrieveClaimByExternalId();
            draftStoreServiceMock.rejectFind('Error');

            await request(app)
              .post(pagePath)
              .set('Cookie', `${cookieName}=ABC`)
              .send(validFormData)
              .expect(res => expect(res).to.be.serverError.withText('Error'));
          });

          it('should return 500 and render error page when cannot save response draft', async () => {
            claimStoreServiceMock.resolveRetrieveClaimByExternalId();
            draftStoreServiceMock.resolveFind('response:partial-admission');
            draftStoreServiceMock.resolveFind('mediation');
            draftStoreServiceMock.rejectUpdate();

            await request(app)
              .post(pagePath)
              .set('Cookie', `${cookieName}=ABC`)
              .send(validFormData)
              .expect(res => expect(res).to.be.serverError.withText('Error'));
          });
        });

        context('when service is healthy', () => {
          beforeEach(() => {
            claimStoreServiceMock.resolveRetrieveClaimByExternalId();
            draftStoreServiceMock.resolveFind('response:partial-admission', {
              response: {
                type: ResponseType.PART_ADMISSION,
              },
            });
            draftStoreServiceMock.resolveFind('mediation');
          });

          it('when form is valid should render page', async () => {
            draftStoreServiceMock.resolveUpdate();
            await request(app)
              .post(pagePath)
              .set('Cookie', `${cookieName}=ABC`)
              .send(validFormData)
              .expect(res => expect(res).to.be.redirect
                .toLocation(Paths.timelinePage.evaluateUri({ externalId })));
          });

          it('when form is invalid should render page', async () => {
            await request(app)
              .post(pagePath)
              .set('Cookie', `${cookieName}=ABC`)
              .send({ text: '' })
              .expect(res => expect(res).to.be.successful.withText(header, 'div class="error-summary"'));
          });
        });
      });
    });
  });
});
