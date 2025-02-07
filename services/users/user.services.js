import { Company, User } from "../../models/index.js";
import { CustomError } from "../../utils/index.js";
import JobApplication from "../../models/JobApplication.js";
import UserAnalytics from "../../models/UserAnalytics.js";

/**
 * Create a new user in the User model
 * @param {Object} userData - The user data to be created
 * @param {Object} session - Optional session for transactions
 * @returns Newly created user document
 * @throws `CustomError` If user already exists with the same email
 */
export const createUser = async (userData, session = null) => {
  try {
    const existingUser = await User.findOne({ email: userData.email }).session(
      session
    );
    if (existingUser)
      throw new CustomError(
        `User with email ${existingUser.email} already exists`,
        400
      );

    const newUser = new User(userData);

    const validationErrors = newUser.validateSync();
    if (validationErrors) {
      throw new CustomError("Invalid user data", 400, validationErrors?.errors);
    }

    if (session) {
      await newUser.save({ session });
    } else {
      await newUser.save();
    }

    delete newUser._doc.password;

    return newUser;
  } catch (error) {
    if (error instanceof CustomError) throw error;
    throw new CustomError("Failed to create user", 500, error);
  }
};

/**
 * Get all users from the User model, sorted by createdAt
 * @param {Object} options - The options object for filters and pagination
 * @param {Object} options.filters - The options object for filters
 * @param {Object} options.pagination - The options object for pagination (page, limit)
 * @param {Object} options.sort - The options object for sorting by createdAt (`ASC` or `DESC`) or `DESC` by default
 * @returns {Object} List of user object `{ data, totalCount, page, limit }`
 */
export const getAllUsers = async (
  options = { filters: {}, pagination: {}, sort: "DESC" }
) => {
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

    const users = await User.find(filters)
      .select("-password")
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(limit);

    const totalCount = await User.countDocuments(filters);

    return {
      data: users,
      totalCount,
      page: pagination.page,
      limit: pagination.limit,
    };
  } catch (error) {
    throw new CustomError("Failed to get users", 500, error);
  }
};

/**
 * Get a user by their ID from the User model
 * @param {string} userId - The user ID of the user to be fetched
 * @param {boolean} returnPassword - Flag to return password
 * @returns User document
 */
export const getUserById = async (userId, returnPassword = false) => {
  try {
    const user = returnPassword
      ? await User.findById(userId)
      : await User.findById(userId).select("-password");
    return user;
  } catch (error) {
    throw new CustomError(`Failed to get user by ID ${userId}`, 500, error);
  }
};

/**
 * Get a user by their email from the User model
 * @param {string} email - The email of the user to be fetched
 * @param {boolean} returnPassword - Flag to return password
 * @returns User document
 */
export const getUserByEmail = async (email, returnPassword = false) => {
  try {
    const user = returnPassword
      ? await User.findOne({ email })
      : await User.findOne({ email }).select("-password");
    return user;
  } catch (error) {
    throw new CustomError(`Failed to get user with email ${email}`, 500, error);
  }
};

/**
 * Update a user's information in the User model
 * @param {string} userId - The user ID of the user to be updated
 * @param {Object} updateData - The updated data for the user
 * @param {Object} session - Optional session for transactions
 * @returns Updated user document
 */
export const updateUser = async (userId, updateData, session = null) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      session
        ? { session, new: true, select: "-password" }
        : { new: true, select: "-password" }
    );
    if (!updatedUser) throw new CustomError(`User ${userId} not found`, 404);
    return updatedUser;
  } catch (error) {
    if (error instanceof CustomError) throw error;
    throw new CustomError(`Failed to update user by ID ${userId}`, 500, error);
  }
};

/**
 * Update a user's information in the User model
 * @param {string} email - The user email of the user to be updated
 * @param {Object} updateData - The updated data for the user
 * @param {Object} session - Optional session for transactions
 * @returns Updated user document
 */
export const findAndUpdateUser = async (email, updateData, session = null) => {
  try {
    const updatedUser = await User.findOneAndUpdate(
      { email },
      updateData,
      session
        ? { session, new: true, upsert: true, select: "-password" }
        : { new: true, upsert: true, select: "-password" }
    );
    if (!updatedUser) throw new CustomError(`User ${email} not found`, 404);
    return updatedUser;
  } catch (error) {
    if (error instanceof CustomError) throw error;
    throw new CustomError(
      `Failed to update user by email ${email}`,
      500,
      error
    );
  }
};

/**
 * Delete a user from the User model
 * @param {string} userId - The user ID of the user to be deleted
 * @param {Object} session - Optional session for transactions
 * @returns Deleted user document
 */
export const deleteUser = async (userId, session = null) => {
  try {
    const deletedUser = await User.findByIdAndDelete(
      userId,
      session ? { session } : {}
    );
    if (!deletedUser) throw new CustomError(`User ${userId} not found`, 404);
    return deletedUser;
  } catch (error) {
    if (error instanceof CustomError) throw error;
    throw new CustomError(`Failed to delete user by ID ${userId}`, 500, error);
  }
};

export const applyForJob = async (req, res) => {
  try {
    const { userId, jobId } = req.body;

    // Check if the user has already applied for the same job
    const existingApplication = await JobApplication.findOne({ userId, jobId });

    if (existingApplication) {
      return res
        .status(400)
        .json({ message: "You have already applied for this job." });
    }

    // Create a new job application
    const newApplication = new JobApplication({ userId, jobId });
    await newApplication.save();

    res
      .status(201)
      .json({ message: "Job application submitted successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error. Please try again later.", error });
  }
};

export const getCompanyNameById = async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await Company.findById(companyId).select("name");

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({ companyName: company.name });
  } catch (error) {
    console.error("Error fetching company:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserExpPoint = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user analytics by userId
    const userAnalytics = await UserAnalytics.findOne({ userId });

    if (!userAnalytics) {
      return res.status(404).json({ message: "User analytics not found" });
    }

    res.status(200).json({ expPoint: userAnalytics.expPoint });
  } catch (error) {
    console.error("Error fetching user experience points:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
