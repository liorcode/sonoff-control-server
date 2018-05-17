import request from 'supertest';
import 'jest-extended';
import app from '../../src/app';

describe('GET /dispatch/device', () => {
  it('should return 200', async () => {
    const response = await request(app).post('/dispatch/device');
    expect(response.status).toBe(200);
    expect(response.body).toBeObject();
    expect(response.body).toContainAllKeys(['error', 'reason', 'IP', 'port']);
  });
});
