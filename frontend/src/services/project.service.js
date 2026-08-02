const API_URL = 'https://ai-api-testing-platform.onrender.com/api/v1/projects';

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Create a new project
export const createProject = async (projectData) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(projectData)
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Create project error:', error);
    throw error;
  }
};

// Get all projects
export const getProjects = async () => {
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get projects error:', error);
    throw error;
  }
};

// Get a single project
export const getProject = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get project error:', error);
    throw error;
  }
};

// Update a project
export const updateProject = async (id, projectData) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(projectData)
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Update project error:', error);
    throw error;
  }
};

// Delete a project
export const deleteProject = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Delete project error:', error);
    throw error;
  }
};
