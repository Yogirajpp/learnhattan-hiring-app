import mongoose from 'mongoose';

const ProjectsSchema = new mongoose.Schema({
  maintainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Maintainer' },
  name: { type: String, required: true },
  content: { type: String, required: true },
  gitLink: { type: String, required: true },
  status: { type: String, enum: ['active', 'completed', 'pending'], required: true },
  expRange: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
  },
});

export default mongoose.model('Projects', ProjectsSchema);
