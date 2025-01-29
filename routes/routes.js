import express from 'express';
import { getAllProjects } from '../controller/projectContoller.js';

const router = express.Router();

router.get('/api/projects', getAllProjects);

export default router;