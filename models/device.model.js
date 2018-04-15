/* eslint func-names: "off" */

const mongoose = require('mongoose');
const TimerSchema = require('./timer.schema');

const { Schema } = mongoose;
const socketInstances = new Map();
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
});

DeviceSchema.options.toJSON = {
  /**
   * Clean mongoose attributes from returned objects
   */
  transform(doc, ret) {
    /* eslint no-param-reassign: "off", no-underscore-dangle: "off" */
    delete ret._id;
    delete ret.__v;
  },
};

DeviceSchema.methods.getConnection = function () {
  return socketInstances.get(this.deviceId);
};

DeviceSchema.methods.isOnline = function () {
  const connection = socketInstances.get(this.deviceId);
  return connection && connection.isConnectionAlive();
};


DeviceSchema.methods.setConnection = function (deviceMgr) {
  return socketInstances.set(this.deviceId, deviceMgr);
};

DeviceSchema.methods.removeConnection = function () {
  return socketInstances.delete(this.deviceId);
};


module.exports = mongoose.model('Devices', DeviceSchema);
