import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import { OpenAPIGenerator } from '../core/openapi-generator';
import { MockGenerator } from '../core/mock-generator';

const execAsync = promisify(exec);

export interface GenerateOptions {
  output: string;
  generatorName: string;
  additionalProperties?: string;
  globalProperty?: string;
  config?: string;
  templateDir?: string;
  auth?: string;
  skipValidateSpec?: boolean;
  strictSpec?: boolean;
}

export async function generateCommand(spec: string, options: GenerateOptions): Promise<void> {
  try {
    console.log(`Generating from OpenAPI spec: ${spec}`);
    console.log(`Output directory: ${options.output}`);

    // Ensure output directory exists
    await fs.ensureDir(options.output);

    // Initialize OpenAPI Generator
    const generator = new OpenAPIGenerator();
    
    // Generate TypeScript models and API client
    await generator.generate(spec, options);

    // Generate mock server code
    const mockGenerator = new MockGenerator();
    await mockGenerator.generateMockServer(spec, options.output);

    console.log('✓ Generation completed successfully!');
    console.log(`Generated files are in: ${path.resolve(options.output)}`);
    console.log('Run "open-api-nice-mock run" to start the mock server');
  } catch (error) {
    console.error('Error during generation:', error);
    process.exit(1);
  }
}