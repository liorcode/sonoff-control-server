import { NextFunction, Request, Response } from 'express';
import Device from '../../src/models/device.model';
import DevicesController from '../../src/controllers/devices.controller';
import { DeviceParams } from '../testData';
import config from '../../src/config/config';

const waitTick = () => new Promise(resolve => setImmediate(resolve));

describe('Devices controller', () => {
  const device1 = { ...DeviceParams, name: 'kitchen' };
  const device2 = { ...DeviceParams, name: 'living room' };
  const devices = [device1, device2];
  beforeEach(() => {
    jest.spyOn(Device, 'find')
      .mockImplementation((conditions, cb) => cb(null, devices));
  });

  it('lists devices', () => {
    const req = <Request>{ params: {} };
    const res = <Response>{
      json: <any>jest.fn(),
    };
    const next = <NextFunction>jest.fn();

    jest.spyOn(Device, 'find')
      .mockImplementation((conditions, cb) => cb(null, devices));

    DevicesController.list(req, res, next);
    expect(res.json).toBeCalledWith(devices);
  });

  it('get device by id', () => {
    const device = { ... DeviceParams }; // copy
    const req = <Request>{ params: { deviceId: 2 } };
    const res = <Response>{
      json: <any>jest.fn(),
    };
    const next = <NextFunction>jest.fn();

    jest.spyOn(Device, 'findOne')
      .mockImplementation((conditions, cb) => cb(null, device));

    DevicesController.getDevice(req, res, next);
    expect(Device.findOne).toBeCalledWith({ id: 2, user: undefined }, expect.anything());
    expect(res.json).toBeCalledWith(device);
  });

  it('creates device', () => {
    const device = { ... DeviceParams }; // copy
    const req = <Request>{
      body: {
        ...device,
        user: 124, // attempt to override the auth user
      },
    };
    const res = <Response>{
      json: <any>jest.fn(),
    };
    const next = <NextFunction>jest.fn();

    jest.spyOn(Device.prototype, 'save')
      .mockImplementation(cb => cb(null, device));

    DevicesController.create(req, res, next);
    expect(res.json).toBeCalledWith(device);
  });

  it('updates allowed device attributes', () => {
    const device = { ... DeviceParams, isOnline: true, save: jest.fn().mockResolvedValue('') };
    const update = {
      name: 'hall',
      model: 'abc',
    };
    const updatedDevice = { ...device, name: 'hall' };

    const req = <Request>{ params: { deviceId: 2 }, body: update };
    const res = <Response>{
      json: <any>jest.fn(),
    };
    const next = <NextFunction>jest.fn();

    jest.spyOn(Device, 'findOne')
      .mockImplementation((conditions, cb) => cb(null, device));

    jest.spyOn(DevicesController, 'onDeviceUpdated')
      .mockImplementationOnce((device, params) => Promise.resolve());

    DevicesController.updateDevice(req, res, next);
    expect(device).toMatchObject({ ...device, name: 'hall' });
    expect(DevicesController.onDeviceUpdated).toBeCalledWith(updatedDevice, { name: 'hall' });
    return waitTick().then(() => {
      expect(device.save).toBeCalled();
    });
  });

  describe('onDeviceUpdated', () => {
    it('resolves if no state was updated', () => {
      const device = { ... DeviceParams, isOnline: true };
      const update = {
        name: 'hall',
        model: 'abc',
      };

      return expect(DevicesController.onDeviceUpdated(<any>device, update)).resolves.toBeUndefined();
    });

    it('calls syncDevice state was updated', () => {
      config.DISABLE_DEVICE_SYNC = false; // to test this, we must enable device sync
      const syncSpy = jest.fn().mockResolvedValue(undefined);
      const device = {
        ... DeviceParams,
        isOnline: true,
        getConnection: () => ({ syncState: syncSpy }),
      };

      return DevicesController.onDeviceUpdated(<any>device, { state: { switch: 'on' } })
        .then(() => {
          expect(syncSpy).toBeCalledWith({ switch: 'on' });

          config.DISABLE_DEVICE_SYNC = true; // set back to original value (disable sync during tests)
        });
    });

    it('rejects promise if device is offline', () => {
      const syncSpy = jest.fn().mockResolvedValue(undefined);
      const device = {
        ... DeviceParams,
        isOnline: false,
        getConnection: () => ({ syncState: syncSpy }),
      };

      const promise = DevicesController.onDeviceUpdated(<any>device, { state: { switch: 'on' } })
        .catch((err) => {
          expect(err).toBeInstanceOf(Error);
        });
    });
  });

  it('deletes device', () => {
    const device = { ... DeviceParams }; // copy
    const req = <Request>{ params: { deviceId: 2 } };
    const res = <Response>{
      json: <any>jest.fn(),
    };
    const next = <NextFunction>jest.fn();

    jest.spyOn(Device, 'remove')
      .mockImplementation((conditions, cb) => cb(null, device));

    DevicesController.deleteDevice(req, res, next);
    expect(Device.remove).toBeCalledWith({ id: 2, user: undefined }, expect.anything());
    expect(res.json).toBeCalledWith({ message: 'Device successfully deleted' });
  });

});
