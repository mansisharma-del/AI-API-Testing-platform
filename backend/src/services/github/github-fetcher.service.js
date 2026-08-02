import axios from 'axios';
import config from '../../core/config/index.js';

export const fetchGitHubRepo = async (repoUrl, token) => {
  try {
    // Extract owner and repo from URL
    const urlParts = repoUrl.replace('https://github.com/', '').split('/');
    const owner = urlParts[0];
    const repo = urlParts[1];

    if (!owner || !repo) {
      throw new Error('Invalid GitHub repository URL');
    }

    // GitHub API URL
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

    // Make request to GitHub API
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': token ? `token ${token}` : '',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    return {
      success: true,
      data: {
        name: response.data.name,
        fullName: response.data.full_name,
        description: response.data.description,
        stars: response.data.stargazers_count,
        forks: response.data.forks_count,
        url: response.data.html_url,
        defaultBranch: response.data.default_branch,
        language: response.data.language,
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at,
        owner: {
          login: response.data.owner.login,
          avatar: response.data.owner.avatar_url
        }
      }
    };
  } catch (error) {
    console.error('GitHub fetch error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch repository'
    };
  }
};

export const fetchRepoContents = async (repoUrl, path = '', token = null) => {
  try {
    const urlParts = repoUrl.replace('https://github.com/', '').split('/');
    const owner = urlParts[0];
    const repo = urlParts[1];

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': token ? `token ${token}` : '',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('GitHub contents error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch contents'
    };
  }
};

export const findOpenAPIFile = async (repoUrl, token = null) => {
  try {
    const urlParts = repoUrl.replace('https://github.com/', '').split('/');
    const owner = urlParts[0];
    const repo = urlParts[1];

    const possiblePaths = [
      'openapi.yaml',
      'openapi.yml',
      'openapi.json',
      'swagger.yaml',
      'swagger.yml',
      'swagger.json',
      'api/openapi.yaml',
      'api/openapi.yml',
      'api/swagger.yaml',
      'api/swagger.yml',
      'docs/openapi.yaml',
      'docs/openapi.yml'
    ];

    for (const path of possiblePaths) {
      try {
        const response = await axios.get(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
          {
            headers: {
              'Authorization': token ? `token ${token}` : '',
              'Accept': 'application/vnd.github.v3.raw'
            }
          }
        );

        // Parse based on file extension
        let spec;
        if (path.endsWith('.json')) {
          spec = JSON.parse(response.data);
        } else {
          // For YAML files
          const yaml = await import('js-yaml');
          spec = yaml.load(response.data);
        }

        return {
          success: true,
          path: path,
          spec: spec
        };
      } catch (error) {
        // File not found, continue to next path
        continue;
      }
    }

    return {
      success: false,
      error: 'No OpenAPI/Swagger file found in repository'
    };
  } catch (error) {
    console.error('Find OpenAPI error:', error);
    return {
      success: false,
      error: error.message || 'Failed to find OpenAPI file'
    };
  }
};