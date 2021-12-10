import { expect } from 'chai';
import request from 'supertest';
import config from 'config';

import { attachDefaultHooks } from 'test/routes/hooks';
import 'test/routes/expectations';

import { Paths } from 'dashboard/paths';

import { app } from 'main/app';

import idamServiceMock from 'test/http-mocks/idam';
import claimStoreServiceMock from 'test/http-mocks/claim-store';
import { checkAuthorizationGuards } from 'test/features/dashboard/routes/checks/authorization-check';
import { MomentFactory } from 'shared/momentFactory';

const cookieName: string = config.get<string>('session.cookieName');

const testData = [
  {
    status: 'Claim issued',
    claim: claimStoreServiceMock.sampleClaimIssueObj,
    claimOverride: {
      responseDeadline: MomentFactory.currentDate().add(1, 'days'),
    },
    claimantAssertions: ['000MC050', 'Wait for the defendant to respond',
      'They can request an extra 14 days if they need it.',
    ],
    defendantAssertions: ['000MC050', 'You haven’t responded to this claim',
      'You need to respond before 4pm on ',
      'Respond to claim',
    ],
  },
  {
    status: 'Claim issued with HWF reference',
    claim: claimStoreServiceMock.sampleHwfClaimIssueObj,
    claimOverride: {
      responseDeadline: MomentFactory.currentDate().add(1, 'days'),
      ccdCaseId: '1594112140470504',
      helpWithFeesNumber: true,
    },
    claimantAssertions: ['1594-1121-4047-0504',
      'We’re checking your Help with Fees application',
      'We’ll email you the result within 5 days.',
      'If you qualify for the whole court fee to be paid',
    ],
    defendantAssertions: ['000MC050', 'You haven’t responded to this claim',
      'You need to respond before 4pm on ',
      'Respond to claim',
    ],
  },
  {
    status: 'Requested more time',
    claim: claimStoreServiceMock.sampleClaimIssueObj,
    claimOverride: {
      moreTimeRequested: true,
      responseDeadline: '2099-08-08',
    },
    claimantAssertions: ['000MC050', 'The defendant has requested more time to respond',
      'John Doe has requested an extra 14 days to respond. They now have until 4pm on 8 August 2099 to respond.',
      'You can request a County Court Judgment against them if they don’t respond by the deadline.',
    ],
    defendantAssertions: ['000MC050', 'More time requested',
      'You need to respond before 4pm on 8 August 2099',
      'Respond to claim',
    ],
  },
];

const claimPagePath = Paths.claimantPage.evaluateUri({ externalId: claimStoreServiceMock.sampleClaimIssueObj.externalId });
const defendantPagePath = Paths.defendantPage.evaluateUri({ externalId: claimStoreServiceMock.sampleClaimIssueObj.externalId });

describe('Dashboard page', () => {
  attachDefaultHooks(app);

  describe('on GET', () => {
    checkAuthorizationGuards(app, 'get', claimPagePath);
    checkAuthorizationGuards(app, 'get', defendantPagePath);

    context('when user authorised', () => {
      context('Claim Status', () => {
        context('as a claimant', () => {
          beforeEach(() => {
            idamServiceMock.resolveRetrieveUserFor('1', 'citizen');
          });

          testData.forEach(data => {
            it(`should render claim status: ${data.status}`, async () => {
              claimStoreServiceMock.resolveRetrieveByExternalId(data.claim, data.claimOverride);

              await request(app)
                .get(claimPagePath)
                .set('Cookie', `${cookieName}=ABC`)
                .expect(res => expect(res).to.be.successful.withText(...data.claimantAssertions));
            });
          });
        });

        context('as a defendant', () => {
          beforeEach(() => {
            idamServiceMock.resolveRetrieveUserFor('123', 'citizen');
          });

          testData.forEach(data => {
            it(`should render dashboard: ${data.status}`, async () => {
              claimStoreServiceMock.resolveRetrieveByExternalId(data.claim, data.claimOverride);

              await request(app)
                .get(defendantPagePath)
                .set('Cookie', `${cookieName}=ABC`)
                .expect(res => expect(res).to.be.successful.withText(...data.defendantAssertions));
            });
          });
        });
      });
    });
  });
});
