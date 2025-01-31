import express from 'express';
import Projects from '../models/Projects.js';
import { getProjectIssues } from './projectContoller.js';
import NodeCache from 'node-cache';

const cache = new NodeCache();

export const webhookHandler = (io) => {
  const router = express.Router();

  router.post('/github-webhook', async (req, res) => {
    const eventType = req.headers['x-github-event'];
    const payload = req.body;

    console.log(`Received GitHub webhook event: ${eventType}`);

    if (eventType === 'issues' || eventType === 'push' || eventType === 'pull_request') {
      const { repository } = payload;

      if (!repository) {
        return res.status(400).send('Invalid payload');
      }

      try {
        // Find the project in DB using GitHub repo link
        const project = await Projects.findOne({ gitLink: repository.html_url });

        if (!project) {
          console.log(`Project not found for repo: ${repository.html_url}`);
          return res.status(404).send('Project not found');
        }

        console.log(`Fetching updated issues for project: ${project.name}`);

        // Fetch latest issues from GitHub API
        const updatedIssues = await getProjectIssues(project._id);

        // Update cache with latest issues
        cache.set(`issues_${project._id}`, updatedIssues);

        // Notify all connected clients in this project's room
        io.to(`project_${project._id}`).emit('updateProjectIssues', {
          projectId: project._id,
          issues: updatedIssues,
        });

        return res.status(200).send('Webhook processed');
      } catch (error) {
        console.error('Error processing GitHub webhook:', error);
        return res.status(500).send('Internal Server Error');
      }
    }

    res.status(200).send('Webhook received');
  });

  return router;
};
