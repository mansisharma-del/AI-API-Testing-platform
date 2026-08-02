import axios from 'axios';
import config from '../../core/config/index.js';

// Execute a single test case
export const executeTest = async (testCase, baseUrl) => {
  const startTime = Date.now();
  
  try {
    // Build request config
    const requestConfig = {
      method: testCase.method,
      url: `${baseUrl}${testCase.endpoint}`,
      headers: testCase.requestHeaders || {},
      data: testCase.requestBody || {},
      validateStatus: () => true, // Don't throw on any status
      timeout: 30000 // 30 seconds timeout
    };

    // Make request
    const response = await axios(requestConfig);
    const duration = Date.now() - startTime;
    const passed = response.status === testCase.expectedStatus;

    // Return result
    return {
      testCaseId: testCase.id,
      status: passed ? 'PASSED' : 'FAILED',
      responseStatus: response.status,
      responseBody: JSON.stringify(response.data),
      responseTime: duration,
      passed,
      expectedStatus: testCase.expectedStatus,
      method: testCase.method,
      endpoint: testCase.endpoint
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Handle different error types
    let errorMessage = error.message;
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout (30s)';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused - Server not running';
    } else if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return {
        testCaseId: testCase.id,
        status: 'FAILED',
        responseStatus: error.response.status,
        responseBody: JSON.stringify(error.response.data),
        responseTime: duration,
        passed: false,
        errorMessage: `Status ${error.response.status}`,
        expectedStatus: testCase.expectedStatus,
        method: testCase.method,
        endpoint: testCase.endpoint
      };
    }
    
    return {
      testCaseId: testCase.id,
      status: 'ERROR',
      responseStatus: null,
      responseBody: null,
      responseTime: duration,
      passed: false,
      errorMessage: errorMessage,
      expectedStatus: testCase.expectedStatus,
      method: testCase.method,
      endpoint: testCase.endpoint
    };
  }
};

// Execute multiple test cases (sequentially)
export const executeTestSuite = async (testCases, baseUrl) => {
  const results = [];
  const total = testCases.length;
  
  console.log(`🧪 Running ${total} tests...`);
  
  for (let i = 0; i < total; i++) {
    const testCase = testCases[i];
    console.log(`  ⏳ Running test ${i + 1}/${total}: ${testCase.method} ${testCase.endpoint}`);
    
    const result = await executeTest(testCase, baseUrl);
    results.push(result);
    
    // Log result
    const statusEmoji = result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '⚠️';
    console.log(`  ${statusEmoji} Test ${i + 1}/${total}: ${result.status} (${result.responseTime || 0}ms)`);
  }
  
  // Calculate summary
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const errors = results.filter(r => r.status === 'ERROR').length;
  const successRate = total > 0 ? (passed / total) * 100 : 0;
  
  console.log(`📊 Summary: ${passed} passed, ${failed} failed, ${errors} errors (${successRate.toFixed(1)}%)`);
  
  return results;
};

// Execute test cases in parallel (faster but more resource intensive)
export const executeTestSuiteParallel = async (testCases, baseUrl, concurrency = 5) => {
  const total = testCases.length;
  const results = [];
  
  console.log(`🧪 Running ${total} tests in parallel (concurrency: ${concurrency})...`);
  
  // Process in batches
  for (let i = 0; i < total; i += concurrency) {
    const batch = testCases.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(testCase => executeTest(testCase, baseUrl))
    );
    results.push(...batchResults);
    
    console.log(`  ✅ Batch ${Math.floor(i / concurrency) + 1} completed (${batch.length} tests)`);
  }
  
  // Calculate summary
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const errors = results.filter(r => r.status === 'ERROR').length;
  const successRate = total > 0 ? (passed / total) * 100 : 0;
  
  console.log(`📊 Summary: ${passed} passed, ${failed} failed, ${errors} errors (${successRate.toFixed(1)}%)`);
  
  return results;
};

// Get test status summary
export const getTestSummary = (results) => {
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const errors = results.filter(r => r.status === 'ERROR').length;
  const successRate = total > 0 ? (passed / total) * 100 : 0;
  
  return {
    total,
    passed,
    failed,
    errors,
    successRate: successRate.toFixed(2) + '%'
  };
};

// Get detailed test report
export const getDetailedReport = (results) => {
  const summary = getTestSummary(results);
  
  // Calculate average response time
  const validResponseTimes = results
    .filter(r => r.responseTime !== null && r.responseTime !== undefined)
    .map(r => r.responseTime);
  
  const avgResponseTime = validResponseTimes.length > 0
    ? validResponseTimes.reduce((a, b) => a + b, 0) / validResponseTimes.length
    : 0;
  
  // Group by status
  const grouped = {
    PASSED: results.filter(r => r.status === 'PASSED'),
    FAILED: results.filter(r => r.status === 'FAILED'),
    ERROR: results.filter(r => r.status === 'ERROR')
  };
  
  // Group by method
  const byMethod = {};
  results.forEach(r => {
    const method = r.method || 'UNKNOWN';
    if (!byMethod[method]) byMethod[method] = [];
    byMethod[method].push(r);
  });
  
  return {
    summary,
    avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
    grouped,
    byMethod,
    allResults: results
  };
};