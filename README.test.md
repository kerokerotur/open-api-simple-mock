# Testing Guide for open-api-nice-mock

This document provides comprehensive testing information for developers who want to understand how this library works by running tests.

## Test Structure

The test suite is organized into different categories to provide clear insights into the library's functionality:

### Unit Tests
- **Location**: `src/__tests__/*.test.ts`
- **Purpose**: Test individual components in isolation
- **Coverage**: Core classes and functions with mocked dependencies

### Integration Tests
- **Location**: `src/__tests__/integration.test.ts`
- **Purpose**: Test the complete workflow using real OpenAPI specifications
- **Coverage**: End-to-end functionality with actual file generation and server startup

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Build the project (required for some integration tests)
npm run build
```

### Test Commands

```bash
# Run all tests
npm test

# Run only unit tests (fast, mocked dependencies)
npm run test:unit

# Run only integration tests (slower, real file operations)
npm run test:integration

# Run tests with coverage report
npm run test:coverage
```

## Integration Test Scenarios

The integration tests demonstrate real-world usage of the library with actual OpenAPI specifications:

### 1. Pet Store API (JSON Format)

**Test File**: `test-fixtures/petstore.json`

This test demonstrates:
- Generating TypeScript models from a JSON OpenAPI spec
- Creating URL-based mock response files
- Starting a mock server that serves responses based on OpenAPI examples
- Custom response handling

**What gets generated**:
```
generated/
├── mocks/
│   ├── pets/
│   │   ├── get.json          # GET /pets
│   │   └── post.json         # POST /pets
│   └── pets/
│       └── _petId/
│           ├── get.json      # GET /pets/{petId}
│           ├── put.json      # PUT /pets/{petId}
│           └── delete.json   # DELETE /pets/{petId}
├── openapi.json              # Copy of original spec
└── mock-config.json          # Server configuration
```

**Example mock response** (`mocks/pets/get.json`):
```json
{
  "200": [
    {
      "id": 1,
      "name": "Fluffy",
      "tag": "cat"
    },
    {
      "id": 2,
      "name": "Buddy",
      "tag": "dog"
    }
  ]
}
```

### 2. Blog API (YAML Format)

**Test File**: `test-fixtures/blog.yaml`

This test demonstrates:
- Parsing YAML format OpenAPI specifications
- Handling complex nested paths (`/users/{userId}/posts`)
- Different data types (arrays, objects, dates)
- Multiple response status codes

**What gets generated**:
```
generated/
├── mocks/
│   ├── users/
│   │   ├── get.json          # GET /users
│   │   └── post.json         # POST /users
│   ├── users/
│   │   └── _userId/
│   │       ├── get.json      # GET /users/{userId}
│   │       └── posts/
│   │           └── get.json  # GET /users/{userId}/posts
│   └── posts/
│       ├── get.json          # GET /posts
│       ├── post.json         # POST /posts
│       └── _postId/
│           └── get.json      # GET /posts/{postId}
└── ...
```

### 3. Mock Response Customization

The integration tests also demonstrate how developers can customize mock responses:

1. Generate initial mocks from OpenAPI spec
2. Edit the generated JSON files to customize responses
3. Start the server to serve custom responses

**Example customization**:
```json
{
  "200": [
    {
      "id": 99,
      "name": "Custom Pet",
      "tag": "custom"
    }
  ],
  "500": {
    "code": 500,
    "message": "Internal server error"
  }
}
```

## Understanding Test Output

### Successful Generation Test

When the generation test passes, you can see:
- ✅ OpenAPI spec is parsed correctly
- ✅ Mock directory structure is created based on URL paths
- ✅ Mock files contain data from OpenAPI examples
- ✅ Different file formats (JSON/YAML) are handled properly

### Successful Server Test

When the server test passes, you can see:
- ✅ Mock server starts on specified port
- ✅ Server responds to HTTP requests
- ✅ Correct mock data is returned
- ✅ 404 errors are handled for unknown routes

### Error Handling Tests

The tests also verify error scenarios:
- ❌ Invalid OpenAPI specifications
- ❌ Missing specification files
- ❌ Missing generated directories for server startup

## Manual Testing

You can also test the library manually using the generated fixtures:

```bash
# Build the project
npm run build

# Test with Pet Store API
node dist/cli.js generate test-fixtures/petstore.json -o ./manual-test

# Check generated files
ls -la manual-test/mocks/

# Start the mock server
node dist/cli.js run -d ./manual-test -p 3001

# In another terminal, test the endpoints
curl http://localhost:3001/pets
curl http://localhost:3001/pets/1
```

## Test Coverage

The test suite maintains 80%+ coverage across:
- Core generation logic
- Mock server functionality
- CLI command handling
- Error scenarios
- Integration workflows

Run `npm run test:coverage` to see detailed coverage reports.

## Contributing Tests

When adding new features:

1. **Add unit tests** for individual functions/classes
2. **Add integration tests** if the feature affects the end-to-end workflow
3. **Ensure coverage remains above 80%**
4. **Test both success and error scenarios**
5. **Use real OpenAPI specs** in integration tests when possible

The integration tests serve as both functional verification and documentation of how the library should be used in real-world scenarios.