import Projects from '../models/Projects.js';
import User from '../models/User.js'; // Import User model
import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 86400 });

const getAuthHeaders = async (userId) => {
  console.log('userId:', userId);
  const user = await User.findById(userId);
  return user && user.githubAccessToken ? { Authorization: `token ${user.githubAccessToken}` } : {};

};

export const fetchGithubRepo = async (userId, owner, repoName) => {
  const cacheKey = `repo_${owner}_${repoName}`;
  let cachedRepo = cache.get(cacheKey);
  if (cachedRepo) return cachedRepo;

  const GITHUB_API_URL = `https://api.github.com/repos/${owner}/${repoName}`;
  try {
    const headers = await getAuthHeaders(userId);
    console.log('headers:', headers);
    const { data } = await axios.get(GITHUB_API_URL, { headers });
    if (!data) throw new Error('No data received from GitHub');

    let project = await Projects.findOne({ gitLink: data.html_url });
    if (!project) {
      project = new Projects({
        name: data.name,
        content: data.description || 'No description provided',
        gitLink: data.html_url,
        status: 'active',
      });
      await project.save();
    }

    const repoData = {
      name: data.name,
      gitLink: data.html_url,
      description: data.description,
      stars: data.stargazers_count,
      forks: data.forks_count,
      issues: data.open_issues_count,
      language: data.language,
    };

    cache.set(cacheKey, repoData);
    return repoData;
  } catch {
    throw new Error('Failed to fetch GitHub repo');
  }
};

export const getAllProjects = async (userId) => {
  let cachedProjects = cache.get("allProjects");
  if (cachedProjects) return cachedProjects;

  try {
    const headers = await getAuthHeaders(userId);
    console.log('headers:', headers);
    const projects = await Projects.find();
    const projectsWithGitHubData = await Promise.all(
      projects.map(async (project) => {
        try {
          const repoPath = project.gitLink.replace('https://github.com/', '');
          const [owner, repo] = repoPath.split('/');
          const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}`;

          const { data } = await axios.get(githubApiUrl, { headers });

          return {
            ...project.toObject(),
            latestGitHubData: {
              name: data.full_name,
              description: data.description,
              stars: data.stargazers_count,
              forks: data.forks_count,
              issues: data.open_issues_count,
              language: data.language,
              updatedAt: data.updated_at,
            },
          };
        } catch {
          return { ...project.toObject(), latestGitHubData: null };
        }
      })
    );

    cache.set("allProjects", projectsWithGitHubData);
    return projectsWithGitHubData;
  } catch {
    throw new Error('Failed to fetch projects with GitHub data');
  }
};

export const getProjectIssues = async (userId, projectId, forceRefresh = false) => {
  if (!forceRefresh) {
    let cachedIssues = cache.get(`issues_${projectId}`);
    if (cachedIssues) return cachedIssues;
  }

  try {
    const headers = await getAuthHeaders(userId);
    console.log('headers:', headers);

    const project = await Projects.findById(projectId);
    if (!project) throw new Error('Project not found');

    // Fetch all issues (both open and closed) from GitHub
    const repoPath = project.gitLink.replace('https://github.com/', '');
    const [owner, repo] = repoPath.split('/');
    const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/issues?state=all&page=1&per_page=100`;

    const { data } = await axios.get(githubApiUrl, { headers });
    const issues = data.map(issue => ({
      id: issue.id,
      title: issue.title,
      url: issue.html_url,
      state: issue.state,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      user: {
        login: issue.user.login,
        html_url: issue.user.html_url,
      },
      comments: issue.comments,
      labels: issue.labels.map(label => label.name),
      pullRequestUrl: issue.pull_request ? issue.pull_request.html_url : null,
      body: issue.body,
    }));

    // Split issues into open and closed arrays
    const splitIssues = {
      open: issues.filter(issue => issue.state === 'open'),
      closed: issues.filter(issue => issue.state === 'closed'),
    };

    // Update the cache with the fresh data
    cache.set(`issues_${projectId}`, splitIssues);
    return splitIssues;
  } catch (error) {
    console.error('Error in getProjectIssues:', error);
    throw new Error('Failed to fetch issues from GitHub');
  }
};

export const getIssueComments = async (userId, owner, repoName, issueId) => {
  const cacheKey = `comments_${owner}_${repoName}_${issueId}`;
  let cachedComments = cache.get(cacheKey);
  
  if (cachedComments) return cachedComments.length > 0 ? [cachedComments[0]] : [];

  try {
    const headers = await getAuthHeaders(userId);
    console.log("headers:", headers);
    const githubApiUrl = `https://api.github.com/repos/${owner}/${repoName}/issues/${issueId}/comments`;
    const { data } = await axios.get(githubApiUrl, { headers });

    if (data.length === 0) return [];

    const firstComment = {
      id: data[0].id,
      user: {
        login: data[0].user.login,
        html_url: data[0].user.html_url,
      },
      body: data[0].body,
      createdAt: data[0].created_at,
      updatedAt: data[0].updated_at,
    };

    cache.set(cacheKey, [firstComment]);
    return [firstComment];
  } catch {
    throw new Error("Failed to fetch comments from GitHub");
  }
};