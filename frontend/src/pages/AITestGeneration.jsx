import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  Loader, 
  CheckCircle, 
  XCircle, 
  Zap, 
  Code, 
  FileText, 
  Play,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Copy,
  Check
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// ... rest of the code remains same
const AITestGeneration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [tests, setTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [expandedTest, setExpandedTest] = useState(null);
  const [copied, setCopied] = useState(false);

  // Sample test data for demonstration
  const sampleTests = [
    { 
      id: 1, 
      method: 'GET', 
      endpoint: '/api/users', 
      category: 'Positive', 
      status: 'pending', 
      expected: 200,
      description: 'Fetch all users with valid authentication',
      headers: { 'Authorization': 'Bearer token', 'Content-Type': 'application/json' },
      requestBody: null,
      responseExample: { users: [{ id: 1, name: 'John Doe', email: 'john@example.com' }] }
    },
    { 
      id: 2, 
      method: 'POST', 
      endpoint: '/api/users', 
      category: 'Positive', 
      status: 'pending', 
      expected: 201,
      description: 'Create a new user with valid data',
      headers: { 'Authorization': 'Bearer token', 'Content-Type': 'application/json' },
      requestBody: { name: 'Jane Doe', email: 'jane@example.com', password: 'secure123' },
      responseExample: { id: 2, name: 'Jane Doe', email: 'jane@example.com' }
    },
    { 
      id: 3, 
      method: 'GET', 
      endpoint: '/api/users/{id}', 
      category: 'Negative', 
      status: 'pending', 
      expected: 404,
      description: 'Fetch non-existent user',
      headers: { 'Authorization': 'Bearer token', 'Content-Type': 'application/json' },
      requestBody: null,
      responseExample: { error: 'User not found' }
    },
    { 
      id: 4, 
      method: 'PUT', 
      endpoint: '/api/users/{id}', 
      category: 'Boundary', 
      status: 'pending', 
      expected: 400,
      description: 'Update user with invalid email format',
      headers: { 'Authorization': 'Bearer token', 'Content-Type': 'application/json' },
      requestBody: { email: 'invalid-email' },
      responseExample: { error: 'Invalid email format' }
    },
    { 
      id: 5, 
      method: 'DELETE', 
      endpoint: '/api/users/{id}', 
      category: 'Security', 
      status: 'pending', 
      expected: 401,
      description: 'Delete user without authentication',
      headers: { 'Content-Type': 'application/json' },
      requestBody: null,
      responseExample: { error: 'Unauthorized' }
    },
    { 
      id: 6, 
      method: 'POST', 
      endpoint: '/api/auth/login', 
      category: 'Positive', 
      status: 'pending', 
      expected: 200,
      description: 'Login with valid credentials',
      headers: { 'Content-Type': 'application/json' },
      requestBody: { email: 'test@example.com', password: 'password123' },
      responseExample: { token: 'eyJhbGciOiJIUzI1NiIs...' }
    },
    { 
      id: 7, 
      method: 'GET', 
      endpoint: '/api/products', 
      category: 'Positive', 
      status: 'pending', 
      expected: 200,
      description: 'Fetch all products with pagination',
      headers: { 'Authorization': 'Bearer token', 'Content-Type': 'application/json' },
      requestBody: null,
      responseExample: { products: [{ id: 1, name: 'Product A', price: 99.99 }] }
    },
    { 
      id: 8, 
      method: 'POST', 
      endpoint: '/api/products', 
      category: 'Negative', 
      status: 'pending', 
      expected: 400,
      description: 'Create product with missing required fields',
      headers: { 'Authorization': 'Bearer token', 'Content-Type': 'application/json' },
      requestBody: { name: 'Product B' },
      responseExample: { error: 'Price is required' }
    },
  ];

  const handleGenerateTests = () => {
    setGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      setTests(sampleTests);
      setSelectedTests(sampleTests.map(t => t.id));
      setGenerating(false);
      toast.success(`Generated ${sampleTests.length} test cases! 🎉`);
    }, 2000);
  };

  const toggleTestSelection = (id) => {
    setSelectedTests(prev =>
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const toggleAllTests = () => {
    if (selectedTests.length === tests.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(tests.map(t => t.id));
    }
  };

  const handleRunTests = () => {
    if (selectedTests.length === 0) {
      toast.error('Please select at least one test to run');
      return;
    }
    toast.success(`Running ${selectedTests.length} tests... 🧪`);
    // Simulate test execution
    setTimeout(() => {
      toast.success(`✅ ${selectedTests.length} tests completed!`);
    }, 2000);
  };

  const handleExportTests = () => {
    const selected = tests.filter(t => selectedTests.includes(t.id));
    const data = JSON.stringify(selected, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-suite-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Tests exported successfully! 📥');
  };

  const handleCopyTest = (test) => {
    const text = JSON.stringify(test, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Test copied to clipboard!');
  };

  const getMethodColor = (method) => {
    const colors = {
      GET: 'bg-green-100 text-green-700 border-green-200',
      POST: 'bg-blue-100 text-blue-700 border-blue-200',
      PUT: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      DELETE: 'bg-red-100 text-red-700 border-red-200',
      PATCH: 'bg-purple-100 text-purple-700 border-purple-200',
    };
    return colors[method] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getCategoryColor = (category) => {
    const colors = {
      Positive: 'bg-emerald-100 text-emerald-700',
      Negative: 'bg-red-100 text-red-700',
      Boundary: 'bg-amber-100 text-amber-700',
      Security: 'bg-purple-100 text-purple-700',
      Performance: 'bg-blue-100 text-blue-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4 text-gray-400" />,
      passed: <CheckCircle className="w-4 h-4 text-green-500" />,
      failed: <XCircle className="w-4 h-4 text-red-500" />,
      running: <Loader className="w-4 h-4 text-blue-500 animate-spin" />,
    };
    return icons[status] || icons.pending;
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pending',
      passed: 'Passed',
      failed: 'Failed',
      running: 'Running',
    };
    return texts[status] || 'Pending';
  };

  const getFilteredTests = () => {
    if (filter === 'all') return tests;
    return tests.filter(t => t.category === filter);
  };

  const filteredTests = getFilteredTests();
  const categories = ['all', 'Positive', 'Negative', 'Boundary', 'Security', 'Performance'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to={`/projects/${id}`} className="p-2 hover:bg-gray-100 rounded-xl transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-2 rounded-xl">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-800">AI Test Generation</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 hidden sm:block">
                {tests.length} tests generated
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Generate Button Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                AI-Powered Test Generation
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Our AI analyzes your API specification and generates comprehensive test cases automatically
              </p>
            </div>
            <button
              onClick={handleGenerateTests}
              disabled={generating}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-lg shadow-indigo-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Tests with AI
                </>
              )}
            </button>
          </div>

          {generating && (
            <div className="mt-4 bg-indigo-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Loader className="w-5 h-5 animate-spin text-indigo-600" />
                <span className="text-indigo-600 font-medium">
                  AI is analyzing your API specification...
                </span>
                <span className="text-sm text-indigo-400 ml-auto">This may take a few seconds</span>
              </div>
              <div className="mt-2 w-full bg-indigo-200 rounded-full h-1.5">
                <div className="bg-indigo-600 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}

          {tests.length > 0 && !generating && (
            <div className="mt-4 bg-emerald-50 rounded-xl p-3 text-sm text-emerald-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Successfully generated {tests.length} test cases for your API
            </div>
          )}
        </div>

        {/* Tests Section */}
        {tests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-gray-800">Test Cases</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                  {selectedTests.length} selected
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filter */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilter(cat)}
                      className={`px-3 py-1 text-xs rounded-lg transition ${
                        filter === cat
                          ? 'bg-white shadow-sm text-gray-800'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {cat === 'all' ? 'All' : cat}
                    </button>
                  ))}
                </div>

                <div className="w-px h-6 bg-gray-200" />

                <button
                  onClick={toggleAllTests}
                  className="text-xs text-gray-500 hover:text-gray-700 transition px-2 py-1"
                >
                  {selectedTests.length === tests.length ? 'Deselect All' : 'Select All'}
                </button>

                <button
                  onClick={handleRunTests}
                  className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition flex items-center gap-1.5 text-sm"
                >
                  <Play className="w-3.5 h-3.5" />
                  Run
                </button>

                <button
                  onClick={handleExportTests}
                  className="border border-gray-200 text-gray-600 px-4 py-1.5 rounded-lg hover:bg-gray-50 transition flex items-center gap-1.5 text-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
              </div>
            </div>

            {/* Test List */}
            <div className="divide-y divide-gray-100">
              {filteredTests.map((test) => (
                <div
                  key={test.id}
                  className={`p-4 transition ${
                    selectedTests.includes(test.id) ? 'bg-indigo-50/30' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedTests.includes(test.id)}
                      onChange={() => toggleTestSelection(test.id)}
                      className="mt-1.5 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono border ${getMethodColor(test.method)}`}>
                          {test.method}
                        </span>
                        <span className="text-sm font-mono text-gray-700 truncate">{test.endpoint}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(test.category)}`}>
                          {test.category}
                        </span>
                        <span className="text-xs text-gray-400">Expected: {test.expected}</span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          {getStatusIcon(test.status)}
                          {getStatusText(test.status)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mt-1">{test.description}</p>

                      {/* Expandable Details */}
                      {expandedTest === test.id && (
                        <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Headers:</span>
                            <pre className="mt-1 bg-gray-800 text-gray-100 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(test.headers, null, 2)}
                            </pre>
                          </div>
                          {test.requestBody && (
                            <div>
                              <span className="font-medium text-gray-700">Request Body:</span>
                              <pre className="mt-1 bg-gray-800 text-gray-100 p-2 rounded text-xs overflow-x-auto">
                                {JSON.stringify(test.requestBody, null, 2)}
                              </pre>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-700">Expected Response:</span>
                            <pre className="mt-1 bg-gray-800 text-gray-100 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(test.responseExample, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => setExpandedTest(expandedTest === test.id ? null : test.id)}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition"
                        title="View Details"
                      >
                        {expandedTest === test.id ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCopyTest(test)}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition"
                        title="Copy"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between text-sm text-gray-500">
              <span>
                Showing {filteredTests.length} of {tests.length} tests
              </span>
              <div className="flex items-center gap-4">
                <span>✅ {tests.filter(t => t.status === 'passed').length} passed</span>
                <span>❌ {tests.filter(t => t.status === 'failed').length} failed</span>
                <span>⏳ {tests.filter(t => t.status === 'pending').length} pending</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {tests.length === 0 && !generating && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-800">No Tests Generated Yet</h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              Click the "Generate Tests with AI" button above to let our AI analyze your API
              and create comprehensive test cases automatically.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-gray-400">
              <span className="flex items-center gap-1">✅ Positive tests</span>
              <span className="flex items-center gap-1">❌ Negative tests</span>
              <span className="flex items-center gap-1">🔒 Security tests</span>
              <span className="flex items-center gap-1">⚡ Performance tests</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AITestGeneration;