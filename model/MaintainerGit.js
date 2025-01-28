import mongoose from 'mongoose';

const MaintainerGitSchema = new mongoose.Schema({
  maintainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Maintainer', required: true },
  gitData: { type: String, required: true }
});

export default mongoose.model('MaintainerGit', MaintainerGitSchema);
