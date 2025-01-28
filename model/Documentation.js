import mongoose from 'mongoose';

const DocumentationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  versionContentUpdates: [{
    version: { type: String },
    content: { type: String },
    updatedAt: { type: Date, default: Date.now }
  }]
});

export default mongoose.model('Documentation', DocumentationSchema);
