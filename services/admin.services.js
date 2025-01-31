import { Admin } from '../models/index.js';
import { CustomError } from '../utils/index.js';

/**
 * Create a new admin in the Admin model
 * @param {Object} adminData - The admin data to be created
 * @param {Object} session - Optional session for transactions
 * @returns Newly created admin document
 * @throws `CustomError` If admin already exists with the same email
 */
export const createAdmin = async (adminData, session = null) => {
  try {
    const existingAdmin = await Admin.findOne({ email: adminData.email }).session(session);
    if (existingAdmin) throw new CustomError(`Admin with email ${existingAdmin.email} already exists`, 400);

    const newAdmin = new Admin(adminData);

    const validationErrors = newAdmin.validateSync();
    if (validationErrors) {
      throw new CustomError('Invalid admin data', 400, validationErrors?.errors);
    }

    if (session) {
      await newAdmin.save({ session });
    } else {
      await newAdmin.save();
    }

    delete newAdmin._doc.password;

    return newAdmin;
  } catch (error) {
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to create admin', 500, error);
  }
};

/**
 * Get all admins from the Admin model, sorted by createdAt
 * @param {Object} options - The options object for filters and pagination
 * @param {Object} options.filters - The options object for filters
 * @param {Object} options.pagination - The options object for pagination (page, limit)
 * @param {Object} options.sort - The options object for sorting by createdAt (`ASC` or `DESC`) or `DESC` by default
 * @returns {Object} List of admin object `{ data, totalCount, page, limit }`
 */
export const getAllAdmins = async (options = { filters: {}, pagination: {}, sort: "DESC" }) => {
  try {
    let { filters, pagination, sort } = options;
    if (!filters) {
      filters = {};
    }
    if (!pagination) {
      pagination = { page: 0, limit: 0 };
    }
    if (!sort) {
      sort = "DESC";
    }

    const { page, limit } = pagination;
    const skip = page * limit;
    const sortOrder = sort === "ASC" ? 1 : -1;

    const admins = await Admin.find(filters)
      .select('-password')
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(limit);

    const totalCount = await Admin.countDocuments(filters);

    return { data: admins, totalCount, page: pagination.page, limit: pagination.limit };
  } catch (error) {
    throw new CustomError('Failed to get admins', 500, error);
  }
};

/**
 * Get an admin by their ID from the Admin model
 * @param {string} adminId - The admin ID of the admin to be fetched
 * @param {boolean} returnPassword - Flag to return password
 * @returns Admin document
 */
export const getAdminById = async (adminId, returnPassword = false) => {
  try {
    const admin = returnPassword ? await Admin.findById(adminId) : await Admin.findById(adminId).select('-password');
    return admin;
  } catch (error) {
    throw new CustomError(`Failed to get admin by ID ${adminId}`, 500, error);
  }
};

/**
 * Get an admin by their email from the Admin model
 * @param {string} email - The email of the admin to be fetched
 * @param {boolean} returnPassword - Flag to return password
 * @returns Admin document
 */
export const getAdminByEmail = async (email, returnPassword = false) => {
  try {
    const admin = returnPassword ? await Admin.findOne({ email }) : await Admin.findOne({ email }).select('-password');
    return admin;
  } catch (error) {
    throw new CustomError(`Failed to get admin with email ${email}`, 500, error);
  }
};

/**
 * Update an admin's information in the Admin model
 * @param {string} adminId - The admin ID of the admin to be updated
 * @param {Object} updateData - The updated data for the admin
 * @param {Object} session - Optional session for transactions
 * @returns Updated admin document
 */
export const updateAdmin = async (adminId, updateData, session = null) => {
  try {
    const updatedAdmin = await Admin.findByIdAndUpdate(adminId, updateData, session ? { session, new: true, select: '-password' } : { new: true, select: '-password' });
    if (!updatedAdmin) throw new CustomError(`Admin ${adminId} not found`, 404);
    return updatedAdmin;
  } catch (error) {
    if (error instanceof CustomError) throw error;
    throw new CustomError(`Failed to update admin by ID ${adminId}`, 500, error);
  }
};

/**
 * Delete an admin from the Admin model
 * @param {string} adminId - The admin ID of the admin to be deleted
 * @param {Object} session - Optional session for transactions
 * @returns Deleted admin document
 */
export const deleteAdmin = async (adminId, session = null) => {
  try {
    const deletedAdmin = await Admin.findByIdAndDelete(adminId, session ? { session } : {});
    if (!deletedAdmin) throw new CustomError(`Admin ${adminId} not found`, 404);
    return deletedAdmin;
  } catch (error) {
    if (error instanceof CustomError) throw error;
    throw new CustomError(`Failed to delete admin by ID ${adminId}`, 500, error);
  }
};