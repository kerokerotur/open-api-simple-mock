import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { generateCommand } from '../src/commands/generate';
import { runCommand } from '../src/commands/run';
import { MockServer } from '../src/core/mock-server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Integration tests using real OpenAPI specs
describe('Integration Tests', () => {
  const tempDir = path.join(__dirname, '..', 'temp-test');
  const fixturesDir = path.join(__dirname, '..', 'test-fixtures');

  beforeEach(async () => {
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('JSON OpenAPI Spec - Pet Store', () => {
    const petStoreSpec = path.join(fixturesDir, 'petstore.json');
    const outputDir = path.join(tempDir, 'petstore-output');

    it('should generate mock files from petstore.json', async () => {
      // Verify fixture exists
      expect(await fs.pathExists(petStoreSpec)).toBe(true);

      // Generate mocks
      await generateCommand(petStoreSpec, {
        output: outputDir,
        generatorName: 'typescript-node'
      });

      // Verify generated structure
      expect(await fs.pathExists(outputDir)).toBe(true);
      expect(await fs.pathExists(path.join(outputDir, 'openapi.json'))).toBe(true);
      expect(await fs.pathExists(path.join(outputDir, 'mocks'))).toBe(true);
      expect(await fs.pathExists(path.join(outputDir, 'mock-config.json'))).toBe(true);

      // Verify mock files for pets endpoints
      const petsGetMock = path.join(outputDir, 'mocks', 'pets', 'get.json');
      const petsPostMock = path.join(outputDir, 'mocks', 'pets', 'post.json');
      const petByIdGetMock = path.join(outputDir, 'mocks', 'pets', '_petId', 'get.json');

      expect(await fs.pathExists(petsGetMock)).toBe(true);
      expect(await fs.pathExists(petsPostMock)).toBe(true);
      expect(await fs.pathExists(petByIdGetMock)).toBe(true);

      // Verify mock content includes examples
      const petsGetContent = await fs.readJson(petsGetMock);
      expect(petsGetContent['200']).toBeDefined();
      expect(Array.isArray(petsGetContent['200'])).toBe(true);
      expect(petsGetContent['200']).toEqual([
        { id: 1, name: 'Fluffy', tag: 'cat' },
        { id: 2, name: 'Buddy', tag: 'dog' }
      ]);

      // Verify pet by ID mock includes example
      const petByIdContent = await fs.readJson(petByIdGetMock);
      expect(petByIdContent['200']).toEqual({
        id: 1,
        name: 'Fluffy',
        tag: 'cat'
      });
      expect(petByIdContent['404']).toEqual({
        code: 404,
        message: 'Pet not found'
      });
    }, 30000);

    it('should start mock server and serve responses', async () => {
      // First generate the mocks
      await generateCommand(petStoreSpec, {
        output: outputDir,
        generatorName: 'typescript-node'
      });

      // Create mock server instance
      const mockServer = new MockServer(outputDir);
      let serverStarted = false;

      try {
        // Start server on a random port
        const port = 3000 + Math.floor(Math.random() * 1000);
        
        // Start server in background
        void mockServer.start(port, 'localhost');
        
        // Give server time to start
        await new Promise(resolve => setTimeout(resolve, 1000));
        serverStarted = true;

        // Test server responses using fetch
        const baseUrl = `http://localhost:${port}`;

        // Test GET /pets
        const petsResponse = await fetch(`${baseUrl}/pets`);
        expect(petsResponse.status).toBe(200);
        
        const petsData = await petsResponse.json();
        expect(Array.isArray(petsData)).toBe(true);
        expect(petsData.length).toBe(2);
        expect(petsData[0]).toEqual({ id: 1, name: 'Fluffy', tag: 'cat' });

        // Test GET /pets/{petId}
        const petResponse = await fetch(`${baseUrl}/pets/1`);
        expect(petResponse.status).toBe(200);
        
        const petData = await petResponse.json();
        expect(petData).toEqual({ id: 1, name: 'Fluffy', tag: 'cat' });

        // Test 404 handling
        const notFoundResponse = await fetch(`${baseUrl}/nonexistent`);
        expect(notFoundResponse.status).toBe(404);
        
        const errorData = await notFoundResponse.json();
        expect(errorData.error).toBe('Route not found');

      } finally {
        // Clean up server if it was started
        if (serverStarted) {
          // Note: In a real scenario, you'd want to properly close the server
          // For this test, we'll let it timeout naturally
        }
      }
    }, 15000);
  });

  describe('YAML OpenAPI Spec - Blog API', () => {
    const blogSpec = path.join(fixturesDir, 'blog.yaml');
    const outputDir = path.join(tempDir, 'blog-output');

    it('should generate mock files from blog.yaml', async () => {
      // Verify fixture exists
      expect(await fs.pathExists(blogSpec)).toBe(true);

      // Generate mocks
      await generateCommand(blogSpec, {
        output: outputDir,
        generatorName: 'typescript-node'
      });

      // Verify generated structure
      expect(await fs.pathExists(outputDir)).toBe(true);
      expect(await fs.pathExists(path.join(outputDir, 'openapi.yaml'))).toBe(true);
      expect(await fs.pathExists(path.join(outputDir, 'mocks'))).toBe(true);

      // Verify mock files for various endpoints
      const usersGetMock = path.join(outputDir, 'mocks', 'users', 'get.json');
      const userByIdMock = path.join(outputDir, 'mocks', 'users', '_userId', 'get.json');
      const userPostsMock = path.join(outputDir, 'mocks', 'users', '_userId', 'posts', 'get.json');
      const postsGetMock = path.join(outputDir, 'mocks', 'posts', 'get.json');

      expect(await fs.pathExists(usersGetMock)).toBe(true);
      expect(await fs.pathExists(userByIdMock)).toBe(true);
      expect(await fs.pathExists(userPostsMock)).toBe(true);
      expect(await fs.pathExists(postsGetMock)).toBe(true);

      // Verify mock content includes examples from YAML
      const usersGetContent = await fs.readJson(usersGetMock);
      expect(usersGetContent['200']).toBeDefined();
      expect(Array.isArray(usersGetContent['200'])).toBe(true);
      expect(usersGetContent['200'][0]).toEqual({
        id: 1,
        username: 'johndoe',
        email: 'john@example.com',
        posts_count: 5
      });

      // Verify nested route mock
      const userPostsContent = await fs.readJson(userPostsMock);
      expect(userPostsContent['200']).toBeDefined();
      expect(Array.isArray(userPostsContent['200'])).toBe(true);
      expect(userPostsContent['200'][0]).toEqual({
        id: 1,
        title: 'First Post',
        content: 'This is my first blog post',
        author_id: 1,
        created_at: '2024-01-15T10:30:00Z',
        tags: ['introduction', 'first-post']
      });
    }, 30000);

    it('should handle complex nested paths correctly', async () => {
      await generateCommand(blogSpec, {
        output: outputDir,
        generatorName: 'typescript-node'
      });

      // Test that nested paths create correct directory structure
      const nestedPath = path.join(outputDir, 'mocks', 'users', '_userId', 'posts', 'get.json');
      expect(await fs.pathExists(nestedPath)).toBe(true);

      // Verify the mock content
      const content = await fs.readJson(nestedPath);
      expect(content['200']).toBeDefined();
      expect(Array.isArray(content['200'])).toBe(true);
    });
  });

  describe('Mock Response Customization', () => {
    const petStoreSpec = path.join(fixturesDir, 'petstore.json');
    const outputDir = path.join(tempDir, 'custom-output');

    it('should allow customization of generated mock responses', async () => {
      // Generate initial mocks
      await generateCommand(petStoreSpec, {
        output: outputDir,
        generatorName: 'typescript-node'
      });

      // Customize a mock response
      const customMockPath = path.join(outputDir, 'mocks', 'pets', 'get.json');
      const customResponse = {
        '200': [
          { id: 99, name: 'Custom Pet', tag: 'custom' }
        ],
        '500': {
          code: 500,
          message: 'Internal server error'
        }
      };

      await fs.writeJson(customMockPath, customResponse, { spaces: 2 });

      // Verify the custom response was written
      const writtenContent = await fs.readJson(customMockPath);
      expect(writtenContent).toEqual(customResponse);

      // Start server and verify custom response is served
      const mockServer = new MockServer(outputDir);
      const port = 3000 + Math.floor(Math.random() * 1000);

      try {
        // Start server
        void mockServer.start(port, 'localhost');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test custom response
        const response = await fetch(`http://localhost:${port}/pets`);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toEqual([{ id: 99, name: 'Custom Pet', tag: 'custom' }]);

      } finally {
        // Server cleanup handled by timeout
      }
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should handle invalid OpenAPI specs gracefully', async () => {
      const invalidSpec = path.join(tempDir, 'invalid.json');
      await fs.writeFile(invalidSpec, '{"invalid": "spec"}');

      await expect(
        generateCommand(invalidSpec, {
          output: path.join(tempDir, 'invalid-output'),
          generatorName: 'typescript-node'
        })
      ).rejects.toThrow();
    });

    it('should handle missing spec file', async () => {
      const missingSpec = path.join(tempDir, 'missing.json');

      await expect(
        generateCommand(missingSpec, {
          output: path.join(tempDir, 'missing-output'),
          generatorName: 'typescript-node'
        })
      ).rejects.toThrow();
    });

    it('should handle missing generated directory for run command', async () => {
      await expect(
        runCommand({
          port: '3001',
          dir: path.join(tempDir, 'nonexistent'),
          host: 'localhost'
        })
      ).rejects.toThrow();
    });
  });
});