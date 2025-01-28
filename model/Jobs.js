import mongoose from 'mongoose';

const JobsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  minExp: { type: Number, required: true },
  tags: [{ type: String }]
});

export default mongoose.model('Jobs', JobsSchema);
