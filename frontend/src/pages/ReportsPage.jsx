import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, File, Mail, RefreshCw } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const ReportsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8001/api/v1/reports/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.report) {
        setReport(data.report);
      } else {
        toast.error(data.message || 'No report found. Run tests first.');
      }
    } catch (error) {
      console.error('Fetch report error:', error);
      toast.error('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const downloadHTML = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8001/api/v1/reports/${id}/html`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${Date.now()}.html`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('HTML report downloaded!');
    } catch (error) {
      console.error('Download HTML error:', error);
      toast.error('Failed to download HTML report');
    }
  };

  const downloadPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8001/api/v1/reports/${id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${Date.now()}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF report downloaded!');
    } catch (error) {
      console.error('Download PDF error:', error);
      toast.error('Failed to download PDF report');
    }
  };

  const sendEmailReport = async () => {
    if (!email) {
      toast.error('Please enter email address');
      return;
    }

    try {
      setSending(true);
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
        toast.success('Report sent successfully! 📧');
        setEmail('');
      } else {
        toast.error(data.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Send email error:', error);
      toast.error('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-500">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Link to={`/projects/${id}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </Link>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-800">No Report Found</h2>
            <p className="text-gray-500 mt-2">Run tests first to generate a report</p>
            <Link to={`/projects/${id}`} className="mt-6 inline-block bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition">
              Back to Project
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link to={`/projects/${id}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Project
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">📊 Test Report</h1>
              <p className="text-gray-500">Project: {report.projectName}</p>
            </div>
            <button onClick={fetchReport} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <RefreshCw className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{report.summary.passed}</div>
              <div className="text-sm text-gray-600">✅ Passed</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{report.summary.failed}</div>
              <div className="text-sm text-gray-600">❌ Failed</div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{report.summary.errors}</div>
              <div className="text-sm text-gray-600">⚠️ Errors</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{report.summary.successRate}</div>
              <div className="text-sm text-gray-600">📈 Success Rate</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button onClick={downloadHTML} className="bg-indigo-50 text-indigo-600 p-4 rounded-xl hover:bg-indigo-100 transition flex items-center justify-center gap-2">
            <FileText className="w-5 h-5" />
            Download HTML
          </button>
          <button onClick={downloadPDF} className="bg-purple-50 text-purple-600 p-4 rounded-xl hover:bg-purple-100 transition flex items-center justify-center gap-2">
            <File className="w-5 h-5" />
            Download PDF
          </button>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button 
              onClick={sendEmailReport}
              disabled={sending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">📋 Test Results</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Endpoint</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Response</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time (ms)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.results.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-mono">{result.method}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{result.endpoint}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.status === 'PASSED' ? 'bg-green-100 text-green-700' :
                        result.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {result.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{result.responseStatus || '-'}</td>
                    <td className="px-4 py-3 text-sm">{result.responseTime ? result.responseTime.toFixed(0) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
            Total: {report.results.length} tests
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;