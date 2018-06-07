import { Schema, Document } from 'mongoose';

export interface ITimerParams {
  enabled: boolean;
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
    required: 'Timer must include "type" attribute',
  },
  at: {
    type: String,
    required: 'Timer must include "at" attribute',
  },
  do: {
    switch: {
      type: String,
      enum: ['on', 'off'],
      required: 'Timer "do" attribute must include a "switch" attribute',
    },
  },
}, {
  toJSON: {
    /**
     * Clean mongoose attributes from returned objects
     */
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    },
  },
});

export default TimerSchema;
