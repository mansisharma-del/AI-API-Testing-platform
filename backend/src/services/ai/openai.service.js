import OpenAI from 'openai';
import config from '../../core/config/index.js';

// ✅ Check if API key exists
const hasOpenAIKey = config.openai && config.openai.apiKey && config.openai.apiKey !== '';

// ✅ Use correct model
const OPENAI_MODEL = config.openai.model || 'gpt-4-turbo-preview';

// ✅ Initialize OpenAI only if API key exists
let openai = null;
if (hasOpenAIKey) {
  try {
    openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
    console.log('✅ OpenAI initialized successfully');
    console.log('📦 Model:', OPENAI_MODEL);
  } catch (error) {
    console.error('❌ OpenAI initialization failed:', error.message);
  }
}

export const generateTestsFromSpec = async (apiSpec) => {
  // ✅ If OpenAI not available, return fallback tests
  if (!hasOpenAIKey || !openai) {
    console.log('⚠️ OpenAI not configured. Using fallback tests.');
    return getFallbackTests(apiSpec);
  }

  try {
    console.log('🤖 Calling OpenAI API...');
    console.log('📦 Model:', OPENAI_MODEL);

    const prompt = `
      You are an expert API testing engineer.
      Analyze this OpenAPI specification and generate comprehensive test cases.
      
      OpenAPI Spec:
      ${JSON.stringify(apiSpec, null, 2)}
      
      Generate test cases for:
      1. POSITIVE tests (happy path - 200/201 responses)
      2. NEGATIVE tests (error handling - 400, 404, 500)
      3. BOUNDARY tests (edge cases - validation)
      4. SECURITY tests (authentication, authorization - 401, 403)
      
      Return as JSON object with testCases array.
      Each test case should have:
      - method: string (GET, POST, PUT, DELETE, PATCH)
      - endpoint: string (path)
      - category: string (POSITIVE, NEGATIVE, BOUNDARY, SECURITY)
      - expectedStatus: number
      - description: string
      - headers: object
      - body: object or null
      
      Example:
      {
        "testCases": [
          {
            "method": "GET",
            "endpoint": "/api/users",
            "category": "POSITIVE",
            "expectedStatus": 200,
            "description": "Get all users with valid authentication",
            "headers": { "Authorization": "Bearer token" },
            "body": null
          }
        ]
      }
    `;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: 'You are an expert API testing engineer. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    console.log('✅ OpenAI response received');
    
    // Parse JSON response
    const parsed = JSON.parse(content);
    return parsed;
  } catch (error) {
    console.error('❌ OpenAI error:', error.message);
    
    if (error.status === 429) {
      console.log('⚠️ Quota exceeded. Using fallback tests.');
    } else if (error.status === 401) {
      console.log('⚠️ Invalid API key. Using fallback tests.');
    } else if (error.code === 'model_not_found') {
      console.log('⚠️ Model not found. Trying gpt-3.5-turbo...');
      // Try with GPT-3.5-turbo as fallback
      try {
        const fallbackResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are an expert API testing engineer. Return only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        });
        const content = fallbackResponse.choices[0].message.content;
        return JSON.parse(content);
      } catch (fallbackError) {
        console.log('⚠️ GPT-3.5-turbo also failed. Using fallback tests.');
      }
    }
    
    return getFallbackTests(apiSpec);
  }
};

// ✅ Fallback tests when OpenAI is not available
const getFallbackTests = (apiSpec) => {
  console.log('📋 Using fallback test generation');
  
  const testCases = [];
  
  // Try to extract endpoints from spec
  const paths = apiSpec.paths || {};
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  
  for (const [path, operations] of Object.entries(paths)) {
    for (const method of methods) {
      const op = operations[method.toLowerCase()];
      if (op) {
        // Positive test
        testCases.push({
          method: method,
          endpoint: path,
          category: 'POSITIVE',
          expectedStatus: method === 'POST' ? 201 : 200,
          description: `Test ${method} ${path} - Positive`,
          headers: { 'Content-Type': 'application/json' },
          body: method === 'POST' || method === 'PUT' ? { data: 'test' } : null
        });
        
        // Negative test (if POST or PUT)
        if (method === 'POST' || method === 'PUT') {
          testCases.push({
            method: method,
            endpoint: path,
            category: 'NEGATIVE',
            expectedStatus: 400,
            description: `Test ${method} ${path} - Negative (invalid data)`,
            headers: { 'Content-Type': 'application/json' },
            body: { invalid: 'data' }
          });
        }
        
        // Security test
        testCases.push({
          method: method,
          endpoint: path,
          category: 'SECURITY',
          expectedStatus: 401,
          description: `Test ${method} ${path} - Security (no auth)`,
          headers: {},
          body: null
        });
      }
    }
  }

  // If no endpoints found, add default tests
  if (testCases.length === 0) {
    testCases.push(
      {
        method: 'GET',
        endpoint: '/api/health',
        category: 'POSITIVE',
        expectedStatus: 200,
        description: 'Health check endpoint',
        headers: { 'Content-Type': 'application/json' },
        body: null
      },
      {
        method: 'GET',
        endpoint: '/api/users',
        category: 'POSITIVE',
        expectedStatus: 200,
        description: 'Get all users',
        headers: { 'Content-Type': 'application/json' },
        body: null
      },
      {
        method: 'POST',
        endpoint: '/api/users',
        category: 'POSITIVE',
        expectedStatus: 201,
        description: 'Create new user',
        headers: { 'Content-Type': 'application/json' },
        body: { name: 'Test User', email: 'test@example.com' }
      },
      {
        method: 'GET',
        endpoint: '/api/users/999',
        category: 'NEGATIVE',
        expectedStatus: 404,
        description: 'Get non-existent user',
        headers: { 'Content-Type': 'application/json' },
        body: null
      },
      {
        method: 'PUT',
        endpoint: '/api/users/1',
        category: 'BOUNDARY',
        expectedStatus: 400,
        description: 'Update user with invalid data',
        headers: { 'Content-Type': 'application/json' },
        body: { email: 'invalid-email' }
      },
      {
        method: 'DELETE',
        endpoint: '/api/users/1',
        category: 'SECURITY',
        expectedStatus: 401,
        description: 'Delete user without authentication',
        headers: {},
        body: null
      }
    );
  }

  console.log(`✅ Generated ${testCases.length} fallback test cases`);
  return { testCases };
};