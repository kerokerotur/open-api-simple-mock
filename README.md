# open-api-nice-mock

A CLI tool to generate TypeScript models and mock servers from OpenAPI specifications.

[![CI](https://github.com/yourusername/open-api-nice-mock/workflows/CI/badge.svg)](https://github.com/yourusername/open-api-nice-mock/actions)
[![npm version](https://badge.fury.io/js/open-api-nice-mock.svg)](https://badge.fury.io/js/open-api-nice-mock)
[![codecov](https://codecov.io/gh/yourusername/open-api-nice-mock/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/open-api-nice-mock)

## Features

- 🚀 **Generate TypeScript models** from OpenAPI specifications using openapi-generator
- 🖥️ **Mock server** with automatic response generation based on OpenAPI examples
- 📁 **URL-based directory structure** for easy mock response customization
- 🔧 **Flexible configuration** - supports all openapi-generator options
- 🧪 **Full test coverage** (80%+ coverage maintained)
- 📦 **Easy to use** CLI interface

## Installation

```bash
npm install -g open-api-nice-mock
```

## Quick Start

### 1. Generate mock server from OpenAPI spec

```bash
open-api-nice-mock generate your-openapi-spec.json
```

This will:
- Generate TypeScript models using openapi-generator
- Create mock response files organized by URL structure
- Copy your OpenAPI spec to the output directory

### 2. Start the mock server

```bash
open-api-nice-mock run
```

Your mock server will start at `http://localhost:3000` and serve responses based on your OpenAPI specification.

## Usage

### Generate Command

```bash
open-api-nice-mock generate <spec> [options]
```

**Arguments:**
- `<spec>` - Path to OpenAPI specification file or URL

**Options:**
- `-o, --output <dir>` - Output directory (default: `./generated`)
- `-g, --generator-name <name>` - Generator name (default: `typescript-node`)
- `--additional-properties <props>` - Additional properties for generator
- `--global-property <props>` - Global properties for generator
- `--config <file>` - Configuration file for generator
- `--template-dir <dir>` - Template directory
- `--auth <auth>` - Authorization header for fetching spec
- `--skip-validate-spec` - Skip validation of input spec
- `--strict-spec` - Treat spec strictly

**Examples:**

```bash
# Basic usage
open-api-nice-mock generate ./api/openapi.yaml

# With custom output directory
open-api-nice-mock generate ./api/openapi.yaml -o ./my-mocks

# From URL with additional properties
open-api-nice-mock generate https://petstore.swagger.io/v2/swagger.json --additional-properties="npmName=my-client"

# With configuration file
open-api-nice-mock generate ./api/openapi.yaml --config ./openapi-config.json
```

### Run Command

```bash
open-api-nice-mock run [options]
```

**Options:**
- `-p, --port <port>` - Port to run the server on (default: `3000`)
- `-d, --dir <dir>` - Directory containing generated files (default: `./generated`)
- `-h, --host <host>` - Host to bind the server to (default: `localhost`)

**Examples:**

```bash
# Start on default port 3000
open-api-nice-mock run

# Start on custom port
open-api-nice-mock run -p 8080

# Use custom generated directory
open-api-nice-mock run -d ./my-generated-files -p 3001
```

## Mock Response Customization

The generated mock server creates a directory structure based on your API URLs for easy customization:

```
generated/
├── mocks/
│   ├── users/
│   │   ├── get.json          # GET /users
│   │   └── post.json         # POST /users
│   ├── users/
│   │   └── _id/
│   │       ├── get.json      # GET /users/{id}
│   │       └── put.json      # PUT /users/{id}
│   └── users/
│       └── _id/
│           └── posts/
│               └── get.json  # GET /users/{id}/posts
├── openapi.json              # Your OpenAPI spec
└── mock-config.json          # Server configuration
```

### Customizing Mock Responses

Each mock response file contains responses for different HTTP status codes:

```json
{
  "200": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "404": {
    "error": "User not found"
  }
}
```

The server will automatically serve the appropriate response based on your OpenAPI specification and custom mock files.

## Response Generation Strategy

1. **Custom mock files** - If a custom mock file exists, it will be used
2. **OpenAPI examples** - If examples are defined in your OpenAPI spec, they will be used
3. **Generated from schema** - Default values will be generated based on the schema definition

## Development

### Requirements

- Node.js >= 16.0.0
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/open-api-nice-mock.git
cd open-api-nice-mock

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint
```

### Testing

The project maintains 80%+ test coverage. Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for your changes
5. Ensure tests pass and coverage remains above 80%
6. Commit your changes (`git commit -m 'Add some amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.