// frontend/src/services/project.service.js

// Base API URL
// Vercel Environment Variable:
// VITE_API_BASE_URL=https://ai-api-testing-platform.onrender.com/api/v1
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://ai-api-testing-platform.onrender.com/api/v1';

// Projects API
const API_URL = `${API_BASE_URL}/projects`;


// ==========================================
// Get Authentication Token
// ==========================================
const getToken = () => {
  return localStorage.getItem('token');
};


// ==========================================
// Create a New Project
// ==========================================
export const createProject = async (projectData) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },

      body: JSON.stringify(projectData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
        data.message ||
        data.error ||
        'Failed to create project'
      );
    }

    return data;

  } catch (error) {
    console.error('Create project error:', error);
    throw error;
  }
};


// ==========================================
// Get All Projects
// ==========================================
export const getProjects = async () => {
  try {
    const response = await fetch(API_URL, {
      method: 'GET',

      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
        data.message ||
        data.error ||
        'Failed to fetch projects'
      );
    }

    return data;

  } catch (error) {
    console.error('Get projects error:', error);
    throw error;
  }
};


// ==========================================
// Get a Single Project
// ==========================================
export const getProject = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'GET',

      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
        data.message ||
        data.error ||
        'Failed to fetch project'
      );
    }

    return data;

  } catch (error) {
    console.error('Get project error:', error);
    throw error;
  }
};


// ==========================================
// Update a Project
// ==========================================
export const updateProject = async (id, projectData) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',

      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },

      body: JSON.stringify(projectData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
        data.message ||
        data.error ||
        'Failed to update project'
      );
    }

    return data;

  } catch (error) {
    console.error('Update project error:', error);
    throw error;
  }
};


// ==========================================
// Delete a Project
// ==========================================
export const deleteProject = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',

      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
        data.message ||
        data.error ||
        'Failed to delete project'
      );
    }

    return data;

  } catch (error) {
    console.error('Delete project error:', error);
    throw error;
  }
};
