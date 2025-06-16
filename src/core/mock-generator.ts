import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'yaml';

export interface OpenAPISpec {
  paths: Record<string, Record<string, any>>;
  components?: {
    schemas?: Record<string, any>;
  };
}

export class MockGenerator {
  async generateMockServer(spec: string, outputDir: string): Promise<void> {
    const specContent = await this.loadSpec(spec);
    const parsedSpec = this.parseSpec(specContent);
    
    // Generate mock response files
    await this.generateMockResponses(parsedSpec, outputDir);
    
    // Generate server configuration
    await this.generateServerConfig(parsedSpec, outputDir);
    
    console.log('✓ Mock server files generated');
  }

  private async loadSpec(spec: string): Promise<string> {
    if (spec.startsWith('http://') || spec.startsWith('https://')) {
      const response = await fetch(spec);
      return await response.text();
    } else {
      return await fs.readFile(spec, 'utf-8');
    }
  }

  private parseSpec(content: string): OpenAPISpec {
    try {
      // Try JSON first
      return JSON.parse(content);
    } catch {
      // Fall back to YAML
      return yaml.parse(content);
    }
  }

  private async generateMockResponses(spec: OpenAPISpec, outputDir: string): Promise<void> {
    const mocksDir = path.join(outputDir, 'mocks');
    await fs.ensureDir(mocksDir);

    for (const [pathPattern, methods] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        if (typeof operation !== 'object' || !operation.responses) continue;

        // Create directory structure based on URL path
        const mockDir = this.createMockDirectoryPath(mocksDir, pathPattern, method);
        await fs.ensureDir(path.dirname(mockDir));

        // Generate mock response for each status code
        const responses: Record<string, any> = {};
        
        for (const [statusCode, response] of Object.entries(operation.responses)) {
          if (typeof response === 'object' && response.content) {
            const mockData = this.generateMockData(response, spec);
            responses[statusCode] = mockData;
          }
        }

        // Write mock response file
        await fs.writeFile(mockDir, JSON.stringify(responses, null, 2));
      }
    }
  }

  private createMockDirectoryPath(mocksDir: string, pathPattern: string, method: string): string {
    // Convert /users/{id}/posts to users/_id/posts
    const cleanPath = pathPattern
      .replace(/^\//, '') // Remove leading slash
      .replace(/\{([^}]+)\}/g, '_$1') // Convert {id} to _id
      .replace(/\//g, '/'); // Keep directory separators

    return path.join(mocksDir, cleanPath, `${method.toLowerCase()}.json`);
  }

  private generateMockData(response: any, spec: OpenAPISpec): any {
    const content = response.content;
    const mediaType = content['application/json'] || content[Object.keys(content)[0]];
    
    if (!mediaType || !mediaType.schema) {
      return { message: 'Mock response' };
    }

    // Check for examples first
    if (mediaType.examples) {
      const exampleKey = Object.keys(mediaType.examples)[0];
      return mediaType.examples[exampleKey].value;
    }

    if (mediaType.example) {
      return mediaType.example;
    }

    // Generate from schema
    return this.generateFromSchema(mediaType.schema, spec);
  }

  private generateFromSchema(schema: any, spec: OpenAPISpec): any {
    if (!schema) return null;

    // Handle $ref
    if (schema.$ref) {
      const refPath = schema.$ref.replace('#/components/schemas/', '');
      const refSchema = spec.components?.schemas?.[refPath];
      return this.generateFromSchema(refSchema, spec);
    }

    switch (schema.type) {
      case 'object':
        const obj: any = {};
        if (schema.properties) {
          for (const [key, propSchema] of Object.entries(schema.properties)) {
            obj[key] = this.generateFromSchema(propSchema, spec);
          }
        }
        return obj;

      case 'array':
        return [this.generateFromSchema(schema.items, spec)];

      case 'string':
        if (schema.format === 'date-time') return new Date().toISOString();
        if (schema.format === 'date') return new Date().toISOString().split('T')[0];
        if (schema.format === 'email') return 'example@example.com';
        if (schema.enum) return schema.enum[0];
        return schema.example || 'string';

      case 'number':
      case 'integer':
        return schema.example || (schema.type === 'integer' ? 1 : 1.0);

      case 'boolean':
        return schema.example !== undefined ? schema.example : true;

      default:
        return schema.example || null;
    }
  }

  private async generateServerConfig(spec: OpenAPISpec, outputDir: string): Promise<void> {
    const config = {
      spec: spec,
      mocksDirectory: './mocks',
      defaultResponseStatus: 200,
      cors: true,
      port: 3000
    };

    await fs.writeFile(
      path.join(outputDir, 'mock-config.json'),
      JSON.stringify(config, null, 2)
    );
  }
}