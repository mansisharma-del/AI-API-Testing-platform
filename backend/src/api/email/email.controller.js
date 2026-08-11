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
    console.log('📁 Project ID:', projectId);
    console.log('👤 User ID:', userId);
    console.log('📨 Requested email:', email);
    console.log('📨 Recipients:', recipients);


    // ======================================================
    // AUTH CHECK
    // ======================================================

    if (!userId) {
      console.log('❌ User ID missing');

      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please login again.'
      });
    }


    // ======================================================
    // GET TOKEN
    // ======================================================

    const token =
      req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : '';

    console.log(
      '🔐 Authorization token:',
      token ? '✅ Received' : '❌ Missing'
    );


    // ======================================================
    // EMAIL CONFIG CHECK
    // ======================================================

    const configCheck = checkEmailConfig();

    console.log('📧 Email configuration:', configCheck);

    if (!configCheck.configured) {
      console.log('❌ Email is not configured');

      return res.status(400).json({
        success: false,
        error: configCheck.message || 'Email is not configured'
      });
    }


    // ======================================================
    // GET PROJECT
    // ======================================================

    console.log('🔍 Finding project...');

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId
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


    if (!project) {
      console.log('❌ Project not found');

      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }


    console.log('✅ Project found:', project.name);


    // ======================================================
    // GET TEST SUITE
    // ======================================================

    const testSuite = project.testSuites?.[0];

    if (!testSuite) {
      console.log('❌ No test suite found');

      return res.status(404).json({
        success: false,
        error: 'No tests found for this project'
      });
    }


    console.log('✅ Test suite found:', testSuite.id);


    // ======================================================
    // GET ALL TEST RESULTS
    // ======================================================

    const allResults = testSuite.testCases.flatMap(
      (testCase) => testCase.testResults || []
    );


    console.log('📊 Test results:', allResults.length);


    if (allResults.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No test results found. Run tests first.'
      });
    }


    // ======================================================
    // GENERATE REPORT
    // ======================================================

    console.log('📊 Generating report...');

    const report = generateTestReport(
      allResults,
      project.name,
      project.id
    );


    if (!report?.success) {
      console.log('❌ Report generation failed:', report?.error);

      return res.status(500).json({
        success: false,
        error: report?.error || 'Failed to generate report'
      });
    }


    console.log('✅ Report generated successfully');


    // ======================================================
    // CREATE REPORT DOWNLOAD URLS
    // ======================================================

    const baseUrl =
      `${req.protocol}://${req.get('host')}`;

    const downloadUrls = {
      html: `${baseUrl}/api/v1/reports/${projectId}/html`,
      pdf: `${baseUrl}/api/v1/reports/${projectId}/pdf`
    };


    console.log('📊 HTML Report URL:', downloadUrls.html);
    console.log('📄 PDF Report URL:', downloadUrls.pdf);


    // ======================================================
    // DETERMINE RECIPIENTS
    // ======================================================

    const authenticatedUserEmail =
      req.user?.email ||
      req.user?.emailAddress ||
      null;

    const requestedRecipients = Array.isArray(recipients)
      ? recipients
      : [];

    const finalRecipients =
      requestedRecipients.length > 0
        ? requestedRecipients
        : email
          ? [email]
          : authenticatedUserEmail
            ? [authenticatedUserEmail]
            : [];


    console.log('📨 Final recipients:', finalRecipients);


    if (finalRecipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email is required'
      });
    }


    // ======================================================
    // SEND EMAIL
    // ======================================================

    console.log('📧 Sending report email...');

    const emailResult = await sendTestReportEmail({
      projectName: project.name,
      report: report.data,
      downloadUrls,
      recipients: finalRecipients,
      token
    });


    console.log('📧 Email result:', emailResult);


    // ======================================================
    // EMAIL FAILED
    // ======================================================

    if (!emailResult.success) {
      console.log('❌ Email sending failed');

      return res.status(500).json({
        success: false,
        error: emailResult.error || 'Failed to send email',

        // Helpful for Render logs/debugging
        code: emailResult.code || null,
        responseCode: emailResult.responseCode || null
      });
    }


    // ======================================================
    // SUCCESS
    // ======================================================

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

    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    console.error('Error response:', error?.response);
    console.error('Response code:', error?.responseCode);
    console.error('Command:', error?.command);
    console.error('Stack:', error?.stack);

    console.error('========================================');


    return res.status(500).json({
      success: false,

      error:
        error?.message ||
        'Failed to send email',

      code:
        error?.code ||
        null,

      responseCode:
        error?.responseCode ||
        null,

      response:
        error?.response ||
        null
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
        error:
          configCheck.message ||
          'Email is not configured'
      });
    }


    const emailResult = await sendWelcomeEmail({
      to: email,
      name: name || 'User'
    });


    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error:
          emailResult.error ||
          'Failed to send welcome email',

        code: emailResult.code || null,
        responseCode: emailResult.responseCode || null
      });
    }


    return res.status(200).json({
      success: true,
      message: 'Welcome email sent successfully',
      details: emailResult
    });

  } catch (error) {

    console.error('❌ Send welcome error:', error);

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        'Failed to send welcome email'
    });
  }
};


// ======================================================
// EMAIL CONFIGURATION STATUS
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
      error:
        error?.message ||
        'Failed to check email configuration'
    });
  }
};
