import React, { createContext, useState, useContext, useEffect } from 'react';
import { getProjects, createProject, updateProject, deleteProject } from '../services/project.service.js';
import toast from 'react-hot-toast';

const ProjectContext = createContext();

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const result = await getProjects();
      if (result.success) {
        setProjects(result.projects);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch projects');
      }
    } catch (err) {
      setError('Error fetching projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new project
  const addProject = async (projectData) => {
    try {
      const result = await createProject(projectData);
      if (result.success) {
        setProjects(prev => [result.project, ...prev]);
        toast.success('Project created successfully! 🎉');
        return { success: true, project: result.project };
      } else {
        toast.error(result.error || 'Failed to create project');
        return { success: false, error: result.error };
      }
    } catch (err) {
      toast.error('Error creating project');
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  // Update a project
  const editProject = async (id, projectData) => {
    try {
      const result = await updateProject(id, projectData);
      if (result.success) {
        setProjects(prev => prev.map(p => p.id === id ? result.project : p));
        toast.success('Project updated successfully! ✅');
        return { success: true, project: result.project };
      } else {
        toast.error(result.error || 'Failed to update project');
        return { success: false, error: result.error };
      }
    } catch (err) {
      toast.error('Error updating project');
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  // Delete a project
  const removeProject = async (id) => {
    try {
      const result = await deleteProject(id);
      if (result.success) {
        setProjects(prev => prev.filter(p => p.id !== id));
        toast.success('Project deleted successfully! 🗑️');
        return { success: true };
      } else {
        toast.error(result.error || 'Failed to delete project');
        return { success: false, error: result.error };
      }
    } catch (err) {
      toast.error('Error deleting project');
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const value = {
    projects,
    loading,
    error,
    fetchProjects,
    addProject,
    editProject,
    removeProject
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};