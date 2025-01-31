/**
 * @extends Error
 * @construct
 * @param {string} message - Error message
 * @param {number} statusCode - Error status code
 * @param {object} error - Error object
 * @returns {object} Error object
 */
export class CustomError extends Error {
    constructor(message, statusCode, error) {
        super(message);
        this.statusCode = statusCode;
        this.error = error;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * @param {object} error - Error object
 * @returns {void}
 */
export const LogError = (error) => {
    if (process.env.NODE_ENV === 'development') {
        console.error(error);
    }
}

/**
 * Create a response object
 * @param {number} statusCode - Status code
 * @param {string} message - Response message
 * @param {object} data - Response data
 * @returns {object} Response object
 */
export function createResponse(statusCode, message, data) {
    const response = {
        success: true,
        statusCode,
        message,
        data,
        error: null,
    };

    return {
        success: () => (
            response
        ),
        error: (error) => ({
            ...response,
            success: false,
            data: data || null,
            error,
        }),
    }
}