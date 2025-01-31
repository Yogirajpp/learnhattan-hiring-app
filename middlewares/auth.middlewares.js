import { EntityTypes } from '../configs/index.js';
import { AuthServices } from '../services/index.js';
import { CustomError } from '../utils/index.js';

/**
 * Extracts the JWT token from the Authorization header
 * @param {Request} req - Express request object
 * @returns {string} The JWT token
 */
export function extractToken(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new CustomError('Authorization header missing or malformed', 401);
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        throw new CustomError('No authorization token provided', 403);
    }

    return token;
}

/**
 * Middleware to verify and authenticate a JWT token
 * @param {Array<string>} allowedRoles - Array of roles that are allowed access
 */
export const verifyAuthToken = (allowedRoles = []) => async (req, res, next) => {
    try {
        const token = extractToken(req);

        const hydratedTokenData = await AuthServices.verifyAndHydrateAuthToken(token, allowedRoles);

        if (!hydratedTokenData) {
            throw new CustomError('Invalid authorization token', 403);
        }

        if (typeof hydratedTokenData._id === 'object') {
            hydratedTokenData._id = hydratedTokenData._id.toString();
        }
        req.user = hydratedTokenData;
        next();
    } catch (error) {
        next(error instanceof CustomError ? error : new CustomError('Authorization check failed', 500, error));
    }
};

/**
 * Middleware to check optional authorization and hydrate the user object if token is present
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const token = extractToken(req)
        if (!token) {
            next();
            return;
        }

        const hydratedTokenData = await AuthServices.verifyAndHydrateAuthToken(token);
        if (!hydratedTokenData) {
            throw new CustomError('Invalid authorization token', 403);
        }

        if (typeof hydratedTokenData._id === 'object') {
            hydratedTokenData._id = hydratedTokenData._id.toString();
        }

        req.user = hydratedTokenData;
        next();
    } catch {
        next();
    }
}

/**
 * Middleware to check if the current user is an admin
 */
export const isAdmin = (req, res, next) => {
    try {
        if (req.user?.role !== EntityTypes.ADMIN) {
            throw new CustomError('Admin access required', 403);
        }
        next();
    } catch (error) {
        next(error instanceof CustomError ? error : new CustomError('Authorization check failed', 500, error));
    }
};

/**
 * Middleware to check if the authenticated user matches a specific ID
 * @param {string} idParam - The name of the request parameter containing the ID
 */
export const isSelfOrAdmin = (idParam = 'id') => (req, res, next) => {
    try {
        const entityId = req.params[idParam];
        if (req.user.role !== EntityTypes.ADMIN && req.user._id !== entityId) {
            throw new CustomError('Unauthorized access', 403);
        }
        next();
    } catch (error) {
        next(error);
    }
};
