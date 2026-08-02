import config from '../../core/config/index.js';
import { prisma } from '../../core/database/prisma.js';

// @desc    Create a new project
// @route   POST /api/v1/projects
export const createProject = async (req, res) => {
  try {
    const { name, description, githubRepoUrl, githubBranch } = req.body;
    const userId = req.userId;

    console.log('📝 Creating project for user:', userId);
    console.log('📦 Project data:', { name, description, githubRepoUrl });

    if (!userId) {
      console.log('❌ User ID not found in request');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please login again.'
      });
    }

    if (!name) {
      return res.status(400).json({ 
        success: false,
        error: 'Project name is required' 
      });
    }

    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userExists) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        error: 'User not found. Please login again.'
      });
    }

    console.log('✅ User found:', userExists.email);

    const project = await prisma.project.create({
      data: {
        name,
        description,
        githubRepoUrl,
        githubBranch: githubBranch || 'main',
        ownerId: userId
      }
    });

    console.log('✅ Project created:', project.id);

    res.status(201).json({
      success: true,
      project
    });
  } catch (error) {
    console.error('❌ Create project error:', error);
    
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: 'User not found. Please login again.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create project'
    });
  }
};

// @desc    Get all projects for a user
// @route   GET /api/v1/projects
export const getProjects = async (req, res) => {
  try {
    const userId = req.userId;

    console.log('📋 Getting projects for user:', userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please login again.'
      });
    }

    const projects = await prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: 'desc' }
    });

    console.log('📋 Projects found:', projects.length);

    res.json({
      success: true,
      projects
    });
  } catch (error) {
    console.error('❌ Get projects error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get projects' 
    });
  }
};

// @desc    Get a single project with test suites
// @route   GET /api/v1/projects/:id
export const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    console.log('🔍 Getting project:', id);
    console.log('👤 User ID:', userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please login again.'
      });
    }

    const project = await prisma.project.findFirst({
      where: { 
        id: id,
        ownerId: userId 
      },
      include: {
        testSuites: {
          include: {
            testCases: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
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
    console.log('📊 Test suites found:', project.testSuites?.length || 0);
    
    if (project.testSuites?.length > 0) {
      const suite = project.testSuites[0];
      console.log('📊 Test cases in suite:', suite.testCases?.length || 0);
      console.log('📊 Passed tests:', suite.passedTests || 0);
      console.log('📊 Failed tests:', suite.failedTests || 0);
    }

    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('❌ Get project error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get project' 
    });
  }
};

// @desc    Update a project
// @route   PUT /api/v1/projects/:id
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { name, description, githubRepoUrl, githubBranch, status } = req.body;

    console.log('✏️ Updating project:', id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please login again.'
      });
    }

    const existingProject = await prisma.project.findFirst({
      where: { 
        id: id,
        ownerId: userId 
      }
    });

    if (!existingProject) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: name || existingProject.name,
        description: description !== undefined ? description : existingProject.description,
        githubRepoUrl: githubRepoUrl !== undefined ? githubRepoUrl : existingProject.githubRepoUrl,
        githubBranch: githubBranch || existingProject.githubBranch,
        status: status || existingProject.status
      }
    });

    console.log('✅ Project updated:', project.id);

    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('❌ Update project error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update project' 
    });
  }
};

// @desc    Delete a project (with proper cascade)
// @route   DELETE /api/v1/projects/:id
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    console.log('🗑️ Deleting project:', id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please login again.'
      });
    }

    // Check if project exists
    const existingProject = await prisma.project.findFirst({
      where: { 
        id: id,
        ownerId: userId 
      }
    });

    if (!existingProject) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    // ✅ Delete in correct order: TestResult -> TestCase -> TestSuite -> Project
    
    // 1. Get all test suites with their test cases and results
    const testSuites = await prisma.testSuite.findMany({
      where: { projectId: id },
      include: {
        testCases: {
          include: {
            testResults: true
          }
        }
      }
    });

    console.log(`📊 Found ${testSuites.length} test suites to delete`);

    // 2. Delete test results, test cases, and test suites
    for (const suite of testSuites) {
      // Delete test results for each test case
      for (const testCase of suite.testCases) {
        await prisma.testResult.deleteMany({
          where: { testCaseId: testCase.id }
        });
        console.log(`  🗑️ Deleted test results for test case: ${testCase.id}`);
      }
      
      // Delete test cases
      await prisma.testCase.deleteMany({
        where: { suiteId: suite.id }
      });
      console.log(`  🗑️ Deleted test cases for suite: ${suite.id}`);
      
      // Delete test suite
      await prisma.testSuite.delete({
        where: { id: suite.id }
      });
      console.log(`  🗑️ Deleted test suite: ${suite.id}`);
    }

    // 3. Delete the project
    await prisma.project.delete({
      where: { id: id }
    });

    console.log('✅ Project and all related data deleted successfully:', id);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete project error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to delete project' 
    });
  }
};