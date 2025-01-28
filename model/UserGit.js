import mongoose from 'mongoose';

const UserGitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gitData: { type: String, required: true }
});

export default mongoose.model('UserGit', UserGitSchema);
