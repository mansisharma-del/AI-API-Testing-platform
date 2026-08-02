import { prisma } from '../../core/database/prisma.js';
import { 
  sendTestReportEmail, 
  sendWelcomeEmail,
  checkEmailConfig
} from '../../services/email/email.service.js';
import config from '../../core/config/index.js';
import { generateTestReport } from '../../services/report/report-generator.service.js';

// @desc    Send test report via email
// @route   POST /api/v1/email/report/:projectId
export const sendReportEmail = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email, recipients } = req.body;
    const userId = req.userId;

    // Check if email is configured
    const configCheck = checkEmailConfig();
    if (!configCheck.configured) {
      return res.status(400).json({
        success: false,
        error: 'Email not configured. Please set SMTP credentials.'
      });
    }

    // Get project
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: userId },
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
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    const testSuite = project.testSuites[0];
    if (!testSuite) {
      return res.status(404).json({ 
        success: false,
        error: 'No tests found' 
      });
    }

    const allResults = testSuite.testCases.flatMap(tc => tc.testResults);
    if (allResults.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'No test results found. Run tests first.' 
      });
    }

    // Generate report
    const report = generateTestReport(allResults, project.name, project.id);
    if (!report.success) {
      return res.status(500).json({ 
        success: false,
        error: report.error 
      });
    }

    // Create download URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const downloadUrls = {
      html: `${baseUrl}/api/v1/reports/${projectId}/html`,
      pdf: `${baseUrl}/api/v1/reports/${projectId}/pdf`
    };

    // Send email
    const emailResult = await sendTestReportEmail({
      to: email || req.user.email,
      projectName: project.name,
      report: report.data,
      downloadUrls,
      recipients: recipients || [email || req.user.email]
    });

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: emailResult.error || 'Failed to send email'
      });
    }

    res.json({
      success: true,
      message: 'Report sent successfully',
      details: emailResult
    });
  } catch (error) {
    console.error('❌ Send report email error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to send email' 
    });
  }
};

// @desc    Send welcome email
// @route   POST /api/v1/email/welcome
export const sendWelcome = async (req, res) => {
  try {
    const { email, name } = req.body;

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
        error: emailResult.error
      });
    }

    res.json({
      success: true,
      message: 'Welcome email sent'
    });
  } catch (error) {
    console.error('Send welcome error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send welcome email' 
    });
  }
};

// @desc    Check email configuration
// @route   GET /api/v1/email/status
export const getEmailStatus = async (req, res) => {
  const configCheck = checkEmailConfig();
  res.json({
    success: true,
    ...configCheck
  });
};