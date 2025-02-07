// waitlist.model.js
import mongoose from 'mongoose';

const waitlistSchema = new mongoose.Schema({
  email: {type: String, required: true, unique: true, lowercase: true, trim: true },
  ipAddress: {type: String, required: true },
  createdAt: {type: Date, default: Date.now }
});

export default mongoose.model('Waitlist', waitlistSchema);

