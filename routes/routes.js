import express from 'express';
import { fetchGithubRepo, getAllProjects } from '../controller/projectContoller.js';

const router = express.Router();

router.get('/projects', getAllProjects); // Route to fetch all projects
router.get('/projects/:owner/:repoName', fetchGithubRepo); // Route to fetch a single GitHub repo and save it to MongoDB

export default router;