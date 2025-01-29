import Projects from '../model/Projects.js';
import axios from 'axios';

// Fetch a single GitHub project and save it to MongoDB
export const fetchGithubRepo = async (owner, repoName) => {
  const GITHUB_API_URL = `https://api.github.com/repos/${owner}/${repoName}`;

  try {
    const response = await axios.get(GITHUB_API_URL);
    const gitData = response.data
    const { name, html_url, description } = gitData;
    console.log(response.data)

    const project = new Projects({
      name,
      content: description || 'No description provided',
      gitLink: html_url,
      status: 'active',
    });

    await project.save();

    return gitData;
  } catch (error) {
    console.error('Error fetching GitHub repo:', error);
    throw new Error('Failed to fetch GitHub repo');
  }
};

// Fetch all projects and update their data from GitHub
export const getAllProjects = async () => {
  try {
    console.log("get all proj")
    const projects = await Projects.find();
    //console.log(projects)

    // Fetch updated GitHub data for each project
    const projectsWithGitHubData = await Promise.all(
      projects.map(async (project) => {
        try {
          const repoPath = project.gitLink.replace('https://github.com/', '');
          //console.log(repoPath)
          const [owner, repo] = repoPath.split('/');
          const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}`;
          //console.log(githubApiUrl)

          const { data } = await axios.get(githubApiUrl);
          //console.log(data)
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

    return projectsWithGitHubData;
  } catch (error) {
    console.error('Error fetching project data:', error);
    throw new Error('Failed to fetch projects with GitHub data');
  }
};
