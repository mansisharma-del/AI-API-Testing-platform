
import config from '../../core/config/index.js';
import jwt from 'jsonwebtoken';
import { prisma } from '../../core/database/prisma.js';
import { 
  generateTestReport, 
  generateHTMLReport, 
  generatePDFReport,
  saveReport,
  getProjectReports
} from '../../services/report/report-generator.service.js';

// @desc    Get test report for a project
// @route   GET /api/v1/reports/:projectId
export const getReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    console.log('🔍 Getting report for project:', projectId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: userId },
      include: {
        testSuites: {
          include: {
            testCases: {
              include: {
                testResults: {
                  orderBy: { executedAt: 'desc' },
                  take: 100
                }
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
      return res.json({
        success: true,
        report: null,
        message: 'No tests found for this project'
      });
    }

    const allResults = testSuite.testCases.flatMap(tc => tc.testResults);

    if (allResults.length === 0) {
      return res.json({
        success: true,
        report: null,
        message: 'No test results found. Run tests first.'
      });
    }

    const report = generateTestReport(allResults, project.name, project.id);
    
    if (!report.success) {
      return res.status(500).json({ 
        success: false,
        error: report.error 
      });
    }

    const saved = saveReport(report.data, project.id);

    res.json({
      success: true,
      report: report.data,
      saved: saved.success,
      filepath: saved.filepath
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get report' 
    });
  }
};

// @desc    Download HTML report (with token support)
// @route   GET /api/v1/reports/:projectId/html
export const downloadHTMLReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log('📄 Downloading HTML report for project:', projectId);
    console.log('📄 Query params:', req.query);
    console.log('📄 Headers:', req.headers.authorization);
    
    // ✅ Get token from query params OR headers
    
    const token = req.query.token || req.headers.authorization?.split(' ')[1];
    
    console.log('📄 Token:', token ? '✅ Received' : '❌ Missing');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: No token provided'
      });
    }

    // ✅ Verify token
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
      console.log('✅ Token verified, User ID:', userId);
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: userId }
    });

    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    const testSuite = await prisma.testSuite.findFirst({
      where: { projectId: project.id },
      include: {
        testCases: {
          include: {
            testResults: true
          }
        }
      }
    });

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
        error: 'No test results found' 
      });
    }

    const report = generateTestReport(allResults, project.name, project.id);
    
    if (!report.success) {
      return res.status(500).json({ 
        success: false,
        error: report.error 
      });
    }

    const htmlResult = generateHTMLReport(report.data);
    if (!htmlResult.success) {
      return res.status(500).json({ 
        success: false,
        error: htmlResult.error 
      });
    }

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename=report-${project.name}-${Date.now()}.html`);
    res.send(htmlResult.data);
  } catch (error) {
    console.error('Download HTML error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate HTML report' 
    });
  }
};

// @desc    Download PDF report (with token support)
// @route   GET /api/v1/reports/:projectId/pdf
export const downloadPDFReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log('📄 Downloading PDF report for project:', projectId);
    console.log('📄 Query params:', req.query);
    console.log('📄 Headers:', req.headers.authorization);
    
    // ✅ Get token from query params OR headers
    
    const token = req.query.token || req.headers.authorization?.split(' ')[1];
    console.log('📄 Token from query:', req.query.token);
    console.log('📄 Token from header:', req.headers.authorization);
    console.log('📄 Token:', token ? '✅ Received' : '❌ Missing');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: No token provided'
      });
    }

    // ✅ Verify token
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
      console.log('✅ Token verified, User ID:', userId);
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: userId }
    });

    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    const testSuite = await prisma.testSuite.findFirst({
      where: { projectId: project.id },
      include: {
        testCases: {
          include: {
            testResults: true
          }
        }
      }
    });

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
        error: 'No test results found' 
      });
    }

    const report = generateTestReport(allResults, project.name, project.id);
    
    if (!report.success) {
      return res.status(500).json({ 
        success: false,
        error: report.error 
      });
    }

    const pdfResult = await generatePDFReport(report.data);
    if (!pdfResult.success) {
      return res.status(500).json({ 
        success: false,
        error: pdfResult.error 
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${project.name}-${Date.now()}.pdf`);
    res.send(pdfResult.data);
  } catch (error) {
    console.error('Download PDF error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate PDF report' 
    });
  }
};

// @desc    Get all reports for a project
// @route   GET /api/v1/reports/:projectId/list
export const getReportsList = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: userId }
    });

    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    const reports = getProjectReports(projectId);

    res.json({
      success: true,
      reports: reports.data,
      count: reports.data.length
    });
  } catch (error) {
    console.error('Get reports list error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get reports' 
    });
  }
};