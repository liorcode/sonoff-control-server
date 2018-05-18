import { Schema, model, Document, Types as mongooseTypes } from 'mongoose';
import TimerSchema, { ITimerModel } from './timer.schema';
import DeviceSocket from '../lib/deviceSocket';
import User, { IUserModel } from './user.model';

export interface IDeviceState {
  switch: 'on' | 'off';
  startup?: 'on' | 'off' | 'keep';
  rssi?: number; // WiFi signal
  timers?: mongooseTypes.DocumentArray<ITimerModel>;
}

export interface IDeviceParams {
  user?: IUserModel;
  id: string; // Device id
  model: string; // Device model
  version: string; // ROM version
  name: string; // Device nickname
  state: IDeviceState;
}

export type IDeviceModel = Document & IDeviceParams & {
  getConnection (): DeviceSocket,
  isOnline(): boolean,
  setConnection(connection: DeviceSocket): Map<String, DeviceSocket>,
  removeConnection(): boolean,
};

const socketInstances = new Map<string, DeviceSocket>();
const DeviceSchema = new Schema({
  id: {
    type: String,
    required: 'Enter device id',
    unique: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  model: {
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
      delete ret._id;
      delete ret.__v;
    },
  },
});


DeviceSchema.methods.getConnection = function (): DeviceSocket {
  return socketInstances.get(this.id);
};

DeviceSchema.methods.isOnline = function (): boolean {
  const connection = socketInstances.get(this.id);
  return !!connection && connection.isConnectionAlive();
};


DeviceSchema.methods.setConnection = function (connection: DeviceSocket): Map<String, DeviceSocket> {
  return socketInstances.set(this.id, connection);
};

DeviceSchema.methods.removeConnection = function (): boolean {
  return socketInstances.delete(this.id);
};

export default model('Devices', DeviceSchema);
