import mongoose from 'mongoose';

const JobsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  minExp: { type: Number, required: true },
  tags: [{ type: String }],
  jobType: { type: String, enum: ['remote', 'on-site', 'hybrid'], required: true },
  location: { type: String, required: true },
  isActive: { type: Boolean, default: false } 
});

export default mongoose.model('Jobs', JobsSchema);
