import mongoose from 'mongoose';
import { COMPANY_STATUSES } from '../configs/index.js';

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  description: { type: String, default: '' },
  status: { type: String, enum: Object.values(COMPANY_STATUSES), default: COMPANY_STATUSES.PENDING },
  website: { type: String, default: '' },
  socials: [
    {
      label: { type: String },
      link: { type: String },
    },
  ],
}, { timestamps: true });

// Index for faster search on email
companySchema.index({ email: 1 });
// Index for faster filtering on status
companySchema.index({ status: 1 });

const Company = mongoose.model('Company', companySchema);

export default Company;
