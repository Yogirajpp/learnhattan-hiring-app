import express from 'express';
import { fetchGithubRepo, getAllProjects } from '../controller/projectContoller.js';
import { createWaitlistEntry, getWaitlistEntries } from '../controller/waitListController.js';

const router = express.Router();

router.get('/projects', getAllProjects); // Route to fetch all projects
router.get('/projects/:owner/:repoName', fetchGithubRepo); // Route to fetch a single GitHub repo and save it to MongoDB
    
router.post('/join', createWaitlistEntry);
router.get('/entries', getWaitlistEntries);
  
export default router;