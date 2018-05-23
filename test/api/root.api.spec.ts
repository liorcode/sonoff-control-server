import request from 'supertest';
import app from '../../src/app';

describe('GET /', () => {
  it('should return 200 ok', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ message: 'ok' });
  });
});
