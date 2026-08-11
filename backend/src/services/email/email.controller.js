import { prisma } from '../../core/database/prisma.js';

import {
  sendTestReportEmail,
  sendWelcomeEmail,
  checkEmailConfig
} from '../../services/email/email.service.js';

import { generateTestReport } from '../../services/report/report-generator.service.js';


// ======================================================
// SEND TEST REPORT VIA EMAIL
// POST /api/v1/email/report/:projectId
// ======================================================

export const sendReportEmail = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email, recipients } = req.body;

    const userId = req.userId;

    console.log('========================================');
    console.log('📧 SEND REPORT EMAIL');
    console.log('========================================');
    console.log('📌 Project ID:', projectId);
    console.log('👤 User ID:', userId);
    console.log('📨 Email:', email);
    console.log('📨 Recipients:', recipients);

    // --------------------------------------------------
    // Check authentication
    // --------------------------------------------------

    if (!userId) {
      console.log('❌ User ID missing from request');

      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please login again.'
      });
    }

    if (!projectId) {
      console.log('❌ Project ID missing');

      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    // --------------------------------------------------
    // Check email configuration
    // --------------------------------------------------

    const configCheck = checkEmailConfig();

    console.log('📧 Email config:', configCheck);

    if (!configCheck.configured) {
      return res.status(400).json({
        success: false,
        error: 'Email not configured. Please set SMTP credentials.'
      });
    }

    // --------------------------------------------------
    // Get project BY ID first
    // --------------------------------------------------
    // IMPORTANT:
    // Do NOT combine ownerId in this query.
    // This allows us to know whether the project itself
    // exists or whether the user ownership is the issue.
    // --------------------------------------------------

    console.log('🔍 Searching project by ID:', projectId);

    const project = await prisma.project.findUnique({
      where: {
        id: projectId
      },
      include: {
        testSuites: {
          include: {
            testCases: {
              include: {
                testResults: true
              }
            }
          }
        }
      }
    });

    // --------------------------------------------------
    // Project does not exist
    // --------------------------------------------------

    if (!project) {
      console.log('❌ Project does NOT exist in database');
      console.log('❌ Requested project ID:', projectId);

      return res.status(404).json({
        success: false,
        error: 'Project not found',
        projectId
      });
    }

    console.log('✅ Project found:', project.id);
    console.log('📛 Project name:', project.name);
    console.log('👤 Project owner:', project.ownerId);

    // --------------------------------------------------
    // Verify project ownership
    // --------------------------------------------------

    if (project.ownerId !== userId) {
      console.log('❌ Project ownership mismatch');
      console.log('📌 Project owner:', project.ownerId);
      console.log('👤 Request user:', userId);

      return res.status(403).json({
        success: false,
        error: 'You do not have permission to send this project report'
      });
    }

    console.log('✅ Project ownership verified');

    // --------------------------------------------------
    // Get test suite
    // --------------------------------------------------

    const testSuite = project.testSuites[0];

    if (!testSuite) {
      console.log('❌ No test suite found');

      return res.status(404).json({
        success: false,
        error: 'No tests found for this project'
      });
    }

    console.log('✅ Test suite found:', testSuite.id);

    // --------------------------------------------------
    // Get all test results
    // --------------------------------------------------

    const allResults = testSuite.testCases.flatMap(
      (testCase) => testCase.testResults
    );

    console.log('📊 Test cases:', testSuite.testCases.length);
    console.log('📊 Test results:', allResults.length);

    if (allResults.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No test results found. Run tests first.'
      });
    }

    // --------------------------------------------------
    // Generate report
    // --------------------------------------------------

    console.log('📊 Generating test report...');

    const report = generateTestReport(
      allResults,
      project.name,
      project.id
    );

    if (!report.success) {
      console.log('❌ Report generation failed:', report.error);

      return res.status(500).json({
        success: false,
        error: report.error || 'Failed to generate report'
      });
    }

    console.log('✅ Report generated successfully');

    // --------------------------------------------------
    // Create report download URLs
    // --------------------------------------------------

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const downloadUrls = {
      html: `${baseUrl}/api/v1/reports/${project.id}/html`,
      pdf: `${baseUrl}/api/v1/reports/${project.id}/pdf`
    };

    console.log('🔗 HTML report URL:', downloadUrls.html);
    console.log('🔗 PDF report URL:', downloadUrls.pdf);

    // --------------------------------------------------
    // Get authorization token
    // --------------------------------------------------

    const token =
      req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : '';

    console.log(
      '🔐 Authorization token:',
      token ? '✅ Received' : '❌ Missing'
    );

    // --------------------------------------------------
    // Determine recipients
    // --------------------------------------------------

    const recipientList =
      recipients && Array.isArray(recipients) && recipients.length > 0
        ? recipients
        : email
          ? [email]
          : [];

    if (recipientList.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email is required'
      });
    }

    console.log('📨 Final recipients:', recipientList);

    // --------------------------------------------------
    // Send email
    // --------------------------------------------------

    console.log('📧 Sending report email...');

    const emailResult = await sendTestReportEmail({
      to: email,
      projectName: project.name,
      report: report.data,
      downloadUrls,
      recipients: recipientList,
      token
    });

    console.log('📧 Email result:', emailResult);

    // --------------------------------------------------
    // Email failed
    // --------------------------------------------------

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: emailResult.error || 'Failed to send email',
        details: emailResult
      });
    }

    // --------------------------------------------------
    // Success
    // --------------------------------------------------

    console.log('========================================');
    console.log('✅ REPORT EMAIL SENT SUCCESSFULLY');
    console.log('========================================');

    return res.status(200).json({
      success: true,
      message: 'Report sent successfully',
      details: emailResult
    });

  } catch (error) {
    console.error('========================================');
    console.error('❌ SEND REPORT EMAIL ERROR');
    console.error('========================================');
    console.error(error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email'
    });
  }
};


// ======================================================
// SEND WELCOME EMAIL
// POST /api/v1/email/welcome
// ======================================================

export const sendWelcome = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const configCheck = checkEmailConfig();

    if (!configCheck.configured) {
      return res.status(400).json({
        success: false,
        error: 'Email not configured'
      });
    }

    const emailResult = await sendWelcomeEmail({
      to: email,
      name: name || 'User'
    });

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: emailResult.error || 'Failed to send welcome email'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Welcome email sent'
    });

  } catch (error) {
    console.error('❌ Send welcome error:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send welcome email'
    });
  }
};


// ======================================================
// EMAIL STATUS
// GET /api/v1/email/status
// ======================================================

export const getEmailStatus = async (req, res) => {
  try {
    const configCheck = checkEmailConfig();

    return res.status(200).json({
      success: true,
      ...configCheck
    });

  } catch (error) {
    console.error('❌ Email status error:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to check email status'
    });
  }
};
