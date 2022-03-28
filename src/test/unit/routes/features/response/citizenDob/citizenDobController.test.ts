import {app} from '../../../../../../main/app';
import config from 'config';
import nock from 'nock';
import request from 'supertest';
import {VALID_DATE, VALID_DAY, VALID_MONTH, VALID_YEAR} from '../../../../../../main/common/form/validationErrors/errorMessageConstants';
import {AGE_ELIGIBILITY_URL, DOB_URL, CITIZEN_PHONE_NUMBER_URL} from '../../../../../../main/routes/urls';
import {mockCivilClaim, mockRedisFailure, mockNoStatementOfMeans} from '../../../../../utils/mockDraftStore';
import {REDIS_FAILURE} from '../../../../../utils/errorMessageTestConstants';

jest.mock('../../../../../../main/modules/oidc');
jest.mock('../../../../../../main/modules/draft-store');

describe('Citizen date of birth', () => {
  const citizenRoleToken: string = config.get('citizenRoleToken');
  const idamUrl: string = config.get('idamUrl');
  beforeEach(() => {
    nock(idamUrl)
      .post('/o/token')
      .reply(200, { id_token: citizenRoleToken });
  });

  describe('on GET', () => {
    test('should return citizen date of birth page empty when dont have information on redis ', async () => {
      app.locals.draftStoreClient = mockNoStatementOfMeans;
      await request(app)
        .get(DOB_URL)
        .expect((res) => {
          expect(res.status).toBe(200);
          expect(res.text).toContain('Enter your date of birth');
        });
    });
    test('should return citizen date of birth page with all information from redis', async () => {
      app.locals.draftStoreClient = mockCivilClaim;
      await request(app)
        .get(DOB_URL)
        .expect((res) => {
          expect(res.status).toBe(200);
          expect(res.text).toContain('Enter your date of birth');
        });
    });
    test('should return http 500 when has error in the get method', async () => {
      app.locals.draftStoreClient = mockRedisFailure;
      await request(app)
        .get(DOB_URL)
        .expect((res) => {
          expect(res.status).toBe(500);
          expect(res.body).toEqual({ error: REDIS_FAILURE });
        });
    });
  });

  describe('on POST', () => {
    test('should return errors on no input', async () => {
      app.locals.draftStoreClient = mockCivilClaim;
      await request(app)
        .post(DOB_URL)
        .send('year=')
        .send('month=')
        .send('day=')
        .expect((res) => {
          expect(res.status).toBe(200);
          expect(res.text).toContain(VALID_DATE);
          expect(res.text).toContain(VALID_DAY);
          expect(res.text).toContain(VALID_MONTH);
          expect(res.text).toContain(VALID_YEAR);
        });
    });
    test('should return error on year less than 1872', async () => {
      await request(app)
        .post(DOB_URL)
        .send('year=1871')
        .send('month=1')
        .send('day=1')
        .expect((res) => {
          expect(res.status).toBe(200);
          expect(res.text).toContain(VALID_YEAR);
        });
    });
    test('should return error on empty year', async () => {
      await request(app)
        .post(DOB_URL)
        .send('year=')
        .send('month=1')
        .send('day=1')
        .expect((res) => {
          expect(res.status).toBe(200);
          expect(res.text).toContain(VALID_YEAR);
        });
    });
    test('should return error on future date', async () => {
      await request(app)
        .post(DOB_URL)
        .send('year=2400')
        .send('month=1')
        .send('day=1')
        .expect((res) => {
          expect(res.status).toBe(200);
          expect(res.text).toContain(VALID_DATE);
        });
    });
    test('should accept a valid input', async () => {
      await request(app)
        .post(DOB_URL)
        .send('year=2000')
        .send('month=1')
        .send('day=1')
        .expect((res) => {
          expect(res.status).toBe(302);
        });
    });
    test('should redirect to under 18 contact court page', async () => {
      await request(app)
        .post(DOB_URL)
        .send('year=2021')
        .send('month=1')
        .send('day=1')
        .expect((res) => {
          expect(res.status).toBe(302);
          expect(res.text).toContain(`Redirecting to ${AGE_ELIGIBILITY_URL}`);
        });
    });
    test('should redirect to under 18 contact court page when has information on redis', async () => {
      await request(app)
        .post(DOB_URL)
        .send('year=2021')
        .send('month=1')
        .send('day=1')
        .expect((res) => {
          expect(res.status).toBe(302);
          expect(res.text).toContain(`Redirecting to ${AGE_ELIGIBILITY_URL}`);
        });
    });
    test('should redirect to phone number page on valid DOB', async () => {
      await request(app)
        .post(DOB_URL)
        .send('year=1981')
        .send('month=1')
        .send('day=1')
        .expect((res) => {
          expect(res.status).toBe(302);
          expect(res.text).toContain(`Redirecting to ${CITIZEN_PHONE_NUMBER_URL}`);
        });
    });
    test('should redirect to phone number page on valid DOB when has undefined on redis', async () => {
      app.locals.draftStoreClient = mockNoStatementOfMeans;
      await request(app)
        .post(DOB_URL)
        .send('year=1981')
        .send('month=1')
        .send('day=1')
        .expect((res) => {
          expect(res.status).toBe(302);
          expect(res.text).toContain(`Redirecting to ${CITIZEN_PHONE_NUMBER_URL}`);
        });
    });
    test('should return http 500 when has error in the post method', async () => {
      app.locals.draftStoreClient = mockRedisFailure;
      await request(app)
        .post(DOB_URL)
        .send('year=1981')
        .send('month=1')
        .send('day=1')
        .expect((res) => {
          expect(res.status).toBe(500);
          expect(res.body).toEqual({ error: REDIS_FAILURE });
        });
    });
  });
});
