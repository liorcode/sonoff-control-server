import { Schema, model, Document } from 'mongoose';
import TimerSchema, { TimerModel } from './timer.schema';
import DeviceSocket from "../lib/deviceSocket";

export type DeviceState = {
  switch: 'on' | 'off',
  startup: 'on' | 'off' | 'keep',
  rssi: string,
  timers: TimerModel[] | 0,
}

export type DeviceParams = {
  id: string,
  model: string,
  manufacturerName: string,
  version: string,
  name: string,
  state: DeviceState,
}

export type DeviceModel = Document & DeviceParams & {
  getConnection (): DeviceSocket,
  isOnline(): boolean,
  setConnection(connection: DeviceSocket): Map<String, DeviceSocket>,
  removeConnection(): boolean
}

const socketInstances = new Map<string, DeviceSocket>();
const DeviceSchema = new Schema({
  id: {
    type: String,
    required: 'Enter device id',
    unique: true,
  },
  model: {
    type: String,
  },
  manufacturerName: {
    type: String,
  },
  version: {
    type: String,
  },
  name: {
    type: String,
  },
  state: {
    switch: {
      type: String,
      enum: ['on', 'off'],
      default: 'off',
    },
    startup: {
      type: String,
      enum: ['on', 'off', 'keep'],
      default: 'keep',
    },
    rssi: {
      type: String,
    },
    timers: [TimerSchema],
  },
}, {
  toJSON: {
      /**
       * Clean mongoose attributes from returned objects
       */
      transform(doc, ret) {
          /* eslint no-param-reassign: "off", no-underscore-dangle: "off" */
          delete ret._id;
          delete ret.__v;
      },
  }
});


DeviceSchema.methods.getConnection = function (): DeviceSocket {
  return socketInstances.get(this.deviceId);
};

DeviceSchema.methods.isOnline = function (): boolean {
  const connection = socketInstances.get(this.deviceId);
  return connection && connection.isConnectionAlive();
};


DeviceSchema.methods.setConnection = function (connection: DeviceSocket): Map<String, DeviceSocket> {
  return socketInstances.set(this.deviceId, connection);
};

DeviceSchema.methods.removeConnection = function (): boolean {
  return socketInstances.delete(this.deviceId);
};

export default model('Devices', DeviceSchema);
