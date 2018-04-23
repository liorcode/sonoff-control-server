import { Schema, model, Document } from 'mongoose';

export type TimerParams = {
  enabled?: boolean,
  type: 'once' | 'repeat',
  at: string,
  do: { switch: 'on' | 'off' }
};

export type TimerModel = Document & TimerParams;

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

export default TimerSchema;
