import Projects from '../model/Projects.js';
import axios from 'axios';

// Fetch a single GitHub project and save it to MongoDB
export const fetchGithubRepo = async (req, res) => {
  const { owner, repoName } = req.params;

  const GITHUB_API_URL = `https://api.github.com/repos/${owner}/${repoName}`;
  try {
    const response = await axios.get(GITHUB_API_URL);
    const { name, html_url, description } = response.data;

    const project = new Projects({
      name,
      content: description || 'No description provided',
      gitLink: html_url,
      status: 'active',
    });

    await project.save();

    res.status(201).json({ success: true, project });
  } catch (error) {
    console.error('Error fetching GitHub repo:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch GitHub repo' });
  }
};

// Fetch all projects and update their data from GitHub
export const getAllProjects = async (req, res) => {
  try {
    const projects = await Projects.find();

    // Fetch updated GitHub data for each project
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
              name: data.name,
              description: data.description,
              stars: data.stargazers_count,
              forks: data.forks_count,
              issues: data.open_issues_count,
              language: data.language,
            },
          };
        } catch (error) {
          console.error(`Failed to fetch GitHub data for ${project.gitLink}:`, error);
          return { ...project.toObject(), latestGitHubData: null };
        }
      })
    );

    res.status(200).json({ success: true, projects: projectsWithGitHubData });
  } catch (error) {
    console.error('Error fetching project data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch projects with GitHub data' });
  }
};