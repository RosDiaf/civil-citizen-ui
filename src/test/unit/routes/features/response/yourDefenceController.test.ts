import {app} from '../../../../../main/app';
import request from 'supertest';
import config from 'config';
import nock from 'nock';
import {CITIZEN_TIMELINE_URL, RESPONSE_YOUR_DEFENCE_URL} from '../../../../../main/routes/urls';
import {DEFENCE_REQUIRED} from '../../../../../main/common/form/validationErrors/errorMessageConstants';
import {
  mockCivilClaim,
  mockCivilClaimUndefined,
  mockCivilClaimUnemploymentRetired,
  mockNoStatementOfMeans,
  mockRedisFailure,
} from '../../../../utils/mockDraftStore';
import {TestMessages} from '../../../../utils/errorMessageTestConstants';

jest.mock('../../../../../main/modules/oidc');
jest.mock('../../../../../main/modules/draft-store');

describe('yourDefence', () => {
  const citizenRoleToken: string = config.get('citizenRoleToken');
  const idamUrl: string = config.get('idamUrl');
  beforeEach(() => {
    nock(idamUrl)
      .post('/o/token')
      .reply(200, {id_token: citizenRoleToken});
  });
  describe('on Get', () => {
    test('should return yourDefence page successfully', async () => {
      app.locals.draftStoreClient = mockCivilClaim;
      const claimantName = 'Mr. Jan Clark';
      const inset = 'Your response will be sent to ' + claimantName + '.';
      const header = 'Why do you disagree with the claim?';

      await request(app).get(RESPONSE_YOUR_DEFENCE_URL)
        .expect((res) => {
          expect(res.status).toBe(200);
          expect(res.text).toContain(header);
          expect(res.text).toContain(inset);
        });
    });
    test('should return yourDefence page successfully without claim', async () => {
      app.locals.draftStoreClient = mockCivilClaimUndefined;
      const claimantName = '';
      const inset = 'Your response will be sent to ' + claimantName + '.';
      const header = 'Why do you disagree with the claim?';
      await request(app).get(RESPONSE_YOUR_DEFENCE_URL)
        .expect((res) => {
          expect(res.status).toBe(200);
          expect(res.text).toContain(header);
          expect(res.text).toContain(inset);
        });
    });
    test('should return yourDefence page successfully', async () => {
      app.locals.draftStoreClient = mockCivilClaimUnemploymentRetired;
      const claimantName = 'Mr. Jan Clark';
      const inset = 'Your response will be sent to ' + claimantName + '.';
      const header = 'Why do you disagree with the claim?';
      await request(app).get(RESPONSE_YOUR_DEFENCE_URL)
        .expect((res) => {
          expect(res.status).toBe(200);
          expect(res.text).toContain(header);
          expect(res.text).toContain(inset);
        });
    });
    test('should return http 500 when has error', async () => {
      app.locals.draftStoreClient = mockRedisFailure;
      await request(app)
        .get(RESPONSE_YOUR_DEFENCE_URL)
        .expect((res) => {
          expect(res.status).toBe(500);
          expect(res.body).toMatchObject({error: TestMessages.REDIS_FAILURE});
        });
    });
  });
  describe('on Post', () => {
    test('should return error message when any text is filled', async () => {
      await request(app).post(RESPONSE_YOUR_DEFENCE_URL)
        .send()
        .expect((res) => {
          expect(res.status).toBe(200);
          expect(res.text).toContain(DEFENCE_REQUIRED);
          expect(res.text).toContain('govuk-error-message');
        });
    });

    test('should redirect to timeline page option text is fill', async () => {
      app.locals.draftStoreClient = mockNoStatementOfMeans;
      await request(app).post(RESPONSE_YOUR_DEFENCE_URL)
        .send({text: 'Test'})
        .expect((res) => {
          expect(res.status).toBe(302);
          expect(res.header.location).toEqual(CITIZEN_TIMELINE_URL);
        });
    });

    test('should return http 500 when has error', async () => {
      app.locals.draftStoreClient = mockRedisFailure;
      await request(app)
        .post(RESPONSE_YOUR_DEFENCE_URL)
        .send({text: 'Test'})
        .expect((res) => {
          expect(res.status).toBe(500);
          expect(res.body).toMatchObject({error: TestMessages.REDIS_FAILURE});
        });
    });
  });
});