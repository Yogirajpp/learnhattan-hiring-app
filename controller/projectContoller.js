import Projects from '../model/Projects.js';
import axios from 'axios';

// Function to fetch a GitHub repository and save it to MongoDB
export const fetchGithubRepo = async (owner, repoName) => {
  const GITHUB_API_URL = `https://api.github.com/repos/${owner}/${repoName}`;

  try {
    console.log(`Fetching GitHub repository: ${owner}/${repoName}`);

    const { data } = await axios.get(GITHUB_API_URL);
    if (!data) throw new Error('No data received from GitHub');

    const { name, html_url, description } = data;

    let project = await Projects.findOne({ gitLink: html_url });
    if (!project) {
      project = new Projects({
        name,
        content: description || 'No description provided',
        gitLink: html_url,
        status: 'active',
      });
      await project.save();
    }

    console.log(`GitHub repo fetched and saved: ${name}`);

    return {
      name,
      gitLink: html_url,
      description,
      stars: data.stargazers_count,
      forks: data.forks_count,
      issues: data.open_issues_count,
      language: data.language,
    };
  } catch (error) {
    console.error(`Error fetching GitHub repo [${owner}/${repoName}]:`, error.message);
    throw new Error('Failed to fetch GitHub repo');
  }
};

// Function to fetch all projects from MongoDB and update their GitHub data
export const getAllProjects = async () => {
  try {
    console.log('Fetching all projects from the database...');
    const projects = await Projects.find();

    const projectsWithGitHubData = await Promise.all(
      projects.map(async (project) => {
        try {
          const repoPath = project.gitLink.replace('https://github.com/', '');
          const [owner, repo] = repoPath.split('/');
          const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}`;

          const { data } = await axios.get(githubApiUrl);
          console.log(data)

          return {
            ...project.toObject(),
            latestGitHubData: {
              name: data.name,
              description: data.description,
              stars: data.stargazers_count,
              forks: data.forks_count,
              issues: data.open_issues_count,
              language: data.language,
            },
          };
        } catch (error) {
          console.warn(`Failed to fetch GitHub data for ${project.gitLink}:`, error.message);
          return { ...project.toObject(), latestGitHubData: null };
        }
      })
    );

    console.log(`Successfully fetched ${projects.length} projects with updated GitHub data.`);
    return projectsWithGitHubData;
  } catch (error) {
    console.error('Error fetching projects from the database:', error.message);
    throw new Error('Failed to fetch projects with GitHub data');
  }
};

// Function to fetch GitHub issues for a specific project
export const getProjectIssues = async (projectId) => {
  try {
    console.log(`Fetching issues for project ID: ${projectId}`);

    const project = await Projects.findById(projectId);
    if (!project) throw new Error('Project not found in the database');

    const repoPath = project.gitLink.replace('https://github.com/', '');
    const [owner, repo] = repoPath.split('/');
    const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/issues`;

    const { data } = await axios.get(githubApiUrl);

    console.log(`Fetched ${data.length} issues for ${project.name}`);

    return data.map(issue => ({
      title: issue.title,
      url: issue.html_url,
      state: issue.state,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      user: issue.user.login,
    }));
  } catch (error) {
    console.error(`Error fetching issues for project ID: ${projectId}`, error.message);
    throw new Error('Failed to fetch issues from GitHub');
  }
};
