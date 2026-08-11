// backend/src/services/report/report-generator.service.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======================================================
// HELPERS
// ======================================================

const escapeHTML = (value) => {
  if (value === null || value === undefined) return '';

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const normalizeResults = (testResults) => {
  return Array.isArray(testResults) ? testResults : [];
};

// ======================================================
// GENERATE TEST REPORT FROM RESULTS
// ======================================================

export const generateTestReport = (
  testResults,
  projectName,
  projectId
) => {
  try {
    const results = normalizeResults(testResults);

    console.log('📊 Generating report for:', projectName);
    console.log('📊 Results count:', results.length);

    // --------------------------------------------------
    // EMPTY REPORT
    // --------------------------------------------------

    if (results.length === 0) {
      return {
        success: true,
        data: {
          projectId,
          projectName,
          generatedAt: new Date().toISOString(),

          summary: {
            total: 0,
            passed: 0,
            failed: 0,
            errors: 0,
            successRate: '0%',
            avgResponseTime: '0ms',
            duration: '0ms'
          },

          results: []
        }
      };
    }

    // --------------------------------------------------
    // SUMMARY
    // --------------------------------------------------

    const total = results.length;

    const passed = results.filter(
      (r) => r?.status === 'PASSED'
    ).length;

    const failed = results.filter(
      (r) => r?.status === 'FAILED'
    ).length;

    const errors = results.filter(
      (r) => r?.status === 'ERROR'
    ).length;

    const successRate =
      total > 0 ? (passed / total) * 100 : 0;

    // --------------------------------------------------
    // RESPONSE TIME
    // --------------------------------------------------

    const validResponseTimes = results
      .map((r) => Number(r?.responseTime))
      .filter((time) => Number.isFinite(time) && time >= 0);

    const avgResponseTime =
      validResponseTimes.length > 0
        ? validResponseTimes.reduce(
            (sum, time) => sum + time,
            0
          ) / validResponseTimes.length
        : 0;

    // --------------------------------------------------
    // TOTAL DURATION
    // --------------------------------------------------

    const totalDuration = results.reduce(
      (sum, r) => {
        const responseTime = Number(r?.responseTime);

        return sum + (
          Number.isFinite(responseTime) && responseTime >= 0
            ? responseTime
            : 0
        );
      },
      0
    );

    // --------------------------------------------------
    // REPORT DATA
    // --------------------------------------------------

    const reportData = {
      projectId,
      projectName,
      generatedAt: new Date().toISOString(),

      summary: {
        total,
        passed,
        failed,
        errors,
        successRate: `${successRate.toFixed(2)}%`,
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        duration: `${totalDuration.toFixed(0)}ms`
      },

      results: results.map((r) => ({
        testCaseId: r?.testCaseId || null,

        method: r?.method || 'GET',

        endpoint: r?.endpoint || '/',

        status: r?.status || 'UNKNOWN',

        responseStatus:
          r?.responseStatus !== undefined
            ? r.responseStatus
            : null,

        responseTime:
          Number.isFinite(Number(r?.responseTime))
            ? Number(r.responseTime)
            : 0,

        responseBody:
          r?.responseBody !== undefined
            ? r.responseBody
            : null,

        errorMessage:
          r?.errorMessage || null,

        expectedStatus:
          r?.expectedStatus !== undefined
            ? r.expectedStatus
            : null,

        passed: r?.status === 'PASSED'
      }))
    };

    console.log('✅ Report data generated successfully');

    return {
      success: true,
      data: reportData
    };
  } catch (error) {
    console.error('❌ Generate report error:', error);

    return {
      success: false,
      error: error.message
    };
  }
};

// ======================================================
// GENERATE HTML REPORT
// ======================================================

export const generateHTMLReport = (reportData) => {
  try {
    if (!reportData) {
      return {
        success: false,
        error: 'Report data is required'
      };
    }

    const {
      projectName = 'Project',
      summary = {},
      results = [],
      generatedAt
    } = reportData;

    const safeResults = normalizeResults(results);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>
    Test Report - ${escapeHTML(projectName)}
  </title>

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        sans-serif;

      background: #f1f5f9;
      padding: 40px 20px;
      color: #1e293b;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow:
        0 4px 6px -1px rgba(0,0,0,0.1);
    }

    .header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 30px;

      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
    }

    .header h1 {
      font-size: 28px;

      background:
        linear-gradient(
          135deg,
          #4f46e5,
          #7c3aed
        );

      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header .subtitle {
      color: #64748b;
      font-size: 14px;
    }

    .stats {
      display: grid;
      grid-template-columns:
        repeat(auto-fit, minmax(150px, 1fr));

      gap: 16px;
      margin: 24px 0 32px;
    }

    .stat-card {
      background: #f8fafc;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      border: 1px solid #e2e8f0;
    }

    .stat-card .number {
      font-size: 32px;
      font-weight: 700;
    }

    .stat-card .label {
      color: #64748b;
      font-size: 14px;
      margin-top: 4px;
    }

    .stat-card.passed .number {
      color: #22c55e;
    }

    .stat-card.failed .number {
      color: #ef4444;
    }

    .stat-card.errors .number {
      color: #f59e0b;
    }

    .stat-card.rate .number {
      color: #3b82f6;
    }

    .stat-card.duration .number {
      color: #8b5cf6;
      font-size: 24px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin: 32px 0 16px;

      display: flex;
      align-items: center;
      gap: 8px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    th {
      background: #f1f5f9;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e2e8f0;
    }

    td {
      padding: 10px 16px;
      border-bottom: 1px solid #f1f5f9;
    }

    tr:hover {
      background: #f8fafc;
    }

    .badge {
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      display: inline-block;
    }

    .badge-passed {
      background: #dcfce7;
      color: #22c55e;
    }

    .badge-failed {
      background: #fee2e2;
      color: #ef4444;
    }

    .badge-error {
      background: #fef3c7;
      color: #f59e0b;
    }

    .badge-unknown {
      background: #e2e8f0;
      color: #475569;
    }

    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 13px;
    }

    @media (max-width: 640px) {
      .container {
        padding: 20px;
      }

      .stats {
        grid-template-columns: repeat(2, 1fr);
      }

      table {
        font-size: 12px;
      }

      th,
      td {
        padding: 8px 10px;
      }
    }
  </style>
</head>

<body>

  <div class="container">

    <!-- Header -->

    <div class="header">

      <div>
        <h1>
          🚀 ${escapeHTML(projectName)}
        </h1>

        <div class="subtitle">
          Test Execution Report
        </div>
      </div>

      <div style="text-align: right;">

        <div
          style="
            font-size: 14px;
            color: #64748b;
          "
        >
          Generated:
        </div>

        <div
          style="
            font-size: 14px;
            font-weight: 500;
          "
        >
          ${
            generatedAt
              ? escapeHTML(
                  new Date(generatedAt).toLocaleString()
                )
              : '-'
          }
        </div>

      </div>

    </div>

    <!-- Stats -->

    <div class="stats">

      <div class="stat-card passed">
        <div class="number">
          ${summary.passed ?? 0}
        </div>

        <div class="label">
          ✅ Passed
        </div>
      </div>

      <div class="stat-card failed">
        <div class="number">
          ${summary.failed ?? 0}
        </div>

        <div class="label">
          ❌ Failed
        </div>
      </div>

      <div class="stat-card errors">
        <div class="number">
          ${summary.errors ?? 0}
        </div>

        <div class="label">
          ⚠️ Errors
        </div>
      </div>

      <div class="stat-card rate">
        <div class="number">
          ${escapeHTML(summary.successRate || '0%')}
        </div>

        <div class="label">
          📈 Success Rate
        </div>
      </div>

      <div class="stat-card duration">
        <div class="number">
          ${escapeHTML(summary.duration || '0ms')}
        </div>

        <div class="label">
          ⏱️ Total Duration
        </div>
      </div>

      <div
        class="stat-card"
        style="border-color: #8b5cf6;"
      >
        <div
          class="number"
          style="
            color: #8b5cf6;
            font-size: 20px;
          "
        >
          ${escapeHTML(
            summary.avgResponseTime || '0ms'
          )}
        </div>

        <div class="label">
          ⚡ Avg Response
        </div>
      </div>

    </div>

    <!-- Results -->

    <div class="section-title">
      📋 Test Results
      (${safeResults.length} tests)
    </div>

    <table>

      <thead>

        <tr>
          <th>#</th>
          <th>Method</th>
          <th>Endpoint</th>
          <th>Status</th>
          <th>Expected</th>
          <th>Actual</th>
          <th>Time</th>
        </tr>

      </thead>

      <tbody>

        ${
          safeResults.length > 0
            ? safeResults
                .map((r, i) => {
                  const status =
                    r?.status || 'UNKNOWN';

                  const badgeClass =
                    status.toLowerCase();

                  return `
                    <tr>

                      <td>
                        ${i + 1}
                      </td>

                      <td>
                        <strong>
                          ${escapeHTML(
                            r?.method || 'GET'
                          )}
                        </strong>
                      </td>

                      <td
                        style="
                          font-family: monospace;
                          font-size: 12px;
                        "
                      >
                        ${escapeHTML(
                          r?.endpoint || '/'
                        )}
                      </td>

                      <td>
                        <span
                          class="
                            badge
                            badge-${escapeHTML(
                              badgeClass
                            )}
                          "
                        >
                          ${escapeHTML(status)}
                        </span>
                      </td>

                      <td>
                        ${escapeHTML(
                          r?.expectedStatus ?? '-'
                        )}
                      </td>

                      <td>
                        ${escapeHTML(
                          r?.responseStatus ?? '-'
                        )}
                      </td>

                      <td>
                        ${
                          Number.isFinite(
                            Number(r?.responseTime)
                          )
                            ? `${Number(
                                r.responseTime
                              ).toFixed(0)}ms`
                            : '-'
                        }
                      </td>

                    </tr>
                  `;
                })
                .join('')
            : `
              <tr>
                <td
                  colspan="7"
                  style="
                    text-align: center;
                    padding: 30px;
                    color: #64748b;
                  "
                >
                  No test results available.
                </td>
              </tr>
            `
        }

      </tbody>

    </table>

    <!-- Footer -->

    <div class="footer">
      AI API Testing Platform •
      Generated by AI-Powered Test Suite
    </div>

  </div>

</body>
</html>
    `;

    return {
      success: true,
      data: html
    };
  } catch (error) {
    console.error(
      '❌ Generate HTML report error:',
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
};

// ======================================================
// GENERATE PDF REPORT
// ======================================================

export const generatePDFReport = (reportData) => {
  return new Promise((resolve, reject) => {
    try {
      if (!reportData) {
        reject(
          new Error('Report data is required')
        );
        return;
      }

      const {
        projectName = 'Project',
        summary = {},
        results = [],
        generatedAt
      } = reportData;

      const safeResults =
        normalizeResults(results);

      const doc = new PDFDocument({
        margin: 25,
        size: 'A4'
      });

      const chunks = [];

      doc.on('data', (chunk) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        try {
          const pdfBuffer =
            Buffer.concat(chunks);

          resolve({
            success: true,
            data: pdfBuffer
          });
        } catch (error) {
          reject(error);
        }
      });

      doc.on('error', reject);

      // --------------------------------------------------
      // HEADER
      // --------------------------------------------------

      doc
        .fontSize(12)
        .fillColor('#4f46e5')
        .text(
          'AI API Testing Platform',
          {
            align: 'center'
          }
        );

      doc.moveDown(0.2);

      doc
        .fontSize(10)
        .fillColor('#1e293b')
        .text(
          `Test Report: ${projectName}`,
          {
            align: 'center'
          }
        );

      doc
        .fontSize(6)
        .fillColor('#64748b')
        .text(
          `Generated: ${
            generatedAt
              ? new Date(
                  generatedAt
                ).toLocaleString()
              : new Date().toLocaleString()
          }`,
          {
            align: 'center'
          }
        );

      doc.moveDown(0.3);

      // --------------------------------------------------
      // SUMMARY
      // --------------------------------------------------

      doc
        .fontSize(6)
        .fillColor('#1e293b')
        .text(
          `Passed: ${summary.passed ?? 0} | ` +
          `Failed: ${summary.failed ?? 0} | ` +
          `Errors: ${summary.errors ?? 0} | ` +
          `Success: ${summary.successRate || '0%'} | ` +
          `Duration: ${summary.duration || '0ms'} | ` +
          `Avg: ${summary.avgResponseTime || '0ms'}`,
          {
            align: 'center',
            width: 530
          }
        );

      doc.moveDown(0.3);

      // --------------------------------------------------
      // TABLE
      // --------------------------------------------------

      let y = doc.y;

      doc.fontSize(6.5);

      const colX = [
        25,
        47,
        85,
        180,
        235
