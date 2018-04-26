import { Schema, Document } from 'mongoose';

export interface ITimerParams {
  enabled?: boolean;
  type: 'once' | 'repeat';
  at: string;
  do: { switch: 'on' | 'off' };
}

export type ITimerModel = Document & ITimerParams;

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
      delete ret._id;
      delete ret.__v;
    },
  },
});

export default TimerSchema;
