import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, required: true },
  skill: { type: String, required: true },
  gitIntegration: { type: String, required: true }
});

export default mongoose.model('User', UserSchema);
