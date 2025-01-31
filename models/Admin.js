import mongoose from 'mongoose';
import { ADMIN_ROLES } from '../configs/index.js';

/**
 * `Admin` Schema
 */
const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: Object.values(ADMIN_ROLES),
    default: ADMIN_ROLES.ADMIN,
  }
}, { timestamps: true });

// Index for faster search on email
adminSchema.index({ email: 1 });

/**
 * `Admin` model for admin collection
 */
const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
