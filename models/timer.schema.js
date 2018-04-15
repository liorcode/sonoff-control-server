const mongoose = require('mongoose');

const { Schema } = mongoose;
const TimerSchema = new Schema({
  enabled: {
    type: Boolean,
    default: true,
  },
  type: {
    type: String,
    enum: ['once', 'repeat'],
  },
  at: {
    type: String,
  },
  do: {
    switch: {
      type: String,
      enum: ['on', 'off'],
    },
  },
});

TimerSchema.options.toJSON = {
  /**
   * Clean mongoose attributes from returned objects
   */
  transform(doc, ret) {
    /* eslint no-param-reassign: "off", no-underscore-dangle: "off" */
    delete ret._id;
    delete ret.__v;
  },
};

module.exports = TimerSchema;
