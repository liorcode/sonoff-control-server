import { NextFunction, Request, Response } from 'express';
import Device from '../../src/models/device.model';
import DevicesController from '../../src/controllers/devices.controller';
import { DeviceParams } from '../testData';


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

    DevicesController.list(req, res, next);
    expect(res.json).toBeCalledWith(devices);
  });
});
