import mongoose from 'mongoose';
import { AUTH_PROVIDERS } from '../configs/index.js';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  bio: { type: String },
  avatar: { type: String },
  skills: [{ type: String }],
  socials: [
    {
      label: { type: String },
      link: { type: String },
    },
  ],
  provider: { type: String, enum: Object.values(AUTH_PROVIDERS), default: AUTH_PROVIDERS.LOCAL },
}, { timestamps: true });

// Indexes for search
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

export default User;
