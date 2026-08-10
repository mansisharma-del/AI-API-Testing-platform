// frontend/src/services/auth.service.js

// Base API URL from Vercel environment variable
// Vercel:
// VITE_API_BASE_URL=https://ai-api-testing-platform.onrender.com/api/v1
//
// Local fallback:
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://ai-api-testing-platform.onrender.com/api/v1';

// Authentication routes are under /auth
const API_URL = `${API_BASE_URL}/auth`;


// ==========================================
// Register User
// ==========================================
export const register = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
        data.message ||
        data.error ||
        'Registration failed'
      );
    }

    return data;

  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};


// ==========================================
// Login User
// ==========================================
export const login = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
        data.message ||
        data.error ||
        'Login failed'
      );
    }

    // Save token and user information
    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;

  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};


// ==========================================
// Get Current User
// ==========================================
export const getMe = async () => {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${API_URL}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
        data.message ||
        data.error ||
        'Failed to get current user'
      );
    }

    return data;

  } catch (error) {
    console.error('Get me error:', error);
    throw error;
  }
};


// ==========================================
// Logout
// ==========================================
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};


// ==========================================
// Check Authentication
// ==========================================
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');

  return !!token;
};


// ==========================================
// Get Current User from LocalStorage
// ==========================================
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');

  return user ? JSON.parse(user) : null;
};
