import mongoose from 'mongoose';

export type IUserModel = mongoose.Document & {
  email: string,
  googleId: string,
};

const userSchema = new mongoose.Schema({
  email: String,
  googleId: String,
},{
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

export default mongoose.model('User', userSchema);
