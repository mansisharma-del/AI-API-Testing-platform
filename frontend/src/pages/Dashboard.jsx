import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../services/auth.service.js';
import {
  createProject,
  getProjects,
  deleteProject,
} from '../services/project.service.js';

import {
  Plus,
  FolderOpen,
  TestTube,
  Activity,
  TrendingUp,
  Trash2,
  Edit,
  Eye,
  X,
} from 'lucide-react';

import toast, { Toaster } from 'react-hot-toast';


const Dashboard = () => {
  const navigate = useNavigate();

  // ==========================================
  // User
  // ==========================================
  const [user, setUser] = useState(getCurrentUser());

  // ==========================================
  // Projects
  // ==========================================
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // Create Project Modal
  // ==========================================
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    githubRepoUrl: '',
  });

  const [submitting, setSubmitting] = useState(false);


  // ==========================================
  // Load Projects
  // ==========================================
  const loadProjects = async () => {
    try {
      setLoading(true);

      const data = await getProjects();

      /*
       * Depending on your backend response structure,
       * projects may be returned directly or inside data.projects.
       */
      if (Array.isArray(data)) {
        setProjects(data);
      } else if (Array.isArray(data.projects)) {
        setProjects(data.projects);
      } else if (Array.isArray(data.data)) {
        setProjects(data.data);
      } else {
        setProjects([]);
      }

    } catch (error) {
      console.error('Get projects error:', error);

      toast.error(
        error.message || 'Failed to load projects'
      );

    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // Load projects when dashboard opens
  // ==========================================
  useEffect(() => {
    loadProjects();
  }, []);


  // ==========================================
  // Logout
  // ==========================================
  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  // ==========================================
  // Create Project
  // ==========================================
  const handleCreateProject = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      setSubmitting(true);

      console.log('Creating project:', formData);

      const result = await createProject(formData);

      console.log('Create project response:', result);

      toast.success('Project created successfully!');

      // Close modal
      setShowCreateModal(false);

      // Reset form
      setFormData({
        name: '',
        description: '',
        githubRepoUrl: '',
      });

      // Reload projects
      await loadProjects();

    } catch (error) {
      console.error('Create project error:', error);

      toast.error(
        error.message || 'Failed to create project'
      );

    } finally {
      setSubmitting(false);
    }
  };


  // ==========================================
  // Delete Project
  // ==========================================
  const handleDeleteProject = async (id, name) => {

    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {

      await deleteProject(id);

      toast.success('Project deleted successfully');

      // Remove from UI immediately
      setProjects((prevProjects) =>
        prevProjects.filter(
          (project) => project.id !== id
        )
      );

    } catch (error) {

      console.error('Delete project error:', error);

      toast.error(
        error.message || 'Failed to delete project'
      );
    }
  };


  // ==========================================
  // Stats
  // ==========================================
  const stats = [
    {
      icon: FolderOpen,
      label: 'Total Projects',
      value: projects.length,
      color: 'indigo',
    },
    {
      icon: TestTube,
      label: 'Test Suites',
      value: projects.length * 4,
      color: 'purple',
    },
    {
      icon: Activity,
      label: 'API Tests',
      value: projects.length * 12,
      color: 'green',
    },
    {
      icon: TrendingUp,
      label: 'Success Rate',
      value: '94%',
      color: 'orange',
    },
  ];


  // ==========================================
  // Stat Colors
  // ==========================================
  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  };


  // ==========================================
  // Project Status Colors
  // ==========================================
  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-600',
    ANALYZING: 'bg-yellow-100 text-yellow-600',
    READY: 'bg-blue-100 text-blue-600',
    TESTING: 'bg-purple-100 text-purple-600',
    ERROR: 'bg-red-100 text-red-600',
  };


  return (
    <div className="min-h-screen bg-gray-50">

      <Toaster position="top-right" />


      {/* ========================================
          Navbar
      ======================================== */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <div className="flex items-center gap-3">

              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-xl">
                <span className="text-white text-xl">
                  🚀
                </span>
              </div>

              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI API Testing
              </span>

            </div>


            {/* User */}
            <div className="flex items-center gap-4">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">

                  {user?.fullName?.charAt(0) || 'U'}

                </div>

                <div className="hidden md:block">

                  <p className="text-sm font-medium text-gray-800">
                    {user?.fullName}
                  </p>

                  <p className="text-xs text-gray-500">
                    {user?.email}
                  </p>

                </div>

              </div>


              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition text-sm font-medium"
              >
                Logout
              </button>

            </div>

          </div>

        </div>

      </nav>


      {/* ========================================
          Main Content
      ======================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* Welcome */}
        <div className="mb-8">

          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-3xl font-bold text-gray-800">
                Welcome back, {user?.fullName}! 👋
              </h1>

              <p className="text-gray-500 mt-1">
                Manage your API testing projects from one place
              </p>

            </div>


            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl transition flex items-center gap-2 font-semibold"
            >

              <Plus className="w-5 h-5" />

              New Project

            </button>

          </div>

        </div>


        {/* ========================================
            Stats
        ======================================== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

          {stats.map((stat, index) => {

            const Icon = stat.icon;

            return (

              <div
                key={index}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
              >

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-gray-500 font-medium">
                      {stat.label}
                    </p>

                    <p className="text-3xl font-bold text-gray-800 mt-1">
                      {stat.value}
                    </p>

                  </div>


                  <div
                    className={`p-3 rounded-xl ${colorClasses[stat.color]}`}
                  >

                    <Icon className="w-5 h-5" />

                  </div>

                </div>

              </div>

            );

          })}

        </div>


        {/* ========================================
            Projects
        ======================================== */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">

              <FolderOpen className="w-5 h-5 text-indigo-500" />

              Your Projects

            </h2>


            <span className="text-sm text-gray-500">

              {projects.length} projects

            </span>

          </div>


          {/* Loading */}
          {loading ? (

            <div className="text-center py-12">

              <div className="text-4xl mb-4">
                ⏳
              </div>

              <p className="text-gray-500">
                Loading projects...
              </p>

            </div>


          ) : projects.length === 0 ? (

            /* Empty */
            <div className="text-center py-12">

              <div className="text-6xl mb-4">
                📁
              </div>

              <h3 className="text-lg font-medium text-gray-800">
                No projects yet
              </h3>

              <p className="text-gray-500 mt-1">
                Create your first project to get started
              </p>


              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition"
              >
                Create Project
              </button>

            </div>


          ) : (

            /* Projects Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {projects.map((project) => (

                <div
                  key={project.id}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
                >

                  <div className="flex items-start justify-between">

                    <div className="flex-1">

                      <h3 className="font-semibold text-gray-800">
                        {project.name}
                      </h3>


                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {project.description || 'No description'}
                      </p>


                      <div className="flex items-center gap-2 mt-3">

                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            statusColors[project.status] ||
                            'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {project.status || 'DRAFT'}
                        </span>


                        {project.githubRepoUrl && (

                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            🔗 GitHub
                          </span>

                        )}

                      </div>

                    </div>


                    <div className="flex items-center gap-1 ml-2">

                      {/* View */}
                      <button
                        onClick={() =>
                          navigate(`/projects/${project.id}`)
                        }
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                        title="View"
                      >

                        <Eye className="w-4 h-4 text-gray-500" />

                      </button>


                      {/* Edit */}
                      <button
                        onClick={() =>
                          navigate(`/projects/${project.id}/edit`)
                        }
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                        title="Edit"
                      >

                        <Edit className="w-4 h-4 text-gray-500" />

                      </button>


                      {/* Delete */}
                      <button
                        onClick={() =>
                          handleDeleteProject(
                            project.id,
                            project.name
                          )
                        }
                        className="p-1.5 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >

                        <Trash2 className="w-4 h-4 text-red-500" />

                      </button>

                    </div>

                  </div>


                  <div className="mt-3 pt-3 border-t border-gray-100">

                    <p className="text-xs text-gray-400">

                      Created:{' '}

                      {project.createdAt
                        ? new Date(
                            project.createdAt
                          ).toLocaleDateString()
                        : 'N/A'}

                    </p>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>


      {/* ========================================
          Create Project Modal
      ======================================== */}
      {showCreateModal && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">


            {/* Header */}
            <div className="flex items-center justify-between mb-4">

              <h2 className="text-xl font-bold text-gray-800">
                Create New Project
              </h2>


              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >

                <X className="w-5 h-5 text-gray-500" />

              </button>

            </div>


            {/* Form */}
            <form onSubmit={handleCreateProject}>


              {/* Project Name */}
              <div className="mb-4">

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>

                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="My Awesome API"
                  required
                />

              </div>


              {/* Description */}
              <div className="mb-4">

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>

                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows="3"
                  placeholder="Describe your project..."
                />

              </div>


              {/* GitHub URL */}
              <div className="mb-6">

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Repository URL
                </label>

                <input
                  type="url"
                  value={formData.githubRepoUrl}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      githubRepoUrl: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://github.com/username/repo"
                />

              </div>


              {/* Buttons */}
              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50"
                >

                  {submitting
                    ? 'Creating...'
                    : 'Create Project'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};


export default Dashboard;
