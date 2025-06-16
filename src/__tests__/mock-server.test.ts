import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MockServer } from '../core/mock-server';
import * as fs from 'fs-extra';
import request from 'supertest';

vi.mock('fs-extra');

const mockFs = vi.mocked(fs);

describe('MockServer', () => {
  let server: MockServer;
  let mockSpec: any;

  beforeEach(() => {
    mockSpec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/users': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          name: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/users/{id}': {
          get: {
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    server = new MockServer('./test-generated');
    
    // Mock file system
    mockFs.pathExists.mockImplementation((path: string) => {
      if (path.includes('openapi.json')) return Promise.resolve(true);
      return Promise.resolve(false);
    });
    
    mockFs.readFile.mockImplementation((path: string) => {
      if (path.includes('openapi.json')) {
        return Promise.resolve(JSON.stringify(mockSpec));
      }
      return Promise.resolve('{}');
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadSpecification', () => {
    it('should load OpenAPI specification from JSON file', async () => {
      await (server as any).loadSpecification();
      expect((server as any).spec).toEqual(mockSpec);
    });

    it('should throw error if no specification found', async () => {
      mockFs.pathExists.mockResolvedValue(false);

      await expect((server as any).loadSpecification()).rejects.toThrow(
        'OpenAPI specification not found'
      );
    });
  });

  describe('convertOpenAPIPathToExpress', () => {
    it('should convert OpenAPI path parameters to Express format', () => {
      const result = (server as any).convertOpenAPIPathToExpress('/users/{id}/posts/{postId}');
      expect(result).toBe('/users/:id/posts/:postId');
    });

    it('should handle paths without parameters', () => {
      const result = (server as any).convertOpenAPIPathToExpress('/users');
      expect(result).toBe('/users');
    });
  });

  describe('getMockFilePath', () => {
    it('should generate correct mock file path', () => {
      const result = (server as any).getMockFilePath('/users/{id}', 'GET');
      expect(result).toMatch(/users\/_id\/get\.json$/);
    });

    it('should handle nested paths', () => {
      const result = (server as any).getMockFilePath('/users/{id}/posts/{postId}', 'POST');
      expect(result).toMatch(/users\/_id\/posts\/_postId\/post\.json$/);
    });
  });

  describe('generateResponseFromOperation', () => {
    it('should generate basic fallback response', () => {
      const operation = {
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  example: { message: 'test' }
                }
              }
            }
          }
        }
      };

      const result = (server as any).generateResponseFromOperation(operation);
      expect(result).toEqual({ message: 'test' });
    });

    it('should return default response if no example', () => {
      const operation = { responses: {} };
      const result = (server as any).generateResponseFromOperation(operation);
      
      expect(result).toEqual({
        message: 'Mock response',
        timestamp: expect.any(String),
        data: {}
      });
    });
  });

  describe('getPreferredStatusCode', () => {
    it('should prefer 200 status code', () => {
      const mockResponse = {
        '200': { data: 'ok' },
        '201': { data: 'created' },
        '400': { error: 'bad request' }
      };

      const result = (server as any).getPreferredStatusCode(mockResponse);
      expect(result).toBe(200);
    });

    it('should prefer 201 if 200 not available', () => {
      const mockResponse = {
        '201': { data: 'created' },
        '400': { error: 'bad request' }
      };

      const result = (server as any).getPreferredStatusCode(mockResponse);
      expect(result).toBe(201);
    });

    it('should use first available status code as fallback', () => {
      const mockResponse = {
        '400': { error: 'bad request' },
        '500': { error: 'server error' }
      };

      const result = (server as any).getPreferredStatusCode(mockResponse);
      expect(result).toBe(400);
    });
  });
});