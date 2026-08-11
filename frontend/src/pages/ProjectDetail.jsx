
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Code2,
  Sparkles,
  Play,
  BarChart3,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Mail,
  Loader
} from 'lucide-react';
import { getProject, deleteProject } from '../services/project.service.js';
import toast, { Toaster } from 'react-hot-toast';

// ============================================================
// API BASE URL
// ============================================================
// Vercel:
// VITE_API_BASE_URL=https://ai-api-testing-platform.onrender.com/api/v1
//
// Local development fallback:
// The Render URL is used as fallback so production never calls
// localhost:8001.
// ============================================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://ai-api-testing-platform.onrender.com/api/v1';

// ============================================================
// Helper: Get authentication token
// ============================================================

const getToken = () => {
  return localStorage.getItem('token');
};

// ============================================================
// Project Detail Component
// ============================================================

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [copied, setCopied] = useState(false);

  const [runningTests, setRunningTests] = useState(false);
  const [generatingTests, setGeneratingTests] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const [email, setEmail] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  const [testSummary, setTestSummary] = useState(null);

  // ============================================================
  // Fetch Project
  // ============================================================

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📦 Fetching project:', id);

      const result = await getProject(id);

      console.log('📦 Project response:', result);

      if (result?.success) {
        setProject(result.project);
        setError(null);
      } else {
        setError(result?.error || 'Project not found');
      }
    } catch (err) {
      console.error('❌ Fetch project error:', err);
      setError('Failed to fetch project');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Delete Project
  // ============================================================

  const handleDelete = async () => {
    if (!project) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"?`
    );

    if (!confirmed) return;

    try {
      const result = await deleteProject(id);

      if (result?.success) {
        toast.success('Project deleted successfully!');
        navigate('/dashboard');
      } else {
        toast.error(result?.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('❌ Delete project error:', error);
      toast.error('Failed to delete project');
    }
  };

  // ============================================================
  // Copy Current URL
  // ============================================================

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);

      toast.success('URL copied!');
    } catch (error) {
      console.error('❌ Copy URL error:', error);
      toast.error('Failed to copy URL');
    }
  };

  // ============================================================
  // Generate AI Tests
  // ============================================================

  const handleGenerateTests = async () => {
    const token = getToken();

    if (!token) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }

    try {
      setGeneratingTests(true);

      const toastId = toast.loading('🤖 Generating AI tests...');

      console.log(
        '🤖 Generate tests URL:',
        `${API_BASE_URL}/tests/generate/${id}`
      );

      const response = await fetch(
        `${API_BASE_URL}/tests/generate/${id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log(
        '🤖 Generate tests status:',
        response.status
      );

      let data;

      try {
        data = await response.json();
      } catch (jsonError) {
        console.error(
          '❌ Generate tests JSON error:',
          jsonError
        );

        toast.dismiss(toastId);
        toast.error('Invalid response from backend');
        return;
      }

      console.log('🤖 Generate tests response:', data);

      toast.dismiss(toastId);

      if (response.ok && data?.success) {
        const testCount =
          data.testCases ??
          data.testCaseCount ??
          data.count ??
          0;

        toast.success(
          `✅ ${testCount} test cases generated!`
        );

        await fetchProject();
      } else {
        toast.error(
          data?.error ||
            data?.message ||
            `Failed to generate tests (${response.status})`
        );
      }
    } catch (error) {
      console.error('❌ Generate tests error:', error);

      toast.error(
        'Failed to generate tests. Please check the backend.'
      );
    } finally {
      setGeneratingTests(false);
    }
  };

  // ============================================================
  // Run Tests
  // ============================================================

  const handleRunTests = async () => {
    const token = getToken();

    if (!token) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }

    try {
      setRunningTests(true);

      const toastId = toast.loading('🧪 Running tests...');

      console.log(
        '🧪 Run tests URL:',
        `${API_BASE_URL}/tests/run/${id}`
      );

      /*
       * IMPORTANT:
       * Previously this was:
       *
       * baseUrl: 'http://localhost:8001'
       *
       * That only works on your own computer.
       *
       * For deployment, use the Render API URL.
       */

      const response = await fetch(
        `${API_BASE_URL}/tests/run/${id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            baseUrl: API_BASE_URL
          })
        }
      );

      console.log(
        '🧪 Run tests status:',
        response.status
      );

      let data;

      try {
        data = await response.json();
      } catch (jsonError) {
        console.error(
          '❌ Run tests JSON error:',
          jsonError
        );

        toast.dismiss(toastId);
        toast.error('Invalid response from backend');
        return;
      }

      console.log('🧪 Run tests response:', data);

      toast.dismiss(toastId);

      if (response.ok && data?.success) {
        const summary = data.summary || {};

        const successRate =
          Number(summary.successRate) || 0;

        const emoji =
          successRate >= 80
            ? '🎉'
            : successRate >= 60
              ? '⚠️'
              : '❌';

        toast.success(
          `${emoji} Tests completed! ${
            summary.passed || 0
          } passed, ${
            summary.failed || 0
          } failed (${summary.successRate ?? 0}%)`
        );

        setTestSummary(summary);

        await fetchProject();
      } else {
        toast.error(
          data?.error ||
            data?.message ||
            `Failed to run tests (${response.status})`
        );
      }
    } catch (error) {
      console.error('❌ Run tests error:', error);

      toast.error(
        'Failed to run tests. Please check the backend.'
      );
    } finally {
      setRunningTests(false);
    }
  };

  // ============================================================
  // Send Email Report
  // ============================================================

  const handleSendEmailReport = async () => {
    if (!email.trim()) {
      toast.error('Please enter email address');
      return;
    }

    const token = getToken();

    if (!token) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }

    try {
      setSendingEmail(true);

      console.log(
        '📧 Email report URL:',
        `${API_BASE_URL}/email/report/${id}`
      );

      const response = await fetch(
        `${API_BASE_URL}/email/report/${id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            email: email.trim()
          })
        }
      );

      console.log(
        '📧 Email report status:',
        response.status
      );

      let data;

      try {
        data = await response.json();
      } catch (jsonError) {
        console.error(
          '❌ Email response JSON error:',
          jsonError
        );

        toast.error('Invalid response from backend');
        return;
      }

      console.log('📧 Email report response:', data);

      if (response.ok && data?.success) {
        toast.success('📧 Report sent successfully!');

        setEmail('');
        setShowEmailModal(false);
      } else {
        toast.error(
          data?.error ||
            data?.message ||
            `Failed to send email (${response.status})`
        );
      }
    } catch (error) {
      console.error('❌ Send email error:', error);

      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  // ============================================================
  // Status Styles
  // ============================================================

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-600',
    ANALYZING: 'bg-yellow-100 text-yellow-600',
    READY: 'bg-blue-100 text-blue-600',
    TESTING: 'bg-purple-100 text-purple-600',
    ERROR: 'bg-red-100 text-red-600'
  };

  const statusIcons = {
    DRAFT: '📄',
    ANALYZING: '⏳',
    READY: '✅',
    TESTING: '🧪',
    ERROR: '❌'
  };

  // ============================================================
  // Loading State
  // ============================================================

  if (loading) {
    return (
      <>
        <Toaster position="top-right" />

        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-3">⏳</div>

            <p className="text-gray-600 font-medium">
              Loading project...
            </p>
          </div>
        </div>
      </>
    );
  }

  // ============================================================
  // Error State
  // ============================================================

  if (error || !project) {
    return (
      <>
        <Toaster position="top-right" />

        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-md w-full">
            <div className="text-4xl mb-3">⚠️</div>

            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {error || 'Project not found'}
            </h2>

            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  // ============================================================
  // Test Statistics
  // ============================================================

  const testSuite = project?.testSuites?.[0];

  const totalTests =
    testSuite?.testCases?.length || 0;

  const passedTests =
    testSuite?.passedTests || 0;

  const failedTests =
    testSuite?.failedTests || 0;

  const successRate =
    Number(testSuite?.successRate) || 0;

  const projectStatus =
    project.status || 'DRAFT';

  // ============================================================
  // Main UI
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* ========================================================
          Navbar
      ======================================================== */}

      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            <div className="flex items-center gap-4 min-w-0">
              <Link
                to="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-xl transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>

              <div className="flex items-center gap-3 min-w-0">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-xl">
                  <span className="text-white text-xl">
                    📁
                  </span>
                </div>

                <span className="text-lg font-bold text-gray-800 truncate max-w-xs">
                  {project.name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  navigate(`/projects/${id}/edit`)
                }
                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition text-sm font-medium flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>

              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition text-sm font-medium flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ========================================================
          Main Content
      ======================================================== */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ======================================================
            Project Header
        ====================================================== */}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-800">
                  {project.name}
                </h1>

                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    statusColors[projectStatus] ||
                    'bg-gray-100 text-gray-600'
                  }`}
                >
                  {statusIcons[projectStatus] || '📄'}{' '}
                  {projectStatus}
                </span>
              </div>

              <p className="text-gray-600">
                {project.description ||
                  'No description provided'}
              </p>

              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">

                {project.createdAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Created:{' '}
                    {new Date(
                      project.createdAt
                    ).toLocaleDateString()}
                  </span>
                )}

                {project.updatedAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Updated:{' '}
                    {new Date(
                      project.updatedAt
                    ).toLocaleDateString()}
                  </span>
                )}

                {project.githubRepoUrl && (
                  <a
                    href={project.githubRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-indigo-600 hover:underline"
                  >
                    <Code2 className="w-4 h-4" />
                    GitHub Repository
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy URL
                </>
              )}
            </button>
          </div>
        </div>

        {/* ======================================================
            Quick Actions
        ====================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

          {/* Generate Tests */}

          <button
            onClick={handleGenerateTests}
            disabled={generatingTests}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 rounded-2xl shadow-lg shadow-indigo-500/30 hover:shadow-xl transition flex items-center justify-center gap-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingTests ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Tests
              </>
            )}
          </button>

          {/* Run Tests */}

          <button
            onClick={handleRunTests}
            disabled={runningTests || totalTests === 0}
            className="bg-white border border-gray-200 p-4 rounded-2xl hover:shadow-md transition flex items-center justify-center gap-3 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {runningTests ? (
              <>
                <Loader className="w-5 h-5 animate-spin text-indigo-500" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 text-indigo-500" />
                Run Tests
              </>
            )}
          </button>

          {/* Reports */}

          <button
            onClick={() =>
              navigate(`/projects/${id}/reports`)
            }
            className="bg-white border border-gray-200 p-4 rounded-2xl hover:shadow-md transition flex items-center justify-center gap-3 text-gray-700 font-semibold"
          >
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            View Reports
          </button>

          {/* Email */}

          <button
            onClick={() => setShowEmailModal(true)}
            className="bg-white border border-gray-200 p-4 rounded-2xl hover:shadow-md transition flex items-center justify-center gap-3 text-gray-700 font-semibold"
          >
            <Mail className="w-5 h-5 text-indigo-500" />
            Email Report
          </button>
        </div>

        {/* ======================================================
            Test Summary
        ====================================================== */}

        {testSummary && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-4 mb-8 border border-green-200">
            <div className="flex items-center justify-between flex-wrap gap-4">

              <div className="flex items-center gap-4">
                <span className="text-2xl">
                  📊
                </span>

                <div>
                  <h3 className="font-semibold text-gray-800">
                    Last Test Run
                  </h3>

                  <p className="text-sm text-gray-600">
                    {testSummary.passed || 0} passed,{' '}
                    {testSummary.failed || 0} failed,{' '}
                    {testSummary.errors || 0} errors
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-green-600">
                  Success Rate:{' '}
                  {testSummary.successRate ?? 0}%
                </span>

                <span className="text-sm text-gray-500">
                  Total:{' '}
                  {testSummary.total ||
                    testSummary.totalTests ||
                    0}{' '}
                  tests
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================
            GitHub Integration
        ====================================================== */}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-gray-700" />
              GitHub Integration
            </h2>

            <button
              onClick={() =>
                navigate(`/projects/${id}/github`)
              }
              className="text-sm text-indigo-600 hover:underline"
            >
              {project.githubRepoUrl
                ? 'Update'
                : 'Connect GitHub'}
            </button>
          </div>

          {project.githubRepoUrl ? (
            <div className="bg-gray-50 rounded-xl p-4">

              <p className="text-sm text-gray-700 break-all">
                ✅ Connected to:{' '}
                <span className="font-medium">
                  {project.githubRepoUrl}
                </span>
              </p>

              <a
                href={project.githubRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 text-sm text-indigo-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                View Repository
              </a>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">
                🔗
              </div>

              <p className="text-gray-500">
                No GitHub repository connected
              </p>

              <button
                onClick={() =>
                  navigate(`/projects/${id}/github`)
                }
                className="mt-3 text-sm text-indigo-600 hover:underline"
              >
                Connect GitHub Repository
              </button>
            </div>
          )}
        </div>

        {/* ======================================================
            AI Test Generation
        ====================================================== */}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              AI Test Generation
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">
                📊
              </div>

              <p className="text-sm font-medium text-gray-700">
                {totalTests} Tests Generated
              </p>

              <p className="text-xs text-gray-500">
                {totalTests > 0
                  ? '✅ Ready to run'
                  : '⏳ Waiting for AI'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">
                ✅
              </div>

              <p className="text-sm font-medium text-gray-700">
                {passedTests} Passing
              </p>

              <p className="text-xs text-gray-500">
                Tests passed
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">
                ❌
              </div>

              <p className="text-sm font-medium text-gray-700">
                {failedTests} Failing
              </p>

              <p className="text-xs text-gray-500">
                Tests failed
              </p>
            </div>
          </div>

          {totalTests > 0 && (
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-500">
                Success Rate:{' '}
                <span className="font-semibold text-green-600">
                  {successRate.toFixed(1)}%
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          Email Modal
      ======================================================== */}

      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">

            <div className="flex items-center justify-between mb-4">

              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-500" />
                Send Report via Email
              </h2>

              <button
                onClick={() =>
                  setShowEmailModal(false)
                }
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Send the test report to your email address
            </p>

            <div className="mb-4">

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <div className="flex gap-3">

              <button
                onClick={() =>
                  setShowEmailModal(false)
                }
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleSendEmailReport}
                disabled={sendingEmail}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sendingEmail ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
