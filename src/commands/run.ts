import * as path from 'path';
import * as fs from 'fs-extra';
import { MockServer } from '../core/mock-server';

export interface RunOptions {
  port: string;
  dir: string;
  host: string;
}

export async function runCommand(options: RunOptions): Promise<void> {
  try {
    const generatedDir = path.resolve(options.dir);
    
    // Check if generated directory exists
    if (!await fs.pathExists(generatedDir)) {
      console.error(`Generated directory not found: ${generatedDir}`);
      console.error('Please run "open-api-nice-mock generate" first');
      process.exit(1);
    }

    // Check if OpenAPI spec exists in generated directory
    const specPath = path.join(generatedDir, 'openapi.json');
    if (!await fs.pathExists(specPath)) {
      console.error(`OpenAPI spec not found: ${specPath}`);
      console.error('Please run "open-api-nice-mock generate" first');
      process.exit(1);
    }

    console.log(`Starting mock server...`);
    console.log(`Host: ${options.host}`);
    console.log(`Port: ${options.port}`);
    console.log(`Generated files directory: ${generatedDir}`);

    // Start mock server
    const mockServer = new MockServer(generatedDir);
    await mockServer.start(parseInt(options.port), options.host);

  } catch (error) {
    console.error('Error starting mock server:', error);
    process.exit(1);
  }
}