import NodeCache from "node-cache";
import { fetchGithubRepo, getAllProjects, getProjectIssues } from "../controller/projectContoller.js";

const cache = new NodeCache({ stdTTL: 86400 }); // 24-hour cache

export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Fetch all projects (cache-first approach)
    socket.on('getAllProjects', async (_, callback) => {
      try {
        let projects = cache.get("allProjects");
        if (!projects) {
          projects = await getAllProjects();
          cache.set("allProjects", projects);
        }
        callback({ success: true, projects });
      } catch (error) {
        callback({ success: false, error: 'Failed to fetch projects' });
      }
    });

    // Fetch GitHub repo details (cache-first)
    socket.on('fetchRepo', async ({ owner, repoName }, callback) => {
      try {
        if (!owner || !repoName) return callback({ success: false, error: 'Owner and repoName are required' });

        const cacheKey = `repo_${owner}_${repoName}`;
        let project = cache.get(cacheKey);

        if (!project) {
          project = await fetchGithubRepo(owner, repoName);
          cache.set(cacheKey, project);
        }

        callback({ success: true, project });
      } catch (error) {
        callback({ success: false, error: 'Failed to fetch GitHub repo' });
      }
    });

    // Fetch project issues (cache-first)
    socket.on('getProjectIssues', async ({ projectId }, callback) => {
      try {
        let issues = cache.get(`issues_${projectId}`);
        if (!issues) {
          issues = await getProjectIssues(projectId);
          cache.set(`issues_${projectId}`, issues);
        }
        callback({ success: true, issues });
      } catch (error) {
        callback({ success: false, error: 'Failed to fetch project issues' });
      }
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};
