import SonoffController from '../../src/controllers/sonoff.controller';
import { DeviceParams } from '../testData';
import WebSocket from 'ws';
import Device, { IDeviceModel } from '../../src/models/device.model';

const waitTick = () => new Promise(resolve => setImmediate(resolve));
describe('Sonoff controller', () => {
  const device = <IDeviceModel>new Device(DeviceParams);
  let ctrl: SonoffController;
  let ws: WebSocket;
  beforeEach(() => {
    ws = <WebSocket>{
      readyState: WebSocket.OPEN, // online
      send: <any>jest.fn(),
    };
    ctrl = new SonoffController(ws);
  });

  describe('handleRequest', () => {
    beforeEach(() => {
      jest.spyOn(ctrl, 'handleAction')
        .mockImplementationOnce(() => {
        });

      jest.spyOn(ctrl, 'handleAck')
        .mockImplementationOnce(() => {
        });
    });
    it('calls handleAction if action is passed in request', () => {
      const req = { action: 'register' };
      ctrl.handleRequest(req);
      expect(ctrl.handleAction).toBeCalledWith(req);
      expect(ctrl.handleAck).not.toBeCalled();
    });

    it('calls handleAck if no action is passed in request', () => {
      const req = { sequence: 1 };
      ctrl.device = device;
      ctrl.handleRequest(req);
      expect(ctrl.handleAction).not.toBeCalled();
      expect(ctrl.handleAck).toBeCalledWith(req);
    });
  });

  describe('handleRequest', () => {
    beforeEach(() => {
      jest.spyOn(ctrl, 'handleDate')
        .mockImplementationOnce(() => {
        });

      jest.spyOn(ctrl, 'handleRegister')
        .mockImplementationOnce(() => {
        });

      jest.spyOn(ctrl, 'handleQuery')
        .mockImplementationOnce(() => {
        });

      jest.spyOn(ctrl, 'handleUpdate')
        .mockImplementationOnce(() => {
        });
    });
    it('calls handleDate', () => {
      const req = { action: 'date' };
      ctrl.handleAction(req);
      expect(ctrl.handleDate).toBeCalled();
    });

    it('calls handleRegister', () => {
      const req = { action: 'register' };
      ctrl.handleAction(req);
      expect(ctrl.handleRegister).toBeCalledWith(req);
    });

    it('calls handleQuery', () => {
      const req = { action: 'query' };
      ctrl.handleAction(req);
      expect(ctrl.handleQuery).toBeCalledWith(req);
    });

    it('calls handleUpdate', () => {
      const req = { action: 'update' };
      ctrl.handleAction(req);
      expect(ctrl.handleUpdate).toBeCalledWith(req);
    });
  });

  it('calls device connection onAck', () => {
    const onAckSpy = jest.fn().mockResolvedValue(undefined);
    ctrl.device = device;
    jest.spyOn(device, 'getConnection')
      .mockImplementationOnce(() => ({ onAck: onAckSpy }));

    const req = { sequence: '123' };
    ctrl.handleAck(req);
    expect(onAckSpy).toBeCalledWith('123');
  });

  describe('handleQuery', () => {
    it('handles timers query', () => {
      jest.spyOn(ctrl, 'handleTimersRequest')
        .mockImplementationOnce(() => {
        });

      const req = { params: ['timers'] };
      ctrl.handleQuery(req);
      expect(ctrl.handleTimersRequest).toBeCalled();
    });

    it('responds with error to unknown query', () => {
      jest.spyOn(ctrl, 'respondError')
        .mockImplementationOnce(() => {
        });

      const req = <any>{ params: [] };
      ctrl.handleQuery(req);
      expect(ctrl.respondError).toBeCalled();
    });
  });

  it('responds to timer request (no timers)', () => {
    jest.spyOn(ctrl, 'respond')
      .mockImplementationOnce(() => {});

    ctrl.device = device;

    ctrl.handleTimersRequest();
    expect(ctrl.respond).toBeCalledWith(
      { params: 0 },
    );
  });

  it('responds to timer request (with timers)', () => {
    jest.spyOn(ctrl, 'respond')
      .mockImplementationOnce(() => {
      });

    ctrl.device = <IDeviceModel>new Device({
      ...DeviceParams,
      state: {
        timers: [
          { enabled: true, do: { switch: 'on' }, at: '* * * * * *', type: 'repeat' }, // repeat
          { enabled: true, do: { switch: 'on' }, at: '2100-06-07T20:00:00.000Z', type: 'once' }, // future
          { enabled: true, do: { switch: 'on' }, at: '2018-06-07T20:00:00.000Z', type: 'once' }, // past
        ],
      },
    });

    ctrl.handleTimersRequest();
    // only repeat or future timers should be returned
    expect(ctrl.respond).toBeCalledWith({
      params: [{
        timers: [
          { enabled: 1, do: { switch: 'on' }, at: '* * * * * *', type: 'repeat' },
          { enabled: 1, do: { switch: 'on' }, at: '2100-06-07T20:00:00.000Z', type: 'once' },
        ],
      }]},
    );
  });

  it('responds to update request', () => {
    jest.spyOn(ctrl, 'respond')
      .mockImplementationOnce(() => {
      });

    jest.spyOn(ctrl, 'respondError')
      .mockImplementationOnce(() => {
      });

    jest.spyOn(device, 'set')
      .mockImplementationOnce(() => {
      });

    jest.spyOn(device, 'save')
      .mockImplementationOnce(() => Promise.resolve());

    ctrl.device = device;

    const req = {
      params: {
        fwVersion: '1.5.5',
        switch: 'on',
        startup: 'off',
        rssi: -5,
      },
    };

    ctrl.handleUpdate(req);

    expect(device.set).toBeCalledWith({
      version: '1.5.5',
      state: {
        switch: 'on',
        startup: 'off',
        rssi: -5,
      },
    });

    expect(device.save).toBeCalled();

    return waitTick().then(() => {
      expect(ctrl.respond).toBeCalled();
    });
  });

  it('responds to date request', () => {
    jest.spyOn(ctrl, 'respond')
      .mockImplementationOnce(() => {
      });

    ctrl.device = device;

    ctrl.handleDate();
    expect(ctrl.respond).toBeCalledWith(
      expect.objectContaining({ date: expect.stringContaining('') }),
    );
  });

  describe('handleRegister', () => {

    it('finds existing device and updates it', () => {
      jest.spyOn(Device, 'findOne')
        .mockImplementationOnce((conditions, cb) => cb(null, device));

      jest.spyOn(device, 'save')
        .mockImplementation(() => Promise.resolve());

      jest.spyOn(device, 'setConnection')
        .mockImplementation(() => {
        });

      jest.spyOn(ctrl, 'respond')
        .mockImplementationOnce(() => {
        });

      const req = {
        model: 'mod',
        romVersion: '1.6',
      };

      ctrl.handleRegister(req);
      expect(ctrl.device).toBe(device);
      expect(ctrl.device.model).toBe('mod');
      expect(ctrl.device.version).toBe('1.6');

      return waitTick().then(() => {
        expect(device.setConnection).toBeCalled();
        expect(ctrl.respond).toBeCalled();
      });
    });

    it('creates non existing device', () => {
      jest.spyOn(Device, 'findOne')
        .mockImplementationOnce((conditions, cb) => cb(null, null));

      jest.spyOn(device, 'save')
        .mockImplementation(() => Promise.resolve());

      jest.spyOn(device, 'setConnection')
        .mockImplementation(() => {
        });

      jest.spyOn(ctrl, 'respond')
        .mockImplementationOnce(() => {
        });

      jest.spyOn(ctrl, 'onRegisterNonExistingDevice')
        .mockImplementationOnce(() => device);

      const req = {
        model: 'mod',
        romVersion: '1.6',
      };

      ctrl.handleRegister(req);
      expect(ctrl.onRegisterNonExistingDevice).toBeCalled();
      expect(ctrl.device).toBe(device);
      expect(ctrl.device.model).toBe('mod');
      expect(ctrl.device.version).toBe('1.6');

      return waitTick().then(() => {
        expect(device.setConnection).toBeCalled();
        expect(ctrl.respond).toBeCalled();
      });
    });

    it('creates non existing device with name = deviceid', () => {
      const createdDevice = ctrl.onRegisterNonExistingDevice({ deviceid: 'abc' });
      expect(createdDevice).toBeInstanceOf(Device);
      expect(createdDevice.name).toBe('abc');
    });
  });

  it('sends response', () => {
    jest.spyOn(ws, 'send')
      .mockImplementationOnce(() => {
      });

    ctrl.device = device;

    ctrl.respond({ test: 1 });
    expect(ws.send).toBeCalledWith(JSON.stringify({
      error: 0,
      apikey: ctrl.apiKey,
      deviceid: device.id,
      test: 1,
    }));
  });

  it('sends error response', () => {
    jest.spyOn(ws, 'send')
      .mockImplementationOnce(() => {
      });

    ctrl.device = device;

    ctrl.respondError();
    expect(ws.send).toBeCalledWith(JSON.stringify({
      error: 1,
      apikey: ctrl.apiKey,
      deviceid: device.id,
    }));
  });

  it('removes device connection on close', () => {
    ctrl.device = device;

    jest.spyOn(ctrl.device, 'removeConnection')
      .mockImplementationOnce(() => {
      });

    ctrl.onClose();

    expect(device.removeConnection).toBeCalled();
  });
});
