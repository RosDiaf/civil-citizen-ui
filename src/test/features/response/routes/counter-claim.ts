import { expect } from 'chai';
import * as request from 'supertest';
import * as config from 'config';

import { attachDefaultHooks } from 'test/routes/hooks';
import 'test/routes/expectations';
import { checkAuthorizationGuards } from 'test/common/checks/authorization-check';

import { Paths as ResponsePaths } from 'response/paths';

import { app } from 'main/app';

import * as idamServiceMock from 'test/http-mocks/idam';
import * as draftStoreServiceMock from 'test/http-mocks/draft-store';
import * as claimStoreServiceMock from 'test/http-mocks/claim-store';

import { checkCountyCourtJudgmentRequestedGuard } from 'test/common/checks/ccj-requested-check';
import { checkNotDefendantInCaseGuard } from 'test/common/checks/not-defendant-in-case-check';
import * as feesServiceMock from 'test/http-mocks/fees';
import { verifyRedirectForGetWhenAlreadyPaidInFull } from 'test/app/guards/alreadyPaidInFullGuard';

import { mock, reset } from 'ts-mockito';
import { LaunchDarklyClient } from 'shared/clients/launchDarklyClient';
import { FeatureToggles } from 'utils/featureToggles';
import * as sinon from 'sinon';

const mockLaunchDarklyClient: LaunchDarklyClient = mock(LaunchDarklyClient);

const cookieName: string = config.get<string>('session.cookieName');
const pagePath: string = ResponsePaths.counterClaimPage.evaluateUri({ externalId: claimStoreServiceMock.sampleClaimObj.externalId });

describe('Defendant response: counter claim page', () => {
  attachDefaultHooks(app);

  let newClaimFeesEnabledStub: sinon.SinonStub;

  beforeEach(() => {
    newClaimFeesEnabledStub = sinon.stub(FeatureToggles.prototype, 'isNewClaimFeesEnabled');
  });

  afterEach(() => {
    reset(mockLaunchDarklyClient);
    newClaimFeesEnabledStub.restore();
  });

  describe('on GET', () => {
    const method = 'get';
    checkAuthorizationGuards(app, method, pagePath);
    checkNotDefendantInCaseGuard(app, method, pagePath);

    describe('for authorized user', () => {
      beforeEach(() => {
        idamServiceMock.resolveRetrieveUserFor(claimStoreServiceMock.sampleClaimObj.defendantId, 'citizen');
      });

      checkCountyCourtJudgmentRequestedGuard(app, method, pagePath);
      verifyRedirectForGetWhenAlreadyPaidInFull(pagePath);

      it('should return 500 and render error page when cannot retrieve claim', async () => {
        claimStoreServiceMock.rejectRetrieveClaimByExternalId('HTTP error');

        await request(app)
          .get(pagePath)
          .set('Cookie', `${cookieName}=ABC`)
          .expect(res => expect(res).to.be.serverError.withText('Error'));
      });

      it('should render page when everything is fine', async () => {
        newClaimFeesEnabledStub.returns(false);
        draftStoreServiceMock.resolveFind('response');
        draftStoreServiceMock.resolveFind('mediation');
        claimStoreServiceMock.resolveRetrieveClaimByExternalId();
        feesServiceMock.resolveGetIssueFeeRangeGroup();
        feesServiceMock.resolveGetHearingFeeRangeGroup();

        await request(app)
          .get(pagePath)
          .set('Cookie', `${cookieName}=ABC`)
          .expect(res => expect(res).to.successful.withText('Complete and email the defence and counterclaim form by'));
      });
    });
  });
});
