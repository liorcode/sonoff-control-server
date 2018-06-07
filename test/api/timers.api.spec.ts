import request from 'supertest';
import 'jest-extended';
import app from '../../src/app';

describe('timers', () => {
  const createdDevice = <any>{
    state: {
      switch: 'off',
      startup: 'keep',
      timers: [],
    },
    id: `test-${Date.now()}`,
    isOnline: false,
  };

  const createdTimer = <any>{
    do: {
      switch: 'on',
    },
    enabled: true,
    at: '2018-06-06T10:00:00.000Z',
    type: 'once',
  };

  beforeAll(() => {
    // Create a device to use in all the tests
    return request(app)
      .post('/devices')
      .set('Accept', 'application/json')
      .send({
        id: createdDevice.id,
      });
  });

  afterAll(() => {
    // Delete the created test device
    return request(app).delete(`/devices/${createdDevice.id}`);
  });

  it('should return 200 for GET', async () => {
    const response = await request(app).get(`/devices/${createdDevice.id}/timers`);
    expect(response.status).toBe(200);
    expect(response.body).toBeArray();
  });

  it('should create timer', async () => {
    const response = await request(app).post(`/devices/${createdDevice.id}/timers`)
      .set('Accept', 'application/json')
      .send({
        do: {
          switch: 'on',
        },
        enabled: true,
        at: '2018-06-06T10:00:00.000Z',
        type: 'once',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject(createdTimer);
    // update the created id, so we could use it for later tests
    createdTimer.id = response.body.id;
  });

  it('should get created timer', async () => {
    const response = await request(app).get(`/devices/${createdDevice.id}/timers/${createdTimer.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject(createdTimer);
  });

  it('should update timer switch', async () => {
    const response = await request(app).patch(`/devices/${createdDevice.id}/timers/${createdTimer.id}`)
      .set('Accept', 'application/json')
      .send({
        do: { switch: 'off' },
      });
    expect(response.status).toBe(200);
    createdTimer.do.switch = 'off';
    expect(response.body).toMatchObject(createdTimer);
  });

  it('should disable timer', async () => {
    const response = await request(app).patch(`/devices/${createdDevice.id}/timers/${createdTimer.id}`)
      .set('Accept', 'application/json')
      .send({
        enabled: false,
      });
    expect(response.status).toBe(200);
    createdTimer.enabled = false;
    expect(response.body).toMatchObject(createdTimer);
  });

  it('should delete the created timer', async () => {
    const response = await request(app).delete(`/devices/${createdDevice.id}/timers/${createdTimer.id}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ message: 'Timer successfully deleted' });

    const updatedResponse = await request(app).get(`/devices/${createdDevice.id}/timers/${createdTimer.id}`);
    expect(updatedResponse.status).toBe(404);
    expect(updatedResponse.body).toMatchObject({ message: 'Requested timer does not exist' });

  });
});
