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
  RefreshCw,
  Loader
} from 'lucide-react';
import { getProject, deleteProject } from '../services/project.service.js';
import toast, { Toaster } from 'react-hot-toast';

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

  useEffect(() => {
    fetchProject();
  }, [id]);

  // ✅ Fetch project with test suites
  const fetchProject = async () => {
    try {
      setLoading(true);
      const result = await getProject(id);
      console.log('📦 Project data:', result);
      if (result.success) {
        setProject(result.project);
        setError(null);
      } else {
        setError(result.error || 'Project not found');
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError('Failed to fetch project');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${project?.name}"?`)) {
      const result = await deleteProject(id);
      if (result.success) {
        toast.success('Project deleted successfully!');
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Failed to delete project');
      }
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('URL copied!');
  };

  // ✅ Generate Tests Handler with refresh
  const handleGenerateTests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        return;
      }

      setGeneratingTests(true);
      toast.loading('🤖 Generating AI tests...');

      const response = await fetch(`http://localhost:8001/api/v1/tests/generate/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      toast.dismiss();
      
      if (data.success) {
        toast.success(`✅ ${data.testCases} test cases generated!`);
        await fetchProject(); // ✅ Refresh project data
      } else {
        toast.error(data.error || 'Failed to generate tests');
      }
    } catch (error) {
      toast.dismiss();
      console.error('❌ Generate tests error:', error);
      toast.error('Failed to generate tests. Make sure backend is running.');
    } finally {
      setGeneratingTests(false);
    }
  };

  // ✅ Run Tests Handler with refresh
  const handleRunTests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        return;
      }

      setRunningTests(true);
      toast.loading('🧪 Running tests...');

      const response = await fetch(`http://localhost:8001/api/v1/tests/run/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ baseUrl: 'http://localhost:8001' })
      });
      
      const data = await response.json();
      toast.dismiss();
      
      if (data.success) {
        const { summary } = data;
        const emoji = summary.successRate >= 80 ? '🎉' : summary.successRate >= 60 ? '⚠️' : '❌';
        toast.success(
          `${emoji} Tests completed! ${summary.passed} passed, ${summary.failed} failed (${summary.successRate})`
        );
        setTestSummary(summary);
        await fetchProject(); // ✅ Refresh project data
      } else {
        toast.error(data.error || 'Failed to run tests');
      }
    } catch (error) {
      toast.dismiss();
      console.error('❌ Run tests error:', error);
      toast.error('Failed to run tests. Make sure backend is running.');
    } finally {
      setRunningTests(false);
    }
  };

  // ✅ Send Email Report Handler
  const handleSendEmailReport = async () => {
    if (!email) {
      toast.error('Please enter email address');
      return;
    }

    try {
      setSendingEmail(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8001/api/v1/email/report/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('📧 Report sent successfully!');
        setEmail('');
        setShowEmailModal(false);
      } else {
        toast.error(data.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('❌ Send email error:', error);
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-600',
    ANALYZING: 'bg-yellow-100 text-yellow-600',
    READY: 'bg-blue-100 text-blue-600',
    TESTING: 'bg-purple-100 text-purple-600',
    ERROR: 'bg-red-100 text-red-600',
  };

  const statusIcons = {
    DRAFT: '📄',
    ANALYZING: '⏳',
    READY: '✅',
    TESTING: '🧪',
    ERROR: '❌',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-500">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl max-w-md text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <p className="font-semibold">{error || 'Project not found'}</p>
          <Link to="/dashboard" className="mt-4 inline-block text-indigo-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ✅ Get test stats from project
  const testSuite = project?.testSuites?.[0];
  const totalTests = testSuite?.testCases?.length || 0;
  const passedTests = testSuite?.passedTests || 0;
  const failedTests = testSuite?.failedTests || 0;
  const successRate = testSuite?.successRate || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-xl">
                  <span className="text-white text-xl">📁</span>
                </div>
                <span className="text-lg font-bold text-gray-800 truncate max-w-xs">
                  {project.name}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/projects/${id}/edit`)}
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
                <span className={`text-xs px-3 py-1 rounded-full ${statusColors[project.status] || 'bg-gray-100 text-gray-600'}`}>
                  {statusIcons[project.status]} {project.status || 'DRAFT'}
                </span>
              </div>
              <p className="text-gray-600">{project.description || 'No description provided'}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Updated: {new Date(project.updatedAt).toLocaleDateString()}
                </span>
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button 
            onClick={handleGenerateTests}
            disabled={generatingTests}
            className={`bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 rounded-2xl shadow-lg shadow-indigo-500/30 hover:shadow-xl transition flex items-center justify-center gap-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
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

          <button 
            onClick={handleRunTests}
            disabled={runningTests}
            className={`bg-white border border-gray-200 p-4 rounded-2xl hover:shadow-md transition flex items-center justify-center gap-3 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
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

          <button 
            onClick={() => navigate(`/projects/${id}/reports`)}
            className="bg-white border border-gray-200 p-4 rounded-2xl hover:shadow-md transition flex items-center justify-center gap-3 text-gray-700 font-semibold"
          >
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            View Reports
          </button>

          <button 
            onClick={() => setShowEmailModal(true)}
            className="bg-white border border-gray-200 p-4 rounded-2xl hover:shadow-md transition flex items-center justify-center gap-3 text-gray-700 font-semibold"
          >
            <Mail className="w-5 h-5 text-indigo-500" />
            Email Report
          </button>
        </div>

        {/* Test Summary (if available) */}
        {testSummary && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-4 mb-8 border border-green-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <span className="text-2xl">📊</span>
                <div>
                  <h3 className="font-semibold text-gray-800">Last Test Run</h3>
                  <p className="text-sm text-gray-600">
                    {testSummary.passed} passed, {testSummary.failed} failed, {testSummary.errors} errors
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-green-600">
                  Success Rate: {testSummary.successRate}
                </span>
                <span className="text-sm text-gray-500">
                  Total: {testSummary.total} tests
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ✅ GitHub Integration Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-gray-700" />
              GitHub Integration
            </h2>
            <button 
              onClick={() => navigate(`/projects/${id}/github`)}
              className="text-sm text-indigo-600 hover:underline"
            >
              {project.githubRepoUrl ? 'Update' : 'Connect GitHub'}
            </button>
          </div>
          {project.githubRepoUrl ? (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-700">
                ✅ Connected to: <span className="font-medium">{project.githubRepoUrl}</span>
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
              <div className="text-3xl mb-2">🔗</div>
              <p className="text-gray-500">No GitHub repository connected</p>
              <button 
                onClick={() => navigate(`/projects/${id}/github`)}
                className="mt-3 text-sm text-indigo-600 hover:underline"
              >
                Connect GitHub Repository
              </button>
            </div>
          )}
        </div>

        {/* ✅ AI Test Generation Section - Updated with real data */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              AI Test Generation
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm font-medium text-gray-700">
                {totalTests} Tests Generated
              </p>
              <p className="text-xs text-gray-500">
                {totalTests > 0 ? '✅ Ready to run' : '⏳ Waiting for AI'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-sm font-medium text-gray-700">
                {passedTests} Passing
              </p>
              <p className="text-xs text-gray-500">Tests passed</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">❌</div>
              <p className="text-sm font-medium text-gray-700">
                {failedTests} Failing
              </p>
              <p className="text-xs text-gray-500">Tests failed</p>
            </div>
          </div>
          {totalTests > 0 && (
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-500">
                Success Rate: <span className="font-semibold text-green-600">{successRate.toFixed(1)}%</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-500" />
                Send Report via Email
              </h2>
              <button
                onClick={() => setShowEmailModal(false)}
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
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
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