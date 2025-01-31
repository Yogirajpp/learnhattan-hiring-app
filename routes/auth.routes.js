import express from 'express';
import { EntityTypes } from '../configs/index.js';
import { getMe, githubOauthHandler, loginAdmin, loginCompany, loginUser, registerAdmin, registerCompany, registerUser } from '../controllers/index.js';
import { rateLimiter, verifyAuthToken } from '../middlewares/index.js';

const authRouter = express.Router();

// User authentication routes
authRouter.post('/user/register', rateLimiter(3, 10 * 60 * 1000), registerUser);
authRouter.post('/user/login', loginUser);

// Company authentication routes
authRouter.post('/company/register', rateLimiter(3, 10 * 60 * 1000), registerCompany);
authRouter.post('/company/login', loginCompany);

// Admin authentication routes
authRouter.post('/admin/register', rateLimiter(3, 10 * 60 * 1000), verifyAuthToken([EntityTypes.ADMIN]), registerAdmin);
authRouter.post('/admin/login', loginAdmin);

// OAuth routes
authRouter.post('/oauth/github', githubOauthHandler);

authRouter.get('/me', verifyAuthToken(), getMe);

export default authRouter;
