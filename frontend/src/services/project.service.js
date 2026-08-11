// frontend/src/services/project.service.js

// ======================================================
// PROJECT API CONFIGURATION
// ======================================================

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'https://ai-api-testing-platform.onrender.com/api/v1'
).replace(/\/+$/, '');

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

    // Prevent cached responses
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  };
};

// ======================================================
// SAFE RESPONSE PARSER
// ======================================================

const parseResponse = async (response) => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: text || 'Invalid server response',
    };
  }
};

// ======================================================
// CREATE PROJECT
// ======================================================

export const createProject = async (projectData) => {
  try {
    console.log('======================================');
    console.log('CREATE PROJECT');
    console.log('URL:', API_URL);
    console.log('DATA:', projectData);
    console.log('======================================');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      cache: 'no-store',
      body: JSON.stringify(projectData),
    });

    console.log('CREATE PROJECT STATUS:', response.status);

    const data = await parseResponse(response);

    console.log('CREATE PROJECT RESPONSE:', data);

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
    console.error('❌ Create project error:', error);
    throw error;
  }
};

// ======================================================
// GET ALL PROJECTS
// ======================================================

export const getProjects = async () => {
  try {
    // Cache-busting parameter
    const url = `${API_URL}?_=${Date.now()}`;

    console.log('======================================');
    console.log('GET ALL PROJECTS');
    console.log('URL:', url);
    console.log('======================================');

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
      cache: 'no-store',
    });

    console.log('GET PROJECTS STATUS:', response.status);

    const data = await parseResponse(response);

    console.log('GET PROJECTS RESPONSE:', data);

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
    console.error('❌ Get projects error:', error);
    throw error;
  }
};

// ======================================================
// GET SINGLE PROJECT
// ======================================================

export const getProject = async (id) => {
  try {
    if (!id) {
      throw new Error('Project ID is missing');
    }

    // IMPORTANT:
    // Add a unique query parameter so the browser/Render
    // does not reuse a cached 304 response.
    const url = `${API_URL}/${encodeURIComponent(id)}?_=${Date.now()}`;

    console.log('======================================');
    console.log('GET SINGLE PROJECT');
    console.log('PROJECT ID:', id);
    console.log('URL:', url);
    console.log('======================================');

    const response = await fetch(url, {
      method: 'GET',

      // Do not use browser cache
      cache: 'no-store',

      headers: getHeaders(),
    });

    console.log('GET SINGLE PROJECT STATUS:', response.status);

    const data = await parseResponse(response);

    console.log('GET SINGLE PROJECT RESPONSE:', data);

    // ==================================================
    // HANDLE HTTP ERRORS
    // ==================================================

    if (!response.ok) {
      const message =
        data.error ||
        data.message ||
        data.detail ||
        `Failed to fetch project (${response.status})`;

      console.error('❌ Get project failed:', message);

      throw new Error(message);
    }

    // ==================================================
    // NORMAL BACKEND RESPONSE
    // Example:
    // {
    //   success: true,
    //   project: {...}
    // }
    // ==================================================

    if (data?.success && data?.project) {
      return data;
    }

    // ==================================================
    // SOME BACKENDS MAY RETURN:
    // {
    //   project: {...}
    // }
    // ==================================================

    if (data?.project) {
      return {
        ...data,
        success: true,
      };
    }

    // ==================================================
    // SOME BACKENDS MAY RETURN PROJECT DIRECTLY
    // ==================================================

    if (
      data &&
      (
        data._id ||
        data.id ||
        data.name ||
        data.description
      )
    ) {
      return {
        success: true,
        project: data,
      };
    }

    // ==================================================
    // NO PROJECT FOUND
    // ==================================================

    throw new Error(
      data?.error ||
        data?.message ||
        'Project not found'
    );
  } catch (error) {
    console.error('❌ Get project error:', error);
    throw error;
  }
};

// ======================================================
// UPDATE PROJECT
// ======================================================

export const updateProject = async (id, projectData) => {
  try {
    if (!id) {
      throw new Error('Project ID is missing');
    }

    const url = `${API_URL}/${encodeURIComponent(id)}?_=${Date.now()}`;

    console.log('======================================');
    console.log('UPDATE PROJECT');
    console.log('URL:', url);
    console.log('DATA:', projectData);
    console.log('======================================');

    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(),
      cache: 'no-store',
      body: JSON.stringify(projectData),
    });

    console.log('UPDATE PROJECT STATUS:', response.status);

    const data = await parseResponse(response);

    console.log('UPDATE PROJECT RESPONSE:', data);

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
    console.error('❌ Update project error:', error);
    throw error;
  }
};

// ======================================================
// DELETE PROJECT
// ======================================================

export const deleteProject = async (id) => {
  try {
    if (!id) {
      throw new Error('Project ID is missing');
    }

    const url = `${API_URL}/${encodeURIComponent(id)}?_=${Date.now()}`;

    console.log('======================================');
    console.log('DELETE PROJECT');
    console.log('URL:', url);
    console.log('======================================');

    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(),
      cache: 'no-store',
    });

    console.log('DELETE PROJECT STATUS:', response.status);

    const data = await parseResponse(response);

    console.log('DELETE PROJECT RESPONSE:', data);

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
    console.error('❌ Delete project error:', error);
    throw error;
  }
};
