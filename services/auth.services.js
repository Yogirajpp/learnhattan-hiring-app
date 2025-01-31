import axios from 'axios';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { COMPANY_STATUSES, EntityTypes } from '../configs/index.js';
import { CustomError } from '../utils/index.js';
import { AdminServices, CompanyServices, UserServices } from './index.js';

const SECRET_KEY = process.env.JWT_SECRET || 'secret';
const GITHUB_OAUTH_CLIENT_ID = process.env.GITHUB_OAUTH_CLIENT_ID || '';
const GITHUB_OAUTH_CLIENT_SECRET = process.env.GITHUB_OAUTH_CLIENT_SECRET || '';

/**
 * Hash password
 * @param {string} password - The password to be hashed
 * @returns {string} The hashed password
 */
export const hashPassword = async (password) => {
  try {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new CustomError("Failed to hash password", 500, error);
  }
};

/**
 * Validate the user's password
 * @param {string} inputPassword - The password to be validated
 * @param {string} storedPassword - The stored password
 * @returns {boolean} True if the password is valid, false otherwise
 */
export const validatePassword = async (inputPassword, storedPassword) => {
  try {
    return await bcrypt.compare(inputPassword, storedPassword);
  } catch (error) {
    throw new CustomError("Failed to validate password", 500, error);
  }
};

/**
 * Generate JWT token
 * @param {jwtPayload} jwtPayload - The jwt payload to be used to generate the token
 * @param {string} expiresIn - Expiration time for the token (default: 1h)
 * @returns {string} The generated token
 */
export const generateToken = (jwtPayload, expiresIn = '1h') => {
  try {
    return jwt.sign(jwtPayload, SECRET_KEY, { expiresIn, algorithm: 'HS256' });
  } catch (error) {
    throw new CustomError("Failed to generate token", 500, error);
  }
};

/**
 * Decode JWT token
 * @param {string} token - The token to be decoded
 * @returns The decoded token data
 */
export const decodeToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    throw new CustomError('Invalid or expired token', 403, error);
  }
};

/**
 * Create authorization token for user, company, or admin
 * @param {string} id - The entity's ID
 * @param {string} entity - The entity type (`USER`, `COMPANY`, `ADMIN`)
 * @returns {string} The generated token
 * @throws `CustomError` If entity not found
 * @throws `CustomError` If token generation fails
 */
export const generateAuthToken = async (_id, entity) => {
  try {
    let entityData;
    switch (entity) {
      case EntityTypes.USER:
        entityData = await UserServices.getUserById(_id);
        break;

      case EntityTypes.COMPANY:
        entityData = await CompanyServices.getCompanyById(_id);
        break;

      case EntityTypes.ADMIN:
        entityData = await AdminServices.getAdminById(_id);
        break;

      default:
        throw new CustomError('Invalid entity type', 400);
    }

    if (!entityData) {
      throw new CustomError(`${entity} not found`, 404);
    }

    const jwtPayload = { _id: entityData._id.toString(), email: entityData.email, name: entityData.name, role: entity };
    const token = generateToken(jwtPayload);
    if (!token) {
      throw new CustomError('Failed to generate auth token', 500);
    }

    return token;
  } catch (error) {
    if (error instanceof CustomError) throw error;
    throw new CustomError('Failed to generate auth token', 500, error);
  }
};

/**
 * Verify and hydrate auth token
 * @param {string} token - JWT token to be verified
 * @param {Array} allowedRoles - Array of allowed roles for the token
 * @returns {Object} The entity data and role
 * @throws `CustomError` If token is invalid or expired
 * @throws `CustomError` If required roles are not present
 * @throws `CustomError` If entity type is invalid or entity data is not found
 */
export const verifyAndHydrateAuthToken = async (token, allowedRoles = []) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded._id || !decoded.role) {
      throw new CustomError('Invalid authorization token', 403);
    }
    const { _id, role } = decoded;

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      throw new CustomError('Access denied: insufficient privileges', 403);
    }

    let entityData;
    switch (role) {
      case EntityTypes.USER:
        entityData = await UserServices.getUserById(_id);
        break;

      case EntityTypes.COMPANY:
        entityData = await CompanyServices.getCompanyById(_id);
        break;

      case EntityTypes.ADMIN:
        entityData = await AdminServices.getAdminById(_id);
        break;

      default:
        throw new CustomError('Invalid entity type', 400);
    }

    if (!entityData) {
      throw new CustomError(`${role} not found`, 404);
    }

    switch (role) {
      case EntityTypes.COMPANY:
        if (entityData.status === COMPANY_STATUSES.PENDING) {
          throw new CustomError('Company account is not approved', 401);
        } else if (entityData.status === COMPANY_STATUSES.BLOCKED) {
          throw new CustomError('Company account is blocked', 401);
        } else if (entityData.status !== COMPANY_STATUSES.APPROVED) {
          throw new CustomError('Company account status is invalid', 401);
        }
        break;
      default:
        break;
    }

    return { ...entityData.toObject(), role };
  } catch (error) {
    if (error instanceof CustomError) throw error;
    throw new CustomError('Authentication failed', 500, error);
  }
}

/**
 * Get Github OAuth token
 * @param {string} code - Github OAuth code
 * @returns {Object} The OAuth token data
 * @throws `CustomError` If token generation fails
 */
export const getGithubOathToken = async ({
  code,
  redirect_uri
}) => {
  const rootUrl = 'https://github.com/login/oauth/access_token';
  const options = {
    client_id: GITHUB_OAUTH_CLIENT_ID,
    client_secret: GITHUB_OAUTH_CLIENT_SECRET,
    code,
    redirect_uri,
  };

  try {
    const { data } = await axios.post(
      rootUrl,
      options,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    return data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      throw new CustomError('Invalid Github OAuth code', 401);
    } else if (error.response && error.response.data) {
      throw new CustomError('Failed to get Github OAuth token', error.response.status, error.response.data);
    } else {
      throw new CustomError('Failed to get Github OAuth token', 500, error);
    }
  }
};

/**
 * Get Github user data
 * @param {string} access_token - Github OAuth access token
 * @returns {Object} The Github user data
 * @throws `Error` If API request fails
 * @throws `CustomError` If user data is not found
 * @throws `CustomError` If user data is invalid
 */
export const getGithubUser = async ({
  access_token,
}) => {
  try {
    const { data } = await axios.get(
      'https://api.github.com/user',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    return data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new CustomError('User not found', 404);
    } else if (error.response && error.response.status === 401) {
      throw new CustomError('Invalid access token', 401);
    } else if (error.response && error.response.status === 403) {
      throw new CustomError('Access denied', 403);
    } else {
      throw new CustomError('Failed to get Github user data', 500, error);
    }
  }
};