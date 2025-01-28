import mongoose from 'mongoose';

const IssueGitSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Projects', required: true },
  maintainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Maintainer', required: true },
  gitData: { type: String, required: true }
});

export default mongoose.model('IssueGit', IssueGitSchema);
