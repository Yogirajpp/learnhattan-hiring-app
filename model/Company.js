import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  status: { type: String, enum: ['approved', 'rejected', 'pending'], required: true },
  website: { type: String, required: true }
});

export default mongoose.model('Company', CompanySchema);
