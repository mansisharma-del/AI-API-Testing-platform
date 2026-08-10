// frontend/src/services/project.service.js

// ======================================================
// PROJECT API CONFIGURATION
// ======================================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://ai-api-testing-platform.onrender.com/api/v1';

// IMPORTANT:
// VITE_API_BASE_URL ends at /api/v1
// Therefore we explicitly add /projects here.
const API_URL = `${API_BASE_URL}/projects`;


// ======================================================
// GET TOKEN
// ======================================================

const getToken = () => {
  return localStorage.getItem('token');
};


// ======================================================
// COMMON HEADERS
// ======================================================

const getHeaders = () => {
  const token = getToken();

  return {
    'Content-Type': 'application/json',
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
};


// ======================================================
// CREATE PROJECT
// ======================================================

export const createProject = async (projectData) => {
  try {
    console.log('CREATE PROJECT URL:', API_URL);
    console.log('CREATE PROJECT DATA:', projectData);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(projectData),
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        error: text || 'Invalid server response',
      };
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        data.detail ||
        `Request failed with status ${response.status}`
      );
    }

    return data;

  } catch (error) {
    console.error('Create project error:', error);
    throw error;
  }
};


// ======================================================
// GET ALL PROJECTS
// ======================================================

export const getProjects = async () => {
  try {
    console.log('GET PROJECTS URL:', API_URL);

    const response = await fetch(API_URL, {
      method: 'GET',
      headers: getHeaders(),
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        error: text || 'Invalid server response',
      };
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        data.detail ||
        `Request failed with status ${response.status}`
      );
    }

    return data;

  } catch (error) {
    console.error('Get projects error:', error);
    throw error;
  }
};


// ======================================================
// GET SINGLE PROJECT
// ======================================================

export const getProject = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        error: text || 'Invalid server response',
      };
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        data.detail ||
        `Request failed with status ${response.status}`
      );
    }

    return data;

  } catch (error) {
    console.error('Get project error:', error);
    throw error;
  }
};


// ======================================================
// UPDATE PROJECT
// ======================================================

export const updateProject = async (id, projectData) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(projectData),
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        error: text || 'Invalid server response',
      };
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        data.detail ||
        `Request failed with status ${response.status}`
      );
    }

    return data;

  } catch (error) {
    console.error('Update project error:', error);
    throw error;
  }
};


// ======================================================
// DELETE PROJECT
// ======================================================

export const deleteProject = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        error: text || 'Invalid server response',
      };
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        data.detail ||
        `Request failed with status ${response.status}`
      );
    }

    return data;

  } catch (error) {
    console.error('Delete project error:', error);
    throw error;
  }
};
