import request from 'supertest';
import 'jest-extended';
import app from '../../src/app';

describe('devices', () => {
  const createdDevice = <any>{
    state: {
      switch: 'off',
      startup: 'keep',
      timers: [],
    },
    id: `test-${Date.now()}`,
    isOnline: false,
  };

  it('should return 200 for GET', async () => {
    const response = await request(app).get('/devices');
    expect(response.status).toBe(200);
    expect(response.body).toBeArray();
  });

  it('should create device and return it', async () => {
    const response = await request(app)
      .post('/devices')
      .set('Accept', 'application/json')
      .send({
        id: createdDevice.id,
      });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject(createdDevice);
  });

  it('should return created device', async () => {
    const response = await request(app).get(`/devices/${createdDevice.id}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject(createdDevice);
  });

  it('should return created device in array', async () => {
    const response = await request(app).get('/devices');
    expect(response.status).toBe(200);
    expect(response.body).toIncludeAllMembers([createdDevice]);
  });

  it('should update the created device name', async () => {
    const response = await request(app).patch(`/devices/${createdDevice.id}`)
      .set('Accept', 'application/json')
      .send({
        name: 'my device',
      });
    expect(response.status).toBe(200);
    createdDevice.name = 'my device';
    expect(response.body).toMatchObject(createdDevice);
  });

  it('should ignore updates to version/id/model', async () => {
    const response = await request(app).patch(`/devices/${createdDevice.id}`)
      .set('Accept', 'application/json')
      .send({
        id: 1,
        model: 'mod',
        version: 3,
      });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject(createdDevice);
  });

  it('should update offline device switch (with sync failure)', async () => {
    const response = await request(app).patch(`/devices/${createdDevice.id}`)
      .set('Accept', 'application/json')
      .send({
        state: { switch: 'on' },
      });
    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({ message: 'Device attributes updated, but not synced: device is offline' });

    createdDevice.state.switch = 'on';
    const updatedResponse = await request(app).get(`/devices/${createdDevice.id}`);
    expect(updatedResponse.body).toMatchObject(createdDevice);
  });

  it('should set device timers', async () => {
    const timer1 = { enabled: true, type: 'once', at: (new Date()).toISOString(), do: { switch: 'on' } };
    const timer2 = { enabled: true, type: 'repeat', at: '* * * * 0 0', do: { switch: 'on' } };
    const response = await request(app).patch(`/devices/${createdDevice.id}`)
      .set('Accept', 'application/json')
      .send({
        state: {
          timers: [timer1, timer2],
        },
      });
    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({ message: 'Device attributes updated, but not synced: device is offline' });

    createdDevice.state.timers = [timer1, timer2];
    const updatedResponse = await request(app).get(`/devices/${createdDevice.id}`);
    expect(updatedResponse.body).toMatchObject(createdDevice);
  });

  it('should delete the created device', async () => {
    const response = await request(app).delete(`/devices/${createdDevice.id}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ message: 'Device successfully deleted' });

    const updatedResponse = await request(app).get(`/devices/${createdDevice.id}`);
    expect(updatedResponse.status).toBe(404);
    expect(updatedResponse.body).toMatchObject({ message: 'Requested device does not exist' });

  });
});
