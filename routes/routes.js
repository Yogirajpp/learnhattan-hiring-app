import express from 'express';
import { fetchGithubRepo, getAllProjects } from '../controller/projectContoller.js';
import { createCompany,getAllCompanies } from '../controller/adminController/Company.js';
import { createJob,getJobsByCompany,getJobById } from '../controller/adminController/Job.js';
import { getAllJobs } from '../controller/userController/Job.js';

const router = express.Router();

router.get('/projects', getAllProjects); // Route to fetch all projects
router.get('/projects/:owner/:repoName', fetchGithubRepo); // Route to fetch a single GitHub repo and save it to MongoDB


// User Routes

router.get('/getAllJobs', getAllJobs);


// Admin routes

router.post('/createCompany', createCompany);
router.get('/getCompany', getAllCompanies);

router.post('/createJob', createJob);
router.get('/getJobByCompanyId/:companyId', getJobsByCompany);
router.get('/getJobById/:jobId', getJobById);

export default router;