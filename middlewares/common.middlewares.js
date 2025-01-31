import { EntityTypes } from '../configs/constants.configs.js';
import { CompanyServices, UserServices } from '../services/index.js';
import { createResponse, CustomError, LogError } from '../utils/index.js';

/**
 * Middleware to handle errors.
 * @param {Error} err - The error object
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Object} next - The next middleware function
 * @returns {Object} Response object
 */
export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const error = process.env.NODE_ENV === 'development' ? err.stack || err : {};

    LogError(err);

    res.status(statusCode).json(createResponse(statusCode, message).error(error));
}

/**
 * Middleware to rate-limit requests
 * @param {number} limit - Max number of requests allowed per IP.
 * @param {number} timeWindow - Time window in milliseconds.
 */
export const rateLimiter = (limit = 100, timeWindow = 60000) => {
    const ipRequestCounts = new Map();

    return (req, res, next) => {
        try {
            const clientIp = req.ip;
            const currentTime = Date.now();

            const requestInfo = ipRequestCounts.get(clientIp) || { count: 0, lastRequestTime: currentTime };
            if (currentTime - requestInfo.lastRequestTime > timeWindow) {
                requestInfo.count = 0;
                requestInfo.lastRequestTime = currentTime;
            }

            requestInfo.count += 1;
            ipRequestCounts.set(clientIp, requestInfo);

            if (requestInfo.count > limit) {
                throw new CustomError(`Request limit exceeded. Try again in ${Math.ceil((timeWindow - (currentTime - requestInfo.lastRequestTime)) / 1000)} seconds`, 429);
            }

            next();
        } catch (error) {
            next(error instanceof CustomError ? error : new CustomError('Rate limiting failed', 500, error));
        }
    };
};

/**
 * Middleware to check if the authenticated user matches with the entity or is an admin
 * @param {string} paramName - The name of the request parameter containing the ID
 */
export const isOwnerOrAdmin = (entity, paramName = 'id') => async (req, res, next) => {
    try {
        if (!req.user) {
            throw new CustomError('Unauthorized access', 403);
        }

        if (req.user.role === EntityTypes.ADMIN) {
            next();
            return;
        } else if (req.user.role === entity) {
            let id = '';
            if (req.params[paramName]) {
                id = req.params[paramName];
            } else if (req.body[paramName]) {
                id = req.body[paramName];
            } else if (req.query[paramName]) {
                id = req.query[paramName];
            } else {
                throw new CustomError(`${entity} ID not found in request with parameter name ${paramName}`, 400, req);
            }

            let entityData;

            switch (entity) {
                case EntityTypes.USER:
                    entityData = await UserServices.getUserById(id);
                    break;
                case EntityTypes.COMPANY:
                    entityData = await CompanyServices.getCompanyById(id);
                    break;
                default:
                    throw new CustomError(`Invalid entity type ${entity}`, 400);
            }

            if (!entityData) {
                throw new CustomError(`${entity} not found with ID ${id}`, 404);
            }

            const owner = entityData._id.toString();
            if (req.user._id !== owner) {
                throw new CustomError('Unauthorized access', 403);
            }
            next();
        } else {
            throw new CustomError('Unauthorized access', 403);
        }
    } catch (error) {
        next(error);
    }
};