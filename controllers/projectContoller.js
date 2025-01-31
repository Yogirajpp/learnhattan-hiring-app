import Projects from '../models/Projects.js';
import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 86400 });

export const fetchGithubRepo = async (owner, repoName) => {
  const cacheKey = `repo_${owner}_${repoName}`;
  let cachedRepo = cache.get(cacheKey);
  if (cachedRepo) return cachedRepo;

  const GITHUB_API_URL = `https://api.github.com/repos/${owner}/${repoName}`;
  try {
    const { data } = await axios.get(GITHUB_API_URL);
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
  } catch (error) {
    throw new Error('Failed to fetch GitHub repo');
  }
};

export const getAllProjects = async () => {
  let cachedProjects = cache.get("allProjects");
  if (cachedProjects) return cachedProjects;

  try {
    const projects = await Projects.find();
    const projectsWithGitHubData = await Promise.all(
      projects.map(async (project) => {
        try {
          const repoPath = project.gitLink.replace('https://github.com/', '');
          const [owner, repo] = repoPath.split('/');
          const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}`;

          const { data } = await axios.get(githubApiUrl);

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

export const getProjectIssues = async (projectId) => {
  let cachedIssues = cache.get(`issues_${projectId}`);
  if (cachedIssues) return cachedIssues;

  try {
    const project = await Projects.findById(projectId);
    if (!project) throw new Error('Project not found');

    const repoPath = project.gitLink.replace('https://github.com/', '');
    const [owner, repo] = repoPath.split('/');
    const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/issues`;

    const { data } = await axios.get(githubApiUrl);
    const issues = data.map(issue => ({
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

    cache.set(`issues_${projectId}`, issues);
    return issues;
  } catch {
    throw new Error('Failed to fetch issues from GitHub');
  }
};


export const getIssueComments = async (owner, repoName, issueId) => {
  const cacheKey = `comments_${owner}_${repoName}_${issueId}`;
  let cachedComments = cache.get(cacheKey);
  
  if (cachedComments) return cachedComments.length > 0 ? [cachedComments[0]] : [];

  try {
    const githubApiUrl = `https://api.github.com/repos/${owner}/${repoName}/issues/${issueId}/comments`;
    const { data } = await axios.get(githubApiUrl);

    if (data.length === 0) return []; // No comments available

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

    cache.set(cacheKey, [firstComment]); // Store only the first comment in cache
    return [firstComment]; // Return only the first comment
  } catch {
    throw new Error("Failed to fetch comments from GitHub");
  }
};

