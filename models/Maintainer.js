import mongoose from 'mongoose';

const MaintainerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  gitIntegration: { type: String, required: true }
});

export default mongoose.model('Maintainer', MaintainerSchema);

