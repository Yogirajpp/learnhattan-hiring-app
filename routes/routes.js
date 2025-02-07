import express from 'express';
import { fetchGithubRepo, getAllProjects } from '../controllers/projectContoller.js';
import authRouter from './auth.routes.js';
import { getAllJobs } from '../controllers/Job.js';
import { createCompany, getAllCompanies } from '../services/company.services.js';
import { createJob, getJobById, getJobsByCompany } from '../adminController/Job.js';
import { createWaitlistEntry } from '../controllers/waitListController.js';
import { applyForJob, getCompanyNameById, getUserExpPoint } from '../services/users/user.services.js';
// import { createCompany,getAllCompanies } from '../adminController/Company.js';
// import { createJob,getJobsByCompany,getJobById } from '../adminController/Job.js';
// import { getAllJobs } from '../controller/userController/Job.js';

const router = express.Router();

// User authentication routes
router.use('/auth', authRouter);

router.get('/projects', getAllProjects); // Route to fetch all projects
router.get('/projects/:owner/:repoName', fetchGithubRepo); // Route to fetch a single GitHub repo and save it to MongoDB

// Company Routes
router.get('/getCompanyName/:companyId', getCompanyNameById);

// User Routes
router.get('/getAllJobs', getAllJobs);
router.post('/applyForJob', applyForJob);
router.get('/getUserExp/:userId',getUserExpPoint);


// Admin routes

router.post('/createCompany', createCompany);
router.get('/getCompany', getAllCompanies);

router.post('/createJob', createJob);
router.get('/getJobByCompanyId/:companyId', getJobsByCompany);
router.get('/getJobById/:jobId', getJobById);

router.post('/join', createWaitlistEntry);


export default router;