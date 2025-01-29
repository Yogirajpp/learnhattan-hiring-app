// import { fetchGithubRepo, getAllProjects } from "../controller/projectController.js";

import { fetchGithubRepo, getAllProjects } from "../controller/projectContoller.js";

export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected via Socket.io');

    // Fetch all projects via Socket.io using callback
    socket.on('getAllProjects', async ({}, callback) => {
      try {
        console.log("Running getAllProjects");
        const projects = await getAllProjects();
        console.log(projects, "proj data done");
        // Use callback to send the response back to the client
        callback({ success: true, projects });
      } catch (error) {
        console.error('Error fetching projects:', error);
        callback({ success: false, error: 'Failed to fetch projects' });
      }
    });

    // Fetch a GitHub repo via Socket.io
    socket.on('fetchRepo', async ({ owner, repoName }, callback) => {
      try {
        if (!owner || !repoName) {
          return callback({ success: false, error: 'Owner and repoName are required' });
        }

        const project = await fetchGithubRepo(owner, repoName);
        callback({ success: true, project });
      } catch (error) {
        console.error('Error fetching GitHub repo:', error);
        callback({ success: false, error: 'Failed to fetch GitHub repo' });
      }
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};
