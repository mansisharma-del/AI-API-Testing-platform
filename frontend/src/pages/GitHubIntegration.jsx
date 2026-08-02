import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Code2, 
  RefreshCw, 
  ExternalLink, 
  Check, 
  X, 
  Loader 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { getProject, updateProject } from '../services/project.service.js';

const GitHubIntegration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [repos, setRepos] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) {
      toast.error('Please enter a GitHub repository URL');
      return;
    }

    setSearching(true);
    setTimeout(() => {
      setRepos([
        { id: 1, name: 'api-testing-project', url: repoUrl, description: 'API testing project', stars: 5 },
        { id: 2, name: 'ecommerce-api', url: 'https://github.com/test/ecommerce-api', description: 'E-commerce API', stars: 12 },
        { id: 3, name: 'auth-service', url: 'https://github.com/test/auth-service', description: 'Authentication service', stars: 8 },
      ]);
      setSearching(false);
      toast.success('Found 3 repositories');
    }, 1500);
  };

  const handleConnect = async (repo) => {
    setLoading(true);
    const result = await updateProject(id, { githubRepoUrl: repo.url });
    setLoading(false);

    if (result.success) {
      toast.success(`Connected to ${repo.name} successfully! 🎉`);
      navigate(`/projects/${id}`);
    } else {
      toast.error(result.error || 'Failed to connect repository');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to={`/projects/${id}`} className="p-2 hover:bg-gray-100 rounded-xl transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="flex items-center gap-3">
                <Code2 className="w-6 h-6 text-gray-700" />
                <span className="text-lg font-bold text-gray-800">GitHub Integration</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔗</div>
            <h2 className="text-xl font-bold text-gray-800">Connect GitHub Repository</h2>
            <p className="text-gray-500 mt-1">Connect your GitHub repository to sync API specifications</p>
          </div>

          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-3">
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://github.com/username/repo"
                required
              />
              <button
                type="submit"
                disabled={searching}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {searching ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {repos.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">Found Repositories</h3>
              {repos.map((repo) => (
                <div key={repo.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-800">{repo.name}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          ★ {repo.stars}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{repo.description}</p>
                      <p className="text-xs text-gray-400 mt-1 truncate">{repo.url}</p>
                    </div>
                    <button
                      onClick={() => handleConnect(repo)}
                      disabled={loading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm flex items-center gap-1 disabled:opacity-50"
                    >
                      {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Connect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GitHubIntegration;