import mongoose from 'mongoose';

const IssuesSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Projects', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  gitLink: { type: String, required: true },
  maintainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Maintainer', required: true },
  status: { type: String, enum: ['open', 'closed'], required: true },
  expPoint: { type: String, required: true }
});

export default mongoose.model('Issues', IssuesSchema);
