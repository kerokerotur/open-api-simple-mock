import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockGenerator } from '../src/core/mock-generator';
import * as fs from 'fs-extra';

vi.mock('fs-extra');

const mockFs = vi.mocked(fs);

describe('MockGenerator', () => {
  let generator: MockGenerator;

  beforeEach(() => {
    generator = new MockGenerator();
    vi.clearAllMocks();
  });

  describe('generateMockServer', () => {
    it('should generate mock files from OpenAPI spec', async () => {
      const spec = JSON.stringify({
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
                            id: { type: 'integer', example: 1 },
                            name: { type: 'string', example: 'John Doe' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      mockFs.readFile.mockResolvedValue(spec);
      mockFs.ensureDir.mockResolvedValue();
      mockFs.writeFile.mockResolvedValue();

      await generator.generateMockServer('test-spec.json', './output');

      expect(mockFs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('mocks'));
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('get.json'),
        expect.stringContaining('"200"')
      );
    });

    it('should handle nested paths with parameters', async () => {
      const spec = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/users/{id}/posts': {
            get: {
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          title: { type: 'string', example: 'Test Post' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      mockFs.readFile.mockResolvedValue(spec);
      mockFs.ensureDir.mockResolvedValue();
      mockFs.writeFile.mockResolvedValue();

      await generator.generateMockServer('test-spec.json', './output');

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('users/_id/posts/get.json'),
        expect.any(String)
      );
    });

    it('should generate data from schema when no example provided', async () => {
      const spec = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          name: { type: 'string' },
                          active: { type: 'boolean' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      mockFs.readFile.mockResolvedValue(spec);
      mockFs.ensureDir.mockResolvedValue();
      mockFs.writeFile.mockResolvedValue();

      await generator.generateMockServer('test-spec.json', './output');

      const writeCall = mockFs.writeFile.mock.calls.find((call: any) => 
        call[0].toString().includes('get.json')
      );
      
      expect(writeCall).toBeDefined();
      const writtenData = JSON.parse(writeCall![1] as string);
      expect(writtenData['200']).toEqual({
        id: 1,
        name: 'string',
        active: true
      });
    });
  });

  describe('generateFromSchema', () => {
    it('should handle different data types', () => {
      const testCases = [
        { schema: { type: 'string' }, expected: 'string' },
        { schema: { type: 'integer' }, expected: 1 },
        { schema: { type: 'number' }, expected: 1.0 },
        { schema: { type: 'boolean' }, expected: true },
        { schema: { type: 'string', format: 'email' }, expected: 'example@example.com' },
        { schema: { type: 'string', format: 'date-time' }, expected: expect.any(String) }
      ];

      testCases.forEach(({ schema, expected }) => {
        const result = (generator as any).generateFromSchema(schema, {});
        if (typeof expected === 'string' && schema.format === 'date-time') {
          expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        } else {
          expect(result).toEqual(expected);
        }
      });
    });
  });
});