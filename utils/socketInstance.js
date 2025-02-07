// socketInatance.js
import NodeCache from "node-cache";
import {
  fetchGithubRepo,
  getAllProjects,
  getIssueComments,
  getProjectIssues
} from "../controllers/projectContoller.js";

const cache = new NodeCache({ stdTTL: 86400 }); // 24-hour cache

export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

     // Listen for the joinProject event
    socket.on("joinProject", ({ projectId }) => {
      socket.join(`project_${projectId}`);
      console.log(`Socket ${socket.id} joined room project_${projectId}`);
    });

    // Fetch all projects (cache-first approach)
    socket.on('getAllProjects', async ({ userId }, callback) => {
      try {
        let projects = cache.get("allProjects");
        if (!projects) {
          projects = await getAllProjects(userId);
          cache.set("allProjects", projects);
        }
        callback({ success: true, projects });
      } catch (error) {
        callback({ success: false, error: 'Failed to fetch projects' });
      }
    });

    // Fetch GitHub repo details (cache-first)
    socket.on('fetchRepo', async ({ userId, owner, repoName }, callback) => {
      try {
        if (!owner || !repoName) {
          return callback({ success: false, error: 'Owner and repoName are required' });
        }

        const cacheKey = `repo_${owner}_${repoName}`;
        let project = cache.get(cacheKey);

        if (!project) {
          project = await fetchGithubRepo(userId, owner, repoName);
          cache.set(cacheKey, project);
        }

        callback({ success: true, project });
      } catch (error) {
        callback({ success: false, error: 'Failed to fetch GitHub repo' });
      }
    });

    // Fetch project issues (cache-first)
    socket.on('getProjectIssues', async ({ userId, projectId }, callback) => {
      try {
        let issues = cache.get(`issues_${projectId}`);
        if (!issues) {
          issues = await getProjectIssues(userId, projectId);
          cache.set(`issues_${projectId}`, issues);
        }
        callback({ success: true, issues });
      } catch (error) {
        callback({ success: false, error: 'Failed to fetch project issues' });
      }
    });

    // Fetch issue comments
    socket.on('getIssueComments', async ({ userId, owner, repoName, issueId }, callback) => {
      try {
        if (!owner || !repoName || !issueId) {
          return callback({ success: false, error: 'Owner, repoName, and issueId are required' });
        }

        const comments = await getIssueComments(userId, owner, repoName, issueId);
        callback({ success: true, comments });
      } catch (error) {
        callback({ success: false, error: 'Failed to fetch issue comments' });
      }
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};
