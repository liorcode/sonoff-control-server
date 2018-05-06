import mongoose from 'mongoose';

export type IUserModel = mongoose.Document & {
  email: string,
  googleId: string,
};

const userSchema = new mongoose.Schema({
  email: String,
  googleId: String,
}, { timestamps: true });

export default mongoose.model('User', userSchema);
