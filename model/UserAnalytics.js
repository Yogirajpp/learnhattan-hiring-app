import mongoose from 'mongoose';

const UserAnalyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expPoint: { type: String, required: true },
  league: { type: String, required: true },
  rank: { type: String, required: true }
});

export default mongoose.model('UserAnalytics', UserAnalyticsSchema);
