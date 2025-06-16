# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of open-api-nice-mock
- CLI tool for generating TypeScript models from OpenAPI specifications
- Mock server functionality with automatic response generation
- URL-based directory structure for mock response customization
- Support for all openapi-generator options
- Comprehensive test suite with 80%+ coverage
- GitHub Actions CI/CD pipeline
- Full documentation in English and Japanese

### Features
- `generate` command to create TypeScript models and mock server structure
- `run` command to start mock server
- Automatic response generation from OpenAPI examples
- Fallback response generation from schema definitions
- Customizable mock responses organized by URL structure
- Support for URL and file-based OpenAPI specifications
- Cross-platform compatibility (Node.js 16+)

## [0.1.0] - 2024-01-XX

### Added
- Initial project structure
- Basic CLI implementation
- Core functionality for OpenAPI generation and mock server