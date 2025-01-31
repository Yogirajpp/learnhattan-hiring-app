import { Company } from '../models/index.js';
import { CustomError } from '../utils/index.js';

/**
 * Create a new company in the Company model
 * @param {Object} companyData - The company data to be created
 * @param {Object} session - Optional session for transactions
 * @returns Newly created company document
 * @throws `CustomError` If a company with the same email already exists
 */
export const createCompany = async (companyData, session = null) => {
    try {
        const existingCompany = await Company.findOne({ email: companyData.email }).session(session);
        if (existingCompany) throw new CustomError(`Company with email ${existingCompany.email} already exists`, 400);

        const newCompany = new Company(companyData);

        const validationErrors = newCompany.validateSync();
        if (validationErrors) {
            throw new CustomError('Invalid company data', 400, validationErrors?.errors);
        }

        if (session) {
            await newCompany.save({ session, select: '-password' });
        } else {
            await newCompany.save({ select: '-password' });
        }

        delete newCompany._doc.password;

        return newCompany;
    } catch (error) {
        if (error instanceof CustomError) throw error;
        throw new CustomError('Failed to create company', 500, error);
    }
};

/**
 * Get all companies from the Company model, sorted by createdAt
 * @param {Object} options - The options object for filters and pagination
 * @param {Object} options.filters - The options object for filters
 * @param {Object} options.pagination - The options object for pagination (page, limit)
 * @param {Object} options.sort - The options object for sorting by createdAt (`ASC` or `DESC`) or `DESC` by default
 * @returns {Object} List of companies `{ data, totalCount, page, limit }`
 */
export const getAllCompanies = async (options = { filters: {}, pagination: {}, sort: "DESC" }) => {
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

        const companies = await Company.find(filters)
            .select('-password')
            .sort({ createdAt: sortOrder })
            .skip(skip)
            .limit(limit);

        const totalCount = await Company.countDocuments(filters);

        return { data: companies, totalCount, page: pagination.page, limit: pagination.limit };
    } catch (error) {
        throw new CustomError('Failed to get companies', 500, error);
    }
};

/**
 * Get a company by their ID from the Company model
 * @param {string} companyId - The company ID of the company to be fetched
 * @param {boolean} returnPassword - Flag to return password
 * @returns Company document
 */
export const getCompanyById = async (companyId, returnPassword = false) => {
    try {
        const company = returnPassword ? await Company.findById(companyId) : await Company.findById(companyId).select('-password');
        return company;
    } catch (error) {
        throw new CustomError(`Failed to get company by ID ${companyId}`, 500, error);
    }
};

/**
 * Get a company by their email from the Company model
 * @param {string} email - The email of the company to be fetched
 * @param {boolean} returnPassword - Flag to return password
 * @returns Company document
 */
export const getCompanyByEmail = async (email, returnPassword = false) => {
    try {
        const company = returnPassword ? await Company.findOne({ email }) : await Company.findOne({ email }).select('-password');
        return company;
    } catch (error) {
        throw new CustomError(`Failed to get company with email ${email}`, 500, error);
    }
};

/**
 * Update a company's information in the Company model
 * @param {string} companyId - The company ID of the company to be updated
 * @param {Object} updateData - The updated data for the company
 * @param {Object} session - Optional session for transactions
 * @returns Updated company document
 */
export const updateCompany = async (companyId, updateData, session = null) => {
    try {
        const updatedCompany = await Company.findByIdAndUpdate(companyId, updateData, session ? { session, new: true, select: '-password' } : { new: true, select: '-password' });
        if (!updatedCompany) throw new CustomError(`Company ${companyId} not found`, 404);
        return updatedCompany;
    } catch (error) {
        if (error instanceof CustomError) throw error;
        throw new CustomError(`Failed to update company by ID ${companyId}`, 500, error);
    }
};

/**
 * Delete a company from the Company model
 * @param {string} companyId - The company ID of the company to be deleted
 * @param {Object} session - Optional session for transactions
 * @returns Deleted company document
 */
export const deleteCompany = async (companyId, session = null) => {
    try {
        const deletedCompany = await Company.findByIdAndDelete(companyId, session ? { session } : {});
        if (!deletedCompany) throw new CustomError(`Company ${companyId} not found`, 404);
        return deletedCompany;
    } catch (error) {
        if (error instanceof CustomError) throw error;
        throw new CustomError(`Failed to delete company by ID ${companyId}`, 500, error);
    }
};
