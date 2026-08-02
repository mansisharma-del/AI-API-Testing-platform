import yaml from 'js-yaml';
import config from '../../core/config/index.js';

export const parseOpenAPISpec = (spec) => {
  try {
    // Check if spec is string, parse it
    if (typeof spec === 'string') {
      if (spec.trim().startsWith('{')) {
        spec = JSON.parse(spec);
      } else {
        spec = yaml.load(spec);
      }
    }

    // Validate OpenAPI version
    const version = spec.openapi || spec.swagger;
    if (!version) {
      throw new Error('Invalid OpenAPI specification: No version found');
    }

    // Extract endpoints
    const endpoints = [];
    const paths = spec.paths || {};

    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, details] of Object.entries(methods)) {
        if (['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method.toLowerCase())) {
          endpoints.push({
            path: path,
            method: method.toUpperCase(),
            summary: details.summary || '',
            description: details.description || '',
            parameters: details.parameters || [],
            requestBody: details.requestBody || null,
            responses: details.responses || {},
            tags: details.tags || [],
            operationId: details.operationId || '',
            deprecated: details.deprecated || false
          });
        }
      }
    }

    // Extract schemas
    const schemas = {};
    if (spec.components && spec.components.schemas) {
      for (const [name, schema] of Object.entries(spec.components.schemas)) {
        schemas[name] = schema;
      }
    }

    // Extract security requirements
    const security = spec.security || [];

    return {
      success: true,
      data: {
        version: version,
        info: {
          title: spec.info?.title || '',
          description: spec.info?.description || '',
          version: spec.info?.version || '',
          contact: spec.info?.contact || {},
          license: spec.info?.license || {}
        },
        servers: spec.servers || [],
        endpoints: endpoints,
        schemas: schemas,
        security: security,
        tags: spec.tags || [],
        totalEndpoints: endpoints.length,
        totalSchemas: Object.keys(schemas).length
      }
    };
  } catch (error) {
    console.error('Parse OpenAPI error:', error);
    return {
      success: false,
      error: error.message || 'Failed to parse OpenAPI specification'
    };
  }
};

export const generateTestCasesFromSpec = (parsedSpec) => {
  try {
    const testCases = [];
    const endpoints = parsedSpec.data.endpoints || [];

    for (const endpoint of endpoints) {
      // Positive test case
      testCases.push({
        method: endpoint.method,
        endpoint: endpoint.path,
        category: 'POSITIVE',
        expectedStatus: 200,
        description: `Test ${endpoint.method} ${endpoint.path} - Positive test`,
        headers: {},
        requestBody: null,
        isGenerated: true
      });

      // Negative test case (if has parameters)
      if (endpoint.parameters && endpoint.parameters.length > 0) {
        testCases.push({
          method: endpoint.method,
          endpoint: endpoint.path,
          category: 'NEGATIVE',
          expectedStatus: 400,
          description: `Test ${endpoint.method} ${endpoint.path} - Negative test with invalid parameters`,
          headers: {},
          requestBody: null,
          isGenerated: true
        });
      }

      // Security test (if has security)
      if (endpoint.security || parsedSpec.data.security.length > 0) {
        testCases.push({
          method: endpoint.method,
          endpoint: endpoint.path,
          category: 'SECURITY',
          expectedStatus: 401,
          description: `Test ${endpoint.method} ${endpoint.path} - Security test (unauthorized)`,
          headers: {},
          requestBody: null,
          isGenerated: true
        });
      }
    }

    return {
      success: true,
      data: testCases
    };
  } catch (error) {
    console.error('Generate test cases error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate test cases'
    };
  }
};

export const validateOpenAPISpec = (spec) => {
  try {
    const requiredFields = ['openapi', 'info', 'paths'];

    for (const field of requiredFields) {
      if (!spec[field]) {
        return {
          valid: false,
          error: `Missing required field: ${field}`
        };
      }
    }

    // Validate info object
    if (!spec.info.title || !spec.info.version) {
      return {
        valid: false,
        error: 'Info object must have title and version'
      };
    }

    // Validate paths
    if (Object.keys(spec.paths).length === 0) {
      return {
        valid: false,
        error: 'No paths found in specification'
      };
    }

    return {
      valid: true,
      message: 'OpenAPI specification is valid'
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message || 'Failed to validate specification'
    };
  }
};