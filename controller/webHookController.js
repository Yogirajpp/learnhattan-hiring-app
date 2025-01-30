import express from 'express';
import Projects from '../model/Projects.js';
// import { getProjectIssues } from '../controller/projectController.js';
import NodeCache from 'node-cache';
import { getProjectIssues } from './projectContoller.js';

const cache = new NodeCache();

export const webhookHandler = (io) => {
  const router = express.Router();

  router.post('/github-webhook', async (req, res) => {
    const eventType = req.headers['x-github-event'];
    const payload = req.body;

    if (['issues', 'push', 'pull_request'].includes(eventType)) {
      const { repository } = payload;
      if (!repository) return res.status(400).send('Invalid payload');

      try {
        const project = await Projects.findOne({ gitLink: repository.html_url });
        if (!project) return res.status(404).send('Project not found');

        const updatedIssues = await getProjectIssues(project._id);
        cache.set(`issues_${project._id}`, updatedIssues);
        io.to(`project_${project._id}`).emit('updateProjectIssues', { projectId: project._id, issues: updatedIssues });

        return res.status(200).send('Webhook processed');
      } catch {
        return res.status(500).send('Internal Server Error');
      }
    }

    res.status(200).send('Webhook received');
  });

  return router;
};
