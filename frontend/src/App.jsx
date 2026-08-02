import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import EditProject from './pages/EditProject.jsx';
import GitHubIntegration from './pages/GitHubIntegration.jsx';
import AITestGeneration from './pages/AITestGeneration.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import { ProjectProvider } from './context/ProjectContext.jsx';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/signup" />;  // ✅ Signup page pe redirect
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <ProjectProvider>
        <Routes>
          {/* ✅ Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* ✅ Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id/edit"
            element={
              <ProtectedRoute>
                <EditProject />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id/github"
            element={
              <ProtectedRoute>
                <GitHubIntegration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id/ai-tests"
            element={
              <ProtectedRoute>
                <AITestGeneration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          
          {/* ✅ Default route - Signup page */}
          <Route path="/" element={<Navigate to="/signup" />} />
        </Routes>
      </ProjectProvider>
    </BrowserRouter>
  );
}

export default App;