import WebSocket from 'ws';
import Device, { IDeviceModel, IDeviceParams } from '../../src/models/device.model';
import DeviceSocket from '../../src/lib/deviceSocket';
import { DeviceParams } from '../testData';

describe('Devices model', () => {

  let deviceModel: IDeviceModel;
  let ws: WebSocket;
  let connection: DeviceSocket;

  beforeEach(() => {
    deviceModel = <IDeviceModel>new Device(DeviceParams);
    ws = <WebSocket>{
      readyState: WebSocket.OPEN, // online
      send: <any>jest.fn(),
    };
    connection = new DeviceSocket(ws, 'key', deviceModel);
  });

  it('sets and gets ws connection', () => {
    deviceModel.setConnection(connection);
    const result = deviceModel.getConnection();
    expect(result).toEqual(connection);
  });

  it('checks connection isOnline', () => {
    deviceModel.setConnection(connection);
    expect(deviceModel.isOnline).toBeTrue();

    ws.readyState = WebSocket.CLOSED;
    expect(deviceModel.isOnline).toBeFalse();
  });

  it('includes isOnline when serializing to json', () => {
    const deviceModelJSON = deviceModel.toJSON();

    expect(deviceModelJSON.isOnline).toBeFalse();
  });

  it('removes connection', () => {
    deviceModel.setConnection(connection);
    expect(deviceModel.isOnline).toBeTrue();
    deviceModel.removeConnection();
    expect(deviceModel.isOnline).toBeFalse();
    expect(deviceModel.getConnection()).toBeUndefined();
  });
});
