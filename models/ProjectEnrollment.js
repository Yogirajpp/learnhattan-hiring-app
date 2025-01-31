import mongoose from 'mongoose';

const ProjectEnrollmentSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Projects', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

export default mongoose.model('ProjectEnrollment', ProjectEnrollmentSchema);
