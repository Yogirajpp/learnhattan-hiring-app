import express from 'express';
import { fetchGithubRepo, getAllProjects } from '../controllers/projectContoller.js';
import authRouter from './auth.routes.js';
import { getAllJobs } from '../controllers/Job.js';
import { createCompany, getAllCompanies } from '../services/company.services.js';
import { createJob, getJobById, getJobsByCompany } from '../adminController/Job.js';
// import { createCompany,getAllCompanies } from '../adminController/Company.js';
// import { createJob,getJobsByCompany,getJobById } from '../adminController/Job.js';
// import { getAllJobs } from '../controller/userController/Job.js';
import { createWaitlistEntry, getWaitlistEntries } from '../controller/waitListController.js';

const router = express.Router();

// User authentication routes
router.use('/auth', authRouter);

router.get('/projects', getAllProjects); // Route to fetch all projects
router.get('/projects/:owner/:repoName', fetchGithubRepo); // Route to fetch a single GitHub repo and save it to MongoDB

export default router;