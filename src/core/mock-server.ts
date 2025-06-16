import express, { Request, Response } from 'express';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'yaml';
import { OpenAPISpec } from './mock-generator';

export class MockServer {
  private app: express.Application;
  private spec: OpenAPISpec | null = null;
  private mocksDir: string;

  constructor(private generatedDir: string) {
    this.app = express();
    this.mocksDir = path.join(generatedDir, 'mocks');
    this.setupMiddleware();
  }

  async start(port: number, host: string): Promise<void> {
    await this.loadSpecification();
    await this.setupRoutes();

    return new Promise((resolve, reject) => {
      try {
        this.app.listen(port, host, () => {
          console.log(`🚀 Mock server started at http://${host}:${port}`);
          console.log(`📁 Serving mocks from: ${this.mocksDir}`);
          console.log('🛑 Press Ctrl+C to stop the server');
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE,PATCH');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private async loadSpecification(): Promise<void> {
    const specFiles = ['openapi.json', 'openapi.yaml', 'openapi.yml'];
    
    for (const fileName of specFiles) {
      const specPath = path.join(this.generatedDir, fileName);
      if (await fs.pathExists(specPath)) {
        const content = await fs.readFile(specPath, 'utf-8');
        this.spec = fileName.endsWith('.json') ? JSON.parse(content) : yaml.parse(content);
        console.log(`✓ Loaded OpenAPI spec: ${fileName}`);
        return;
      }
    }
    
    throw new Error('OpenAPI specification not found in generated directory');
  }

  private async setupRoutes(): Promise<void> {
    if (!this.spec) {
      throw new Error('OpenAPI specification not loaded');
    }

    // Setup routes for each path in the spec
    for (const [pathPattern, methods] of Object.entries(this.spec.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        if (typeof operation !== 'object') continue;

        const expressPath = this.convertOpenAPIPathToExpress(pathPattern);
        const httpMethod = method.toLowerCase();
        
        // Register route handler
        (this.app as any)[httpMethod](expressPath, async (req: Request, res: Response) => {
          await this.handleRequest(req, res, pathPattern, method, operation);
        });

        console.log(`✓ Registered route: ${httpMethod.toUpperCase()} ${expressPath}`);
      }
    }

    // Catch-all route for unhandled requests
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Route not found',
        message: `No mock defined for ${req.method} ${req.originalUrl}`,
        availableRoutes: this.getAvailableRoutes()
      });
    });
  }

  private convertOpenAPIPathToExpress(openApiPath: string): string {
    // Convert {id} to :id for Express
    return openApiPath.replace(/\{([^}]+)\}/g, ':$1');
  }

  private async handleRequest(
    req: Request,
    res: Response,
    pathPattern: string,
    method: string,
    operation: any
  ): Promise<void> {
    try {
      // Try to load custom mock response
      const mockResponse = await this.loadMockResponse(pathPattern, method);
      
      if (mockResponse) {
        // Use custom mock response
        const statusCode = this.getPreferredStatusCode(mockResponse);
        res.status(statusCode).json(mockResponse[statusCode]);
        return;
      }

      // Fallback to generated response from operation
      const response = this.generateResponseFromOperation(operation);
      res.status(200).json(response);
      
    } catch (error) {
      console.error(`Error handling request for ${method} ${pathPattern}:`, error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to generate mock response'
      });
    }
  }

  private async loadMockResponse(pathPattern: string, method: string): Promise<any> {
    const mockFilePath = this.getMockFilePath(pathPattern, method);
    
    if (await fs.pathExists(mockFilePath)) {
      const content = await fs.readFile(mockFilePath, 'utf-8');
      return JSON.parse(content);
    }
    
    return null;
  }

  private getMockFilePath(pathPattern: string, method: string): string {
    // Convert /users/{id}/posts to users/_id/posts/get.json
    const cleanPath = pathPattern
      .replace(/^\//, '') // Remove leading slash
      .replace(/\{([^}]+)\}/g, '_$1') // Convert {id} to _id
      .replace(/\//g, path.sep); // Use OS-specific path separator

    return path.join(this.mocksDir, cleanPath, `${method.toLowerCase()}.json`);
  }

  private getPreferredStatusCode(mockResponse: Record<string, any>): number {
    // Prefer 200, then 201, then first available
    const statusCodes = Object.keys(mockResponse);
    
    if (statusCodes.includes('200')) return 200;
    if (statusCodes.includes('201')) return 201;
    
    return parseInt(statusCodes[0]) || 200;
  }

  private generateResponseFromOperation(operation: any): any {
    // Simple fallback response generation
    if (operation.responses && operation.responses['200']) {
      const response = operation.responses['200'];
      if (response.content && response.content['application/json']) {
        const schema = response.content['application/json'].schema;
        if (schema && schema.example) {
          return schema.example;
        }
      }
    }

    return {
      message: 'Mock response',
      timestamp: new Date().toISOString(),
      data: {}
    };
  }

  private getAvailableRoutes(): string[] {
    if (!this.spec) return [];

    const routes: string[] = [];
    for (const [pathPattern, methods] of Object.entries(this.spec.paths)) {
      for (const method of Object.keys(methods)) {
        if (typeof methods[method] === 'object') {
          routes.push(`${method.toUpperCase()} ${pathPattern}`);
        }
      }
    }
    return routes;
  }
}