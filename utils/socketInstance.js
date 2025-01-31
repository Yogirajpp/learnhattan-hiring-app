import NodeCache from "node-cache";
import { fetchGithubRepo, getAllProjects, getProjectIssues } from "../controllers/projectContoller.js";

const cache = new NodeCache({ stdTTL: 86400 }); // Cache expires in 24 hours

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
          console.log(projects)
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

          if (!issues || issues.length === 0) {
            console.warn(`No issues found for project ${projectId}`);
          }

          cache.set(`issues_${projectId}`, issues);
        }

        callback({ success: true, issues });
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
