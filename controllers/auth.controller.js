
import mongoose from 'mongoose';
import { AUTH_PROVIDERS, COMPANY_STATUSES, EntityTypes } from '../configs/index.js';
import { AdminServices, AuthServices, CompanyServices, UserServices } from '../services/index.js';
import { createResponse, CustomError } from '../utils/index.js';
import User from '../models/User.js';

/**
 * User registration controller
 */
export const registerUser = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { name, email, password, bio, avatar, skills, socials } = req.body;

        // Hash the password
        const hashedPassword = await AuthServices.hashPassword(password);

        // Create the user
        const user = await UserServices.createUser({ name, email, password: hashedPassword, bio, avatar, skills, socials }, session);
        if (!user) throw new CustomError('Failed to create user', 400);

        // Commit the transaction
        await session.commitTransaction();

        // Generate user auth token
        const authToken = await AuthServices.generateAuthToken(user._id, EntityTypes.USER);
        if (!authToken) throw new CustomError('Failed to generate auth token', 400);

        // Return the auth token and user data
        res.status(201).json(createResponse(201, "User successfully registered", { token: authToken, _id: user._id, name: user.name, email: user.email }).success());
    } catch (error) {
        // Rollback the transaction
        await session.abortTransaction();

        next(error);
    } finally {
        session.endSession();
    }
};

/**
 * User login controller
 */
export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Get user by email
        const user = await UserServices.getUserByEmail(email, true);
        if (!user) throw new CustomError('Invalid email or password', 401);

        // Validate the user's password
        const isValidPassword = await AuthServices.validatePassword(password, user.password);
        if (!isValidPassword) throw new CustomError('Invalid email or password', 401);

        // Generate user auth token
        const authToken = await AuthServices.generateAuthToken(user._id, EntityTypes.USER);
        if (!authToken) throw new CustomError('Failed to generate auth token', 500);

        // Return the auth token
        res.status(200).json(createResponse(200, "Login successful", { token: authToken }).success());
    } catch (error) {
        next(error);
    }
};

/**
 * Company registration controller
 */
export const registerCompany = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { name, email, password, avatar, description, website, socials } = req.body;

        // Hash the password
        const hashedPassword = await AuthServices.hashPassword(password);

        // Create the company
        const company = await CompanyServices.createCompany({ name, email, password: hashedPassword, avatar, description, website, socials }, session);
        if (!company) throw new CustomError('Failed to create company', 400);

        // Commit the transaction
        await session.commitTransaction();

        // Generate company auth token
        const authToken = await AuthServices.generateAuthToken(company._id, EntityTypes.COMPANY);
        if (!authToken) throw new CustomError('Failed to generate auth token', 400);

        // Return the auth token and company data
        res.status(201).json(createResponse(201, "Company successfully registered", { token: authToken, _id: company._id, name: company.name, email: company.email }).success());
    } catch (error) {
        // Rollback the transaction
        await session.abortTransaction();

        next(error);
    } finally {
        session.endSession();
    }
};

/**
 * Company login controller
 */
export const loginCompany = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Get company by email
        const company = await CompanyServices.getCompanyByEmail(email, true);
        if (!company) throw new CustomError('Invalid email or password', 401);

        // Validate the company's password
        const isValidPassword = await AuthServices.validatePassword(password, company.password);
        if (!isValidPassword) throw new CustomError('Invalid email or password', 401);

        // Check the company's status
        if (company.status !== COMPANY_STATUSES.APPROVED) throw new CustomError('Company account is not approved', 401);

        // Generate company auth token
        const authToken = await AuthServices.generateAuthToken(company._id, EntityTypes.COMPANY);
        if (!authToken) throw new CustomError('Failed to generate auth token', 500);

        // Return the auth token
        res.status(200).json(createResponse(200, "Login successful", { token: authToken }).success());
    } catch (error) {
        next(error);
    }
}

/**
 * Admin registration controller
 */
export const registerAdmin = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { email, password } = req.body;

        // Hash the password
        const hashedPassword = await AuthServices.hashPassword(password);

        // Create the admin
        const admin = await AdminServices.createAdmin({ email, password: hashedPassword }, session);
        if (!admin) throw new CustomError('Failed to create admin', 400);

        // Commit the transaction
        await session.commitTransaction();

        // Generate admin auth token
        const authToken = await AuthServices.generateAuthToken(admin._id, EntityTypes.ADMIN, session);
        if (!authToken) throw new CustomError('Failed to generate auth token', 400);

        // Return the auth token and admin data
        res.status(201).json(createResponse(201, "Admin successfully registered", { token: authToken, _id: admin._id, name: admin.name, email: admin.email }).success());
    } catch (error) {
        // Rollback the transaction
        await session.abortTransaction();

        next(error);
    } finally {
        session.endSession();
    }
};

/**
 * Admin login controller
 */
export const loginAdmin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Get admin by email
        const admin = await AdminServices.getAdminByEmail(email, true);
        if (!admin) throw new CustomError('Invalid email or password', 401);

        // Validate the admin's password
        const isValidPassword = await AuthServices.validatePassword(password, admin.password);
        if (!isValidPassword) throw new CustomError('Invalid email or password', 401);

        // Generate admin auth token
        const authToken = await AuthServices.generateAuthToken(admin._id, EntityTypes.ADMIN);
        if (!authToken) throw new CustomError('Failed to generate auth token', 500);

        // Return the auth token
        res.status(200).json(createResponse(200, "Login successful", { token: authToken }).success());
    } catch (error) {
        next(error);
    }
};

/**
 * Get user profile controller
 */
export const getMe = async (req, res, next) => {
    try {
        // Get the user from the request object
        const user = req.user;

        if (!user) throw new CustomError('Authentication required', 401);

        if (user.role === EntityTypes.COMPANY) {
            // Get the company profile
            const company = await CompanyServices.getCompanyById(user._id);
            if (!company) throw new CustomError('Company not found', 404);

            // Check the company's status
            if (company.status !== COMPANY_STATUSES.APPROVED) throw new CustomError('Company account is not approved', 401);
        }

        // Return the user data
        res.status(200).json(createResponse(200, "User profile retrieved successfully", user).success());
    } catch (error) {
        next(error);
    }
};

/**
 * Github OAuth handler controller
 */
export const githubOauthHandler = async (req, res, next) => {
    try {
        const { code, redirect_uri } = req.body;

        if (!code) {
            throw new CustomError('Authorization code not provided', 401);
        }

        // Get GitHub access token
        const { access_token } = await AuthServices.getGithubOathToken({ code, redirect_uri });

        // Get user details from GitHub
        const { email, avatar_url, login } = await AuthServices.getGithubUser({ access_token });

        let user = await UserServices.getUserByEmail(email);
        const isNewUser = !user;

        // Create or update the user
        user = await UserServices.findAndUpdateUser(email, {
            avatar: avatar_url,
            name: login,
            email,
            provider: isNewUser ? AUTH_PROVIDERS.GITHUB : user.provider,
            githubAccessToken: access_token,
        });


        // Generate authentication token
        const authToken = await AuthServices.generateAuthToken(user._id, EntityTypes.USER);
        if (!authToken) throw new CustomError('Failed to generate auth token', 400);

        res.status(200).json(createResponse(200, "User successfully authenticated", {
            token: authToken,
            _id: user._id,
            name: user.name,
            email: user.email,
            isNewUser
        }).success());

    } catch (error) {
        console.error(error);
        next(error);
    }
};
