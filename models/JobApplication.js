import mongoose from 'mongoose';

const JobApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Jobs', required: true }
});

export default mongoose.model('JobApplication', JobApplicationSchema);
