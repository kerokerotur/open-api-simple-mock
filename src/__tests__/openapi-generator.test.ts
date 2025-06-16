import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAPIGenerator } from '../core/openapi-generator';
import * as fs from 'fs-extra';
import { exec } from 'child_process';

// Mock dependencies
vi.mock('child_process');
vi.mock('fs-extra');

const mockExec = vi.mocked(exec);
const mockFs = vi.mocked(fs);

describe('OpenAPIGenerator', () => {
  let generator: OpenAPIGenerator;

  beforeEach(() => {
    generator = new OpenAPIGenerator();
    vi.clearAllMocks();
  });

  describe('generate', () => {
    it('should generate with basic options', async () => {
      const options = {
        output: './test-output',
        generatorName: 'typescript-node'
      };

      // Mock exec to resolve successfully
      mockExec.mockImplementation((command, callback) => {
        callback?.(null, { stdout: 'Success', stderr: '' } as any);
        return {} as any;
      });

      // Mock file operations
      mockFs.readFile.mockResolvedValue('{"openapi": "3.0.0"}');
      mockFs.writeFile.mockResolvedValue();

      await generator.generate('test-spec.json', options);

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('npx @openapitools/openapi-generator-cli generate'),
        expect.any(Function)
      );
    });

    it('should handle additional properties', async () => {
      const options = {
        output: './test-output',
        generatorName: 'typescript-node',
        additionalProperties: 'npmName=test-client'
      };

      mockExec.mockImplementation((command, callback) => {
        callback?.(null, { stdout: 'Success', stderr: '' } as any);
        return {} as any;
      });

      mockFs.readFile.mockResolvedValue('{"openapi": "3.0.0"}');
      mockFs.writeFile.mockResolvedValue();

      await generator.generate('test-spec.json', options);

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('--additional-properties "npmName=test-client"'),
        expect.any(Function)
      );
    });

    it('should handle generator errors', async () => {
      const options = {
        output: './test-output',
        generatorName: 'typescript-node'
      };

      // Mock exec to reject
      mockExec.mockImplementation((command, callback) => {
        callback?.(new Error('Generator failed'), null);
        return {} as any;
      });

      await expect(generator.generate('test-spec.json', options)).rejects.toThrow(
        'OpenAPI Generator failed'
      );
    });
  });

  describe('copySpecToOutput', () => {
    it('should copy JSON spec file', async () => {
      const options = {
        output: './test-output',
        generatorName: 'typescript-node'
      };

      mockExec.mockImplementation((command, callback) => {
        callback?.(null, { stdout: 'Success', stderr: '' } as any);
        return {} as any;
      });

      mockFs.readFile.mockResolvedValue('{"openapi": "3.0.0", "info": {"title": "Test"}}');
      mockFs.writeFile.mockResolvedValue();

      await generator.generate('test-spec.json', options);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('openapi.json'),
        expect.stringContaining('"openapi": "3.0.0"')
      );
    });

    it('should handle URL specs', async () => {
      const options = {
        output: './test-output',
        generatorName: 'typescript-node'
      };

      mockExec.mockImplementation((command, callback) => {
        callback?.(null, { stdout: 'Success', stderr: '' } as any);
        return {} as any;
      });

      // Mock fetch for URL
      global.fetch = vi.fn().mockResolvedValue({
        text: () => Promise.resolve('{"openapi": "3.0.0"}')
      });

      mockFs.writeFile.mockResolvedValue();

      await generator.generate('https://example.com/spec.json', options);

      expect(fetch).toHaveBeenCalledWith('https://example.com/spec.json');
      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });
});