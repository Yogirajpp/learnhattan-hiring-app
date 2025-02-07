// webhookHandler.js
import express from 'express';
import Projects from '../models/Projects.js';
import NodeCache from 'node-cache';
import { getProjectIssues } from './projectContoller.js';

const cache = new NodeCache();

export const webhookHandler = (io) => {
  const router = express.Router();

  router.post('/github-webhook', async (req, res) => {
    const eventType = req.headers['x-github-event'];
    const payload = req.body;

    // Process only relevant events.
    if (['issues', 'push', 'pull_request'].includes(eventType)) {
      const { repository } = payload;
      if (!repository) return res.status(400).send('Invalid payload');

      try {
        // Find the project associated with the GitHub repository URL.
        const project = await Projects.findOne({ gitLink: repository.html_url });
        if (!project) return res.status(404).send('Project not found');

        // Force a refresh from GitHub (bypassing the cache) by passing `true`
        const updatedIssues = await getProjectIssues(null, project._id, true);
        cache.set(`issues_${project._id}`, updatedIssues);

        // Emit the updated issues via Socket.IO to all connected clients in the project's room.
        io.to(`project_${project._id}`).emit('updateProjectIssues', {
          projectId: project._id,
          issues: updatedIssues,
        });

        return res.status(200).send('Webhook processed and update emitted');
      } catch (error) {
        console.error('Error processing webhook:', error);
        return res.status(500).send('Internal Server Error');
      }
    }

    // For events that are not processed, simply acknowledge receipt.
    res.status(200).send('Webhook received');
  });

  return router;
};

export default webhookHandler;
