import mongoose from 'mongoose';

const IssueEnrollmentSchema = new mongoose.Schema({
  owner: { type: String, required: true },
  repo: { type: String, required: true },
  issue_number: { type: Number, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

export default mongoose.model('IssueEnrollment', IssueEnrollmentSchema);
