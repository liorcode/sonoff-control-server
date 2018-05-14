import request from 'supertest';
import 'jest-extended';
import app from '../src/app';

describe('GET /devices', () => {
  it('should return 200', async () => {
    const response = await request(app).get('/devices');
    expect(response.status).toBe(200);
    expect(response.body).toBeArray();
  });
});
