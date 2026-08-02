import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import config from '../../core/config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate test report from results
export const generateTestReport = (testResults, projectName, projectId) => {
  try {
    console.log('📊 Generating report for:', projectName);
    console.log('📊 Results count:', testResults.length);

    // If no results, return empty report
    if (!testResults || testResults.length === 0) {
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

    const total = testResults.length;
    const passed = testResults.filter(r => r.status === 'PASSED').length;
    const failed = testResults.filter(r => r.status === 'FAILED').length;
    const errors = testResults.filter(r => r.status === 'ERROR').length;
    const successRate = total > 0 ? (passed / total) * 100 : 0;

    // Calculate average response time
    const validResponseTimes = testResults
      .filter(r => r.responseTime)
      .map(r => r.responseTime);
    const avgResponseTime = validResponseTimes.length > 0
      ? validResponseTimes.reduce((a, b) => a + b, 0) / validResponseTimes.length
      : 0;

    // Calculate total duration
    const totalDuration = testResults.reduce((sum, r) => sum + (r.responseTime || 0), 0);

    const reportData = {
      projectId,
      projectName,
      generatedAt: new Date().toISOString(),
      summary: {
        total,
        passed,
        failed,
        errors,
        successRate: successRate.toFixed(2) + '%',
        avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
        duration: totalDuration.toFixed(0) + 'ms'
      },
      results: testResults.map(r => ({
        testCaseId: r.testCaseId,
        method: r.method || 'GET',
        endpoint: r.endpoint || '/',
        status: r.status || 'UNKNOWN',
        responseStatus: r.responseStatus || null,
        responseTime: r.responseTime || 0,
        responseBody: r.responseBody || null,
        errorMessage: r.errorMessage || null,
        expectedStatus: r.expectedStatus || null,
        passed: r.status === 'PASSED'
      }))
    };

    console.log('✅ Report data generated successfully');
    return { success: true, data: reportData };
  } catch (error) {
    console.error('❌ Generate report error:', error);
    return { success: false, error: error.message };
  }
};

// Generate HTML report
export const generateHTMLReport = (reportData) => {
  try {
    const { projectName, summary, results, generatedAt } = reportData;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Report - ${projectName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .header { 
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
    }
    .header h1 { 
      font-size: 28px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .header .subtitle { color: #64748b; font-size: 14px; }
    .stats { 
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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
    .stat-card.passed .number { color: #22c55e; }
    .stat-card.failed .number { color: #ef4444; }
    .stat-card.errors .number { color: #f59e0b; }
    .stat-card.rate .number { color: #3b82f6; }
    .stat-card.duration .number { color: #8b5cf6; font-size: 24px; }
    
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
    tr:hover { background: #f8fafc; }
    
    .badge {
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      display: inline-block;
    }
    .badge-passed { background: #dcfce7; color: #22c55e; }
    .badge-failed { background: #fee2e2; color: #ef4444; }
    .badge-error { background: #fef3c7; color: #f59e0b; }
    
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 13px;
    }
    
    @media (max-width: 640px) {
      .container { padding: 20px; }
      .stats { grid-template-columns: repeat(2, 1fr); }
      table { font-size: 12px; }
      th, td { padding: 8px 10px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div>
        <h1>🚀 ${projectName}</h1>
        <div class="subtitle">Test Execution Report</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 14px; color: #64748b;">Generated:</div>
        <div style="font-size: 14px; font-weight: 500;">${new Date(generatedAt).toLocaleString()}</div>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats">
      <div class="stat-card passed">
        <div class="number">${summary.passed}</div>
        <div class="label">✅ Passed</div>
      </div>
      <div class="stat-card failed">
        <div class="number">${summary.failed}</div>
        <div class="label">❌ Failed</div>
      </div>
      <div class="stat-card errors">
        <div class="number">${summary.errors}</div>
        <div class="label">⚠️ Errors</div>
      </div>
      <div class="stat-card rate">
        <div class="number">${summary.successRate}</div>
        <div class="label">📈 Success Rate</div>
      </div>
      <div class="stat-card duration">
        <div class="number" style="font-size: 20px;">${summary.duration || 'N/A'}</div>
        <div class="label">⏱️ Total Duration</div>
      </div>
      <div class="stat-card" style="border-color: #8b5cf6;">
        <div class="number" style="color: #8b5cf6; font-size: 20px;">${summary.avgResponseTime || 'N/A'}</div>
        <div class="label">⚡ Avg Response</div>
      </div>
    </div>

    <!-- Results Table -->
    <div class="section-title">📋 Test Results (${results.length} tests)</div>
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
        ${results.map((r, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><strong>${r.method}</strong></td>
            <td style="font-family: monospace; font-size: 12px;">${r.endpoint}</td>
            <td>
              <span class="badge badge-${r.status.toLowerCase()}">${r.status}</span>
            </td>
            <td>${r.expectedStatus || '-'}</td>
            <td>${r.responseStatus || '-'}</td>
            <td>${r.responseTime ? r.responseTime.toFixed(0) + 'ms' : '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Footer -->
    <div class="footer">
      AI API Testing Platform • Generated by AI-Powered Test Suite
    </div>
  </div>
</body>
</html>
    `;

    return { success: true, data: html };
  } catch (error) {
    console.error('Generate HTML report error:', error);
    return { success: false, error: error.message };
  }
};

// ✅ Generate PDF report - FORCED 1 PAGE (Max 70 Tests) - FIXED ALIGNMENT
export const generatePDFReport = (reportData) => {
  return new Promise((resolve, reject) => {
    try {
      const { projectName, summary, results, generatedAt } = reportData;
      const doc = new PDFDocument({ margin: 25, size: 'A4' });
      
      const chunks = [];
      doc.on('data', chunks.push.bind(chunks));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve({ success: true, data: pdfBuffer });
      });
      doc.on('error', reject);

      // --- 1. Ultra-Compact Header ---
      doc.fontSize(12).fillColor('#4f46e5').text('AI API Testing Platform', { align: 'center' });
      doc.moveDown(0.2);
      doc.fontSize(10).fillColor('#1e293b').text(`Test Report: ${projectName}`, { align: 'center' });
      doc.fontSize(6).fillColor('#64748b').text(`Generated: ${new Date(generatedAt).toLocaleString()}`, { align: 'center' });
      doc.moveDown(0.3);

      // --- 2. Summary (Inline) ---
      doc.fontSize(6).fillColor('#1e293b');
      doc.text(
        `Passed: ${summary.passed}  |  Failed: ${summary.failed}  |  Errors: ${summary.errors}  |  Success: ${summary.successRate}  |  Duration: ${summary.duration}  |  Avg: ${summary.avgResponseTime}`, 
        { align: 'center', width: 500 }
      );
      doc.moveDown(0.3);

      // --- 3. Compact Table ---
      const pageHeight = doc.page.height - doc.page.margins.bottom; // ~790
      let y = doc.y;
      
      doc.fontSize(6.5); 

      // Removed 'Err' and 'Pass' columns to maximize space
      const colX = [25, 47, 85, 180, 235, 280, 330, 370];
      const colWidths = [22, 38, 95, 55, 45, 50, 40, 50];
      const headers = ['#', 'Method', 'Endpoint', 'Status', 'Exp.', 'Actual', 'Time', 'Result'];

      // Header Row
      doc.rect(25, y, 530, 10).fill('#f1f5f9');
      doc.fillColor('#1e293b');
      headers.forEach((h, i) => {
        doc.text(h, colX[i], y + 2, { width: colWidths[i], align: 'left' });
      });
      y += 10; 

      // --- 4. Draw Rows (Limit to max 70) ---
      const maxRowsToDraw = 70; 
      
      for (let index = 0; index < Math.min(results.length, maxRowsToDraw); index++) {
        const result = results[index];

        if (index % 2 === 0) doc.rect(25, y, 530, 10).fill('#f8fafc');

        doc.fillColor('#1e293b');
        
        doc.text((index + 1).toString(), colX[0], y + 2, { width: colWidths[0], align: 'left' });
        doc.text(result.method || 'GET', colX[1], y + 2, { width: colWidths[1] });
        const endpoint = (result.endpoint || '/').length > 20 ? (result.endpoint || '/').slice(0, 18) + '..' : (result.endpoint || '/');
        doc.text(endpoint, colX[2], y + 2, { width: colWidths[2] });
        
        const status = result.status || 'UNKNOWN';
        if (status === 'PASSED') doc.fillColor('#22c55e');
        else if (status === 'FAILED') doc.fillColor('#ef4444');
        else if (status === 'ERROR') doc.fillColor('#f59e0b');
        else doc.fillColor('#1e293b');
        doc.text(status, colX[3], y + 2, { width: colWidths[3] });
        
        doc.fillColor('#1e293b');
        doc.text(result.expectedStatus?.toString() || '-', colX[4], y + 2, { width: colWidths[4] });
        doc.text(result.responseStatus?.toString() || '-', colX[5], y + 2, { width: colWidths[5] });
        doc.text(result.responseTime ? result.responseTime.toFixed(0) + 'ms' : '-', colX[6], y + 2, { width: colWidths[6] });
        doc.text(result.passed ? 'Pass' : 'Fail', colX[7], y + 2, { width: colWidths[7] });

        y += 10; 
      }

      // --- 5. Handle Overflows (For the remaining 10 tests) ---
      if (results.length > maxRowsToDraw) {
        doc.moveDown(0.2);
        doc.fontSize(5).fillColor('#ef4444');
        
        // 🛑 FIXED: Added '25' as the starting x position to match the table
        doc.text(
          `* Report limited to ${maxRowsToDraw} tests. ${results.length - maxRowsToDraw} additional tests are available in the HTML report.`,
          25, // <--- Starts exactly at the left edge of the table!
          doc.y, 
          { align: 'center', width: 530 } // <--- Spans exactly the width of the table!
        );
      }

      // --- 6. Footer ---
      doc.moveDown(0.5);
      doc.fontSize(5).fillColor('#94a3b8').text(
        `Generated by AI API Testing Platform • ${new Date().toLocaleString()}`,
        { align: 'center' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Save report to file
export const saveReport = (reportData, projectId) => {
  try {
    const reportsDir = path.join(__dirname, '../../../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `report-${projectId}-${timestamp}.json`;
    const filepath = path.join(reportsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2));

    console.log(`✅ Report saved: ${filepath}`);
    return { success: true, filepath, filename };
  } catch (error) {
    console.error('Save report error:', error);
    return { success: false, error: error.message };
  }
};

// Get all reports for a project
export const getProjectReports = (projectId) => {
  try {
    const reportsDir = path.join(__dirname, '../../../reports');
    if (!fs.existsSync(reportsDir)) {
      return { success: true, data: [] };
    }

    const files = fs.readdirSync(reportsDir);
    const reports = [];

    for (const file of files) {
      if (file.includes(`report-${projectId}-`)) {
        const filepath = path.join(reportsDir, file);
        const content = fs.readFileSync(filepath, 'utf8');
        const stats = fs.statSync(filepath);
        reports.push({
          filename: file,
          data: JSON.parse(content),
          createdAt: stats.mtime,
          size: stats.size
        });
      }
    }

    // Sort by creation date (newest first)
    reports.sort((a, b) => b.createdAt - a.createdAt);

    return { success: true, data: reports };
  } catch (error) {
    console.error('Get reports error:', error);
    return { success: false, error: error.message };
  }
};