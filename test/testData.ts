import { IDeviceParams } from '../src/models/device.model';

export const DeviceParams: IDeviceParams = {
  id: '123',
  model: 'ABC',
  name: 'light',
  version: '1.5.5',
  state: {
    startup: 'on',
    rssi: -42,
    switch: 'on',
    timers: null,
  },
};
