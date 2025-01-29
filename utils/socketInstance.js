import { fetchGithubRepo, getAllProjects, getProjectIssues } from "../controller/projectContoller.js";

export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected via Socket.io');

    // Fetch all projects via Socket.io using callback
    socket.on('getAllProjects', async ({}, callback) => {
      try {
        console.log("Running getAllProjects");
        const projects = await getAllProjects();
        console.log(projects[0]._id, "proj data done");
        
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

    // Fetch issues of a specific project based on GitHub data
    socket.on('getProjectIssues', async ({ projectId }, callback) => {
      try {
        console.log(`Fetching issues for project with ID: ${projectId}`);
        const issues = await getProjectIssues(projectId);
        callback({ success: true, issues });
      } catch (error) {
        console.error('Error fetching project issues:', error);
        callback({ success: false, error: 'Failed to fetch project issues' });
      }
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};
