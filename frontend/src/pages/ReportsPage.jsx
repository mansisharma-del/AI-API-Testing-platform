import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  File,
  Mail,
  RefreshCw,
  Loader,
  Play,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { getProject } from '../services/project.service.js';

// ============================================================
// API CONFIG
// ============================================================

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'https://ai-api-testing-platform.onrender.com/api/v1'
).replace(/\/+$/, '');

// ============================================================
// AUTH
// ============================================================

const getToken = () => {
  return localStorage.getItem('token');
};

// ============================================================
// SAFE RESPONSE PARSER
// ============================================================

const parseResponse = async (response) => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: text,
    };
  }
};

// ============================================================
// REPORT EXTRACTION
// ============================================================

const extractReport = (data) => {
  if (!data) {
    return null;
  }

  // { success: true, report: {...} }
  if (data.success && data.report) {
    return data.report;
  }

  // { report: {...} }
  if (data.report) {
    return data.report;
  }

  // Some APIs return the report directly
  if (
    data.summary ||
    data.results ||
    data.projectName ||
    data.testResults
  ) {
    return data;
  }

  return null;
};

// ============================================================
// REPORTS PAGE
// ============================================================

const ReportsPage = () => {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const [downloadingHTML, setDownloadingHTML] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  // ==========================================================
  // FETCH REPORT
  // ==========================================================

  const fetchReport = useCallback(async () => {
    if (!id) {
      setError('Project ID is missing.');
      setLoading(false);
      return;
    }

    const token = getToken();

    if (!token) {
      setError('Please login first.');
      toast.error('Please login first.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // ------------------------------------------------------
      // STEP 1: GET PROJECT
      // ------------------------------------------------------

      console.log('📦 Getting project:', id);

      const projectData = await getProject(id);

      console.log('📦 Project response:', projectData);

      const loadedProject =
        projectData?.project ||
        projectData?.data ||
        null;

      setProject(loadedProject);

      // ------------------------------------------------------
      // STEP 2: CHECK WHETHER PROJECT ALREADY CONTAINS REPORT
      // ------------------------------------------------------

      if (loadedProject) {
        const projectReport =
          loadedProject.report ||
          loadedProject.testReport ||
          loadedProject.latestReport ||
          loadedProject.testResult ||
          null;

        if (projectReport) {
          console.log(
            '✅ Report found inside project response'
          );

          const extracted = extractReport(projectReport);

          if (extracted) {
            setReport(extracted);
            setError('');
            setLoading(false);
            return;
          }
        }

        // Some project objects contain test suites/results.
        // If there is a completed test run, construct a report
        // from those values.

        const testSuite =
          Array.isArray(loadedProject.testSuites) &&
          loadedProject.testSuites.length > 0
            ? loadedProject.testSuites[
                loadedProject.testSuites.length - 1
              ]
            : null;

        if (testSuite) {
          const hasResults =
            Array.isArray(testSuite.results) &&
            testSuite.results.length > 0;

          const hasTestCases =
            Array.isArray(testSuite.testCases) &&
            testSuite.testCases.length > 0;

          if (hasResults || hasTestCases) {
            const generatedReport = {
              projectName: loadedProject.name,
              summary: {
                passed:
                  Number(testSuite.passedTests) || 0,

                failed:
                  Number(testSuite.failedTests) || 0,

                errors:
                  Number(testSuite.errors) || 0,

                successRate:
                  Number(testSuite.successRate) || 0,
              },

              results:
                testSuite.results ||
                testSuite.testCases ||
                [],
            };

            console.log(
              '✅ Constructed report from project testSuite:',
              generatedReport
            );

            setReport(generatedReport);
            setError('');
            setLoading(false);
            return;
          }
        }
      }

      // ------------------------------------------------------
      // STEP 3: CALL REPORT API
      // ------------------------------------------------------

      const reportUrl =
        `${API_BASE_URL}/reports/${id}?_=${Date.now()}`;

      console.log(
        '📊 Fetching report URL:',
        reportUrl
      );

      const response = await fetch(reportUrl, {
        method: 'GET',

        cache: 'no-store',

        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Cache-Control': 'no-cache, no-store, max-age=0',
          Pragma: 'no-cache',
        },
      });

      console.log(
        '📊 Report HTTP status:',
        response.status
      );

      const data = await parseResponse(response);

      console.log(
        '📊 Report API response:',
        data
      );

      // ------------------------------------------------------
      // HTTP ERROR
      // ------------------------------------------------------

      if (!response.ok) {
        let message =
          data?.error ||
          data?.message ||
          data?.detail ||
          `Failed to fetch report (${response.status})`;

        if (response.status === 404) {
          message =
            'No report exists yet. Run the tests successfully first.';
        }

        if (response.status === 401) {
          message =
            'Your session has expired. Please login again.';
        }

        if (response.status === 403) {
          message =
            'You are not allowed to view this report.';
        }

        setError(message);

        toast.error(message);

        return;
      }

      // ------------------------------------------------------
      // EXTRACT REPORT
      // ------------------------------------------------------

      const extractedReport = extractReport(data);

      if (extractedReport) {
        console.log(
          '✅ Report successfully loaded:',
          extractedReport
        );

        setReport(extractedReport);
        setError('');
        return;
      }

      // ------------------------------------------------------
      // NO REPORT
      // ------------------------------------------------------

      setError(
        'No report data was returned by the backend. Run tests first.'
      );

      toast.error(
        'No report data was returned by the backend.'
      );

    } catch (err) {
      console.error(
        '❌ Fetch report error:',
        err
      );

      setError(
        err?.message ||
        'Failed to connect to the backend.'
      );

      toast.error(
        err?.message ||
        'Failed to fetch report.'
      );

    } finally {
      setLoading(false);
    }
  }, [id]);

  // ==========================================================
  // LOAD REPORT
  // ==========================================================

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ==========================================================
  // DOWNLOAD HELPER
  // ==========================================================

  const downloadFile = async (
    endpoint,
    filename,
    setDownloading
  ) => {
    const token = getToken();

    if (!token) {
      toast.error('Please login first.');
      return;
    }

    try {
      setDownloading(true);

      const url =
        `${API_BASE_URL}${endpoint}?_=${Date.now()}`;

      console.log(
        '⬇️ Download URL:',
        url
      );

      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) {
        const data = await parseResponse(response);

        throw new Error(
          data?.error ||
          data?.message ||
          `Download failed (${response.status})`
        );
      }

      const blob = await response.blob();

      const blobUrl =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement('a');

      link.href = blobUrl;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);

      toast.success(
        `${filename} downloaded successfully!`
      );

    } catch (err) {
      console.error(
        '❌ Download error:',
        err
      );

      toast.error(
        err?.message ||
        'Failed to download report.'
      );

    } finally {
      setDownloading(false);
    }
  };

  // ==========================================================
  // DOWNLOAD HTML
  // ==========================================================

  const downloadHTML = () => {
    downloadFile(
      `/reports/${id}/html`,
      `report-${id}.html`,
      setDownloadingHTML
    );
  };

  // ==========================================================
  // DOWNLOAD PDF
  // ==========================================================

  const downloadPDF = () => {
    downloadFile(
      `/reports/${id}/pdf`,
      `report-${id}.pdf`,
      setDownloadingPDF
    );
  };

  // ==========================================================
  // SEND EMAIL
  // ==========================================================

  const sendEmailReport = async () => {
    if (!email.trim()) {
      toast.error(
        'Please enter an email address.'
      );
      return;
    }

    const token = getToken();

    if (!token) {
      toast.error('Please login first.');
      return;
    }

    try {
      setSending(true);

      const url =
        `${API_BASE_URL}/email/report/${id}`;

      console.log(
        '📧 Email report URL:',
        url
      );

      const response = await fetch(url, {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data =
        await parseResponse(response);

      console.log(
        '📧 Email response:',
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.message ||
          data?.detail ||
          `Email request failed (${response.status})`
        );
      }

      if (
        data.success ||
        data.message
      ) {
        toast.success(
          '📧 Report sent successfully!'
        );

        setEmail('');
      } else {
        toast.error(
          data?.error ||
          'Failed to send report.'
        );
      }

    } catch (err) {
      console.error(
        '❌ Email report error:',
        err
      );

      toast.error(
        err?.message ||
        'Failed to send email report.'
      );

    } finally {
      setSending(false);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster position="top-right" />

        <div className="text-center">
          <Loader className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />

          <p className="text-gray-600">
            Loading report...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // NO REPORT
  // ==========================================================

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Toaster position="top-right" />

        <div className="max-w-4xl mx-auto">

          <Link
            to={`/projects/${id}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />

            Back to Project
          </Link>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">

            <div className="text-6xl mb-4">
              📊
            </div>

            <h2 className="text-2xl font-bold text-gray-800">
              No Report Found
            </h2>

            <p className="text-gray-500 mt-3">
              {error ||
                'Run the tests successfully first to generate a report.'}
            </p>

            {project && (
              <p className="text-xs text-gray-400 mt-3 break-all">
                Project ID: {id}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">

              <button
                onClick={fetchReport}
                className="bg-gray-100 text-gray-700 px-5 py-2 rounded-xl hover:bg-gray-200 transition flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />

                Refresh
              </button>

              <Link
                to={`/projects/${id}`}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <Play className="w-4 h-4" />

                Run Tests
              </Link>

            </div>

          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // NORMALIZE REPORT
  // ==========================================================

  const summary =
    report.summary || {};

  const results = Array.isArray(
    report.results
  )
    ? report.results
    : Array.isArray(report.testResults)
      ? report.testResults
      : [];

  const passed =
    Number(summary.passed) || 0;

  const failed =
    Number(summary.failed) || 0;

  const errors =
    Number(summary.errors) || 0;

  const successRate =
    Number(summary.successRate) || 0;

  const projectName =
    report.projectName ||
    project?.name ||
    'Project';

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div className="min-h-screen bg-gray-50">

      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* BACK */}

        <Link
          to={`/projects/${id}`}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />

          Back to Project
        </Link>

        {/* HEADER */}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">

          <div className="flex items-center justify-between mb-6">

            <div>

              <h1 className="text-2xl font-bold text-gray-800">
                📊 Test Report
              </h1>

              <p className="text-gray-500 mt-1">
                Project: {projectName}
              </p>

            </div>

            <button
              onClick={fetchReport}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Refresh report"
            >
              <RefreshCw className="w-5 h-5 text-gray-500" />
            </button>

          </div>

          {/* SUMMARY */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {passed}
              </div>
              <div className="text-sm text-gray-600">
                ✅ Passed
              </div>
            </div>

            <div className="bg-red-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {failed}
              </div>
              <div className="text-sm text-gray-600">
                ❌ Failed
              </div>
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {errors}
              </div>
              <div className="text-sm text-gray-600">
                ⚠️ Errors
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {successRate}%
              </div>
              <div className="text-sm text-gray-600">
                📈 Success Rate
              </div>
            </div>

          </div>

        </div>

        {/* ACTIONS */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

          <button
            onClick={downloadHTML}
            disabled={downloadingHTML}
            className="bg-indigo-50 text-indigo-600 p-4 rounded-xl hover:bg-indigo-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {downloadingHTML ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <FileText className="w-5 h-5" />
            )}

            {downloadingHTML
              ? 'Downloading...'
              : 'Download HTML'}
          </button>

          <button
            onClick={downloadPDF}
            disabled={downloadingPDF}
            className="bg-purple-50 text-purple-600 p-4 rounded-xl hover:bg-purple-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {downloadingPDF ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <File className="w-5 h-5" />
            )}

            {downloadingPDF
              ? 'Downloading...'
              : 'Download PDF'}
          </button>

          <div className="flex gap-2">

            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="flex-1 min-w-0 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              onClick={sendEmailReport}
              disabled={sending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {sending ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}

              {sending
                ? 'Sending...'
                : 'Send'}
            </button>

          </div>

        </div>

        {/* RESULTS */}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          <div className="p-4 border-b border-gray-100">

            <h3 className="font-semibold text-gray-800">
              📋 Test Results
            </h3>

          </div>

          {results.length === 0 ? (

            <div className="p-10 text-center text-gray-500">
              No individual test results available.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Method
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Endpoint
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Response
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Time (ms)
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {results.map((result, index) => {

                    const status =
                      String(
                        result?.status ||
                        result?.result ||
                        'UNKNOWN'
                      ).toUpperCase();

                    const responseTime =
                      Number(
                        result?.responseTime ||
                        result?.duration ||
                        result?.time ||
                        0
                      );

                    const responseStatus =
                      result?.responseStatus ??
                      result?.statusCode ??
                      result?.response?.status ??
                      '-';

                    return (
                      <tr
                        key={
                          result?._id ||
                          result?.id ||
                          index
                        }
                        className="hover:bg-gray-50 transition"
                      >

                        <td className="px-4 py-3 text-sm text-gray-500">
                          {index + 1}
                        </td>

                        <td className="px-4 py-3 text-sm font-mono">
                          {result?.method || '-'}
                        </td>

                        <td className="px-4 py-3 text-sm font-mono text-gray-600 max-w-xs break-all">
                          {result?.endpoint ||
                            result?.url ||
                            '-'}
                        </td>

                        <td className="px-4 py-3">

                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              status === 'PASSED'
                                ? 'bg-green-100 text-green-700'
                                : status === 'FAILED'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {status}
                          </span>

                        </td>

                        <td className="px-4 py-3 text-sm">
                          {responseStatus}
                        </td>

                        <td className="px-4 py-3 text-sm">
                          {responseTime > 0
                            ? responseTime.toFixed(0)
                            : '-'}
                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

          <div className="p-4 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
            Total: {results.length} tests
          </div>

        </div>

      </div>

    </div>
  );
};

export default ReportsPage;
