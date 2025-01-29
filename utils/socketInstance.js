import { fetchGithubRepo, getAllProjects } from "../controller/projectContoller.js";

export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected via Socket.io');

    socket.on('getAllProjects', async (callback) => {
      try {
        const projects = await getAllProjects();
        callback({ success: true, projects });
      } catch (error) {
        console.error('Error fetching projects:', error);
        callback({ success: false, error: 'Failed to fetch projects' });
      }
    });

    socket.on('fetchRepo', async ({ owner, repoName }, callback) => {
      try {
        const project = await fetchGithubRepo(owner, repoName);
        callback({ success: true, project });
      } catch (error) {
        console.error('Error fetching GitHub repo:', error);
        callback({ success: false, error: 'Failed to fetch GitHub repo' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};
