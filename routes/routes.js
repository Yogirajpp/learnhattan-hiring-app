import express from 'express';
import { fetchGithubRepo, getAllProjects } from '../controllers/projectContoller.js';
import authRouter from './auth.routes.js';

const router = express.Router();

// User authentication routes
router.use('/auth', authRouter);

router.get('/projects', getAllProjects); // Route to fetch all projects
router.get('/projects/:owner/:repoName', fetchGithubRepo); // Route to fetch a single GitHub repo and save it to MongoDB

export default router;