
import { prisma } from '../../core/database/prisma.js';
import { generateTestsFromSpec } from '../../services/ai/openai.service.js';
import { executeTestSuite, getTestSummary } from '../../services/executor/test-executor.service.js';
import config from '../../core/config/index.js';

// @desc    Generate tests using AI (fallback)
// @route   POST /api/v1/tests/generate/:projectId
export const generateTests = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    console.log('🔍 Generating tests for project:', projectId);

    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Project ID is required' 
      });
    }

    // ✅ Find project
    const project = await prisma.project.findFirst({
      where: { 
        id: projectId, 
        ownerId: userId 
      }
    });

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    console.log('📁 Project found:', project.name);

    // ✅ Create API spec
    const apiSpec = {
      openapi: '3.0.0',
      info: { title: project.name, version: '1.0.0' },
      paths: {
        '/api/users': {
          get: { summary: 'Get all users' },
          post: { summary: 'Create user' }
        },
        '/api/users/{id}': {
          get: { summary: 'Get user by id' },
          put: { summary: 'Update user' },
          delete: { summary: 'Delete user' }
        },
        '/api/auth/login': {
          post: { summary: 'Login user' }
        },
        '/api/products': {
          get: { summary: 'Get products' },
          post: { summary: 'Create product' }
        }
      }
    };

    // ✅ Generate tests
    const generatedTests = await generateTestsFromSpec(apiSpec);
    
    if (!generatedTests || !generatedTests.testCases) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to generate tests' 
      });
    }

    console.log('✅ Generated tests:', generatedTests.testCases.length);

    // ✅ DELETE EXISTING TESTS - Fixed with try-catch
    try {
      // Find existing test suites
      const existingSuites = await prisma.testSuite.findMany({
        where: { projectId: project.id }
      });

      if (existingSuites && existingSuites.length > 0) {
        for (const suite of existingSuites) {
          // Delete test cases for each suite
          await prisma.testCase.deleteMany({
            where: { suiteId: suite.id }
          });
          // Delete the suite
          await prisma.testSuite.delete({
            where: { id: suite.id }
          });
        }
        console.log('🗑️ Old tests deleted');
      } else {
        console.log('ℹ️ No existing tests to delete');
      }
    } catch (deleteError) {
      console.log('⚠️ Error deleting old tests:', deleteError.message);
      // Continue anyway
    }

    // ✅ Create test suite
    const testSuite = await prisma.testSuite.create({
      data: {
        projectId: project.id,
        name: `${project.name} - AI Generated Tests`,
        userId: userId,
        totalTests: generatedTests.testCases.length
      }
    });

    console.log('📁 Test suite created:', testSuite.id);

    // ✅ Create test cases
    const testCases = generatedTests.testCases.map((test, index) => ({
      suiteId: testSuite.id,
      category: test.category || 'POSITIVE',
      method: test.method || 'GET',
      endpoint: test.endpoint || '/',
      // requestHeaders: test.headers || {},
      requestHeaders: JSON.stringify(test.headers || {}),
      // requestBody: test.body || null,
      requestBody: test.body ? JSON.stringify(test.body) : null,
      expectedStatus: test.expectedStatus || 200,
      description: test.description || `Test ${index + 1}`,
      isGenerated: true,
      isActive: true
    }));

    await prisma.testCase.createMany({
      data: testCases
    });

    console.log('✅ Test cases created:', testCases.length);

    // ✅ Update project status
    await prisma.project.update({
      where: { id: project.id },
      data: { status: 'READY' }
    });

    res.json({
      success: true,
      testSuite,
      testCases: testCases.length,
      tests: testCases
    });
  } catch (error) {
    console.error('❌ Generate tests error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to generate tests' 
    });
  }
};

// @desc    Get all tests for a project
// @route   GET /api/v1/tests/:projectId
export const getTests = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Project ID is required' 
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
        testCases: true
      }
    });

    if (!testSuite) {
      return res.json({
        success: true,
        testSuite: null,
        tests: []
      });
    }

    res.json({
      success: true,
      testSuite,
      tests: testSuite.testCases
    });
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get tests' 
    });
  }
};

// @desc    Run tests
// @route   POST /api/v1/tests/run/:projectId
export const runTests = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { baseUrl } = req.body;
    const userId = req.userId;

    console.log('🧪 Running tests for project:', projectId);

    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Project ID is required' 
      });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: userId },
      include: {
        testSuites: {
          include: {
            testCases: {
              where: { isActive: true }
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
    if (!testSuite || testSuite.testCases.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No test cases found. Generate tests first.' 
      });
    }

    console.log(`🧪 Running ${testSuite.testCases.length} tests...`);

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'TESTING' }
    });

    // Execute tests
    const results = await executeTestSuite(
      testSuite.testCases,
      baseUrl || 'http://localhost:8001'
    );

    // Calculate summary
    const summary = getTestSummary(results);

    // Save results
    const runId = `run_${Date.now()}`;
    const testResults = results.map(r => ({
      testCaseId: r.testCaseId,
      runId: runId,
      status: r.status,
      responseStatus: r.responseStatus,
      responseBody: r.responseBody,
      responseTime: r.responseTime,
      errorMessage: r.errorMessage || null
    }));

    await prisma.testResult.createMany({
      data: testResults
    });

    // Update test suite stats
    await prisma.testSuite.update({
      where: { id: testSuite.id },
      data: {
        totalTests: testSuite.testCases.length,
        passedTests: summary.passed,
        failedTests: summary.failed,
        successRate: parseFloat(summary.successRate),
        lastRunAt: new Date()
      }
    });

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'READY' }
    });

    res.json({
      success: true,
      runId: runId,
      summary: {
        total: summary.total,
        passed: summary.passed,
        failed: summary.failed,
        errors: summary.errors,
        successRate: summary.successRate
      },
      results: results
    });
  } catch (error) {
    console.error('Run tests error:', error);
    
    try {
      const { projectId } = req.params;
      if (projectId) {
        await prisma.project.update({
          where: { id: projectId },
          data: { status: 'ERROR' }
        });
      }
    } catch (updateError) {
      console.error('Failed to update project status:', updateError);
    }

    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to run tests' 
    });
  }
};

// @desc    Get test results
// @route   GET /api/v1/tests/results/:projectId
export const getTestResults = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Project ID is required' 
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
                  take: 50
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
        results: [],
        summary: { total: 0, passed: 0, failed: 0, errors: 0, successRate: '0%' }
      });
    }

    const allResults = testSuite.testCases.flatMap(tc => tc.testResults);
    const summary = getTestSummary(allResults);

    res.json({
      success: true,
      summary,
      results: allResults.slice(0, 50)
    });
  } catch (error) {
    console.error('Get test results error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get test results' 
    });
  }
};

// @desc    Delete all tests
// @route   DELETE /api/v1/tests/:projectId
export const deleteTests = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Project ID is required' 
      });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: userId },
      include: { testSuites: true }
    });

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    for (const suite of project.testSuites) {
      await prisma.testCase.deleteMany({
        where: { suiteId: suite.id }
      });
      await prisma.testSuite.delete({
        where: { id: suite.id }
      });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'DRAFT' }
    });

    res.json({
      success: true,
      message: 'All tests deleted successfully'
    });
  } catch (error) {
    console.error('Delete tests error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete tests' 
    });
  }
};