import NodeCache from "node-cache";
import { fetchGithubRepo, getAllProjects, getProjectIssues } from "../controller/projectContoller.js";

const cache = new NodeCache({ stdTTL: 300 }); // Cache expires in 5 minutes

export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Fetch all projects via Socket.io with caching
    socket.on('getAllProjects', async (_, callback) => {
      try {
        console.log(`Fetching all projects for client: ${socket.id}`);

        let projects = cache.get("allProjects");
        if (!projects) {
          projects = await getAllProjects();
          cache.set("allProjects", projects);
        }

        callback({ success: true, projects });
      } catch (error) {
        console.error(`Error fetching projects:`, error.message);
        callback({ success: false, error: 'Failed to fetch projects' });
      }
    });

    // Fetch a single GitHub repo and store in cache
    socket.on('fetchRepo', async ({ owner, repoName }, callback) => {
      try {
        if (!owner || !repoName) {
          return callback({ success: false, error: 'Owner and repoName are required' });
        }

        const cacheKey = `repo_${owner}_${repoName}`;
        let project = cache.get(cacheKey);

        if (!project) {
          console.log(`Fetching GitHub repo: ${owner}/${repoName}`);
          project = await fetchGithubRepo(owner, repoName);
          cache.set(cacheKey, project);
        }

        callback({ success: true, project });
      } catch (error) {
        console.error(`Error fetching GitHub repo:`, error.message);
        callback({ success: false, error: 'Failed to fetch GitHub repo' });
      }
    });

    // Fetch issues for a specific project and enable real-time updates
    socket.on('getProjectIssues', async ({ projectId }, callback) => {
      try {
        console.log(`Fetching issues for project ID: ${projectId}`);

        let issues = cache.get(`issues_${projectId}`);
        if (!issues) {
          issues = await getProjectIssues(projectId);
          cache.set(`issues_${projectId}`, issues);
        }

        callback({ success: true, issues });

        // Join a unique room for real-time updates on this project
        socket.join(`project_${projectId}`);
      } catch (error) {
        console.error(`Error fetching project issues:`, error.message);
        callback({ success: false, error: 'Failed to fetch project issues' });
      }
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};
