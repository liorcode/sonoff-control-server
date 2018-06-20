import WebSocket from 'ws';
import DeviceSocket, { IDeviceMessage } from '../../src/lib/deviceSocket';
import Device, { IDeviceModel, IDeviceState } from '../../src/models/device.model';
import { DeviceParams } from '../testData';
const waitTick = () => new Promise(resolve => setImmediate(resolve));

fdescribe('Device socket', () => {
  let deviceSocket: DeviceSocket;
  let ws: WebSocket;

  const state = <Partial<IDeviceState>>{
    switch: 'on',
    startup: 'off',
  };

  const stateWithEmptyTimers = <Partial<IDeviceState>>{
    switch: 'on',
    startup: 'off',
    timers: [],
  };

  const stateWithTimers = <Partial<IDeviceState>>{
    switch: 'on',
    startup: 'off',
    timers: [
      { enabled: true, type: 'once', at: '2018-06-17T08:04:15.012Z', do: { switch: 'off' } },
      { enabled: true, type: 'repeat', at: '* * * * 0 0', do: { switch: 'off' } },
    ],
  };

  beforeEach(() => {
    ws = <WebSocket>{
      readyState: WebSocket.OPEN, // online
      send: <any>jest.fn(),
    };
    const apiKey = '1111';
    const device = <IDeviceModel>new Device(DeviceParams);
    deviceSocket = new DeviceSocket(ws, apiKey, device);
  });

  describe('isConnectionAlive', () => {
    it('returns true if connection is open', () => {
      expect(deviceSocket.isConnectionAlive()).toBeTrue();
    });

    it('returns false if connection is not open', () => {
      ws.readyState = WebSocket.CLOSING;
      expect(deviceSocket.isConnectionAlive()).toBeFalse();
    });
  });

  describe('syncState', () => {
    let syncPromise: Promise<void>;
    let syncResolve: Function;
    let syncReject: Function;
    beforeEach(() => {
      jest.useFakeTimers();
      jest.spyOn(deviceSocket, 'formatTimers')
        .mockImplementation(message => 0);

      syncPromise = new Promise((resolve, reject) => {
        syncResolve = resolve;
        syncReject = reject;
      });

      jest.spyOn(deviceSocket, 'sendMessage')
        .mockImplementation(message => syncPromise);
    });
    it('rejects if message times out', async () => {
      const result = deviceSocket.syncState(state);
      // fast forward the timer
      jest.runAllTimers();
      return expect(result).rejects.toMatchObject({ message: 'Cannot sync device state: timeout' });
    });

    it('calls formatTimers with timers array', () => {
      const result = deviceSocket.syncState(stateWithEmptyTimers);
      syncResolve();
      return result.then(() => {
        expect(deviceSocket.formatTimers).toBeCalledWith(stateWithEmptyTimers.timers);
      });
    });

    it('calls sendMessage with state message', () => {
      const result = deviceSocket.syncState(state);
      syncResolve();
      return result.then(() => {
        expect(deviceSocket.sendMessage).toBeCalledWith(state);
      });
    });
  });

  describe('formatTimers', () => {
    it('returns 0 if no timers', () => {
      const result = deviceSocket.formatTimers(null);
      expect(result).toBe(0);

      const result2 = deviceSocket.formatTimers([]);
      expect(result2).toBe(0);
    });

    it('returns formatted timers', () => {
      const timers = deviceSocket.formatTimers(stateWithTimers.timers);
      expect(timers).toContainValues([
        { enabled: 1, type: 'once', at: '2018-06-17T08:04:15.012Z', do: { switch: 'off' } },
        { enabled: 1, type: 'repeat', at: '* * * * 0 0', do: { switch: 'off' } },
      ]);
    });
  });
});
