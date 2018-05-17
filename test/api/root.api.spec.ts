import request from 'supertest';
import app from '../../src/app';

describe('GET /', () => {
  it('should return 404', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(404);
  });
});
