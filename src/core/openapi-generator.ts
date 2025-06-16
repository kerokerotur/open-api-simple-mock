import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import { GenerateOptions } from '../commands/generate';

const execAsync = promisify(exec);

export class OpenAPIGenerator {
  async generate(spec: string, options: GenerateOptions): Promise<void> {
    const args = this.buildGeneratorArgs(spec, options);
    const command = `npx @openapitools/openapi-generator-cli generate ${args.join(' ')}`;
    
    console.log(`Running: ${command}`);
    
    try {
      const { stdout, stderr } = await execAsync(command);
      
      if (stdout) {
        console.log(stdout);
      }
      
      if (stderr) {
        console.warn(stderr);
      }

      // Copy the original spec to the output directory for mock server
      await this.copySpecToOutput(spec, options.output);
      
    } catch (error) {
      throw new Error(`OpenAPI Generator failed: ${error}`);
    }
  }

  private buildGeneratorArgs(spec: string, options: GenerateOptions): string[] {
    const args = [
      `-i "${spec}"`,
      `-g ${options.generatorName}`,
      `-o "${options.output}"`
    ];

    if (options.additionalProperties) {
      args.push(`--additional-properties "${options.additionalProperties}"`);
    }

    if (options.globalProperty) {
      args.push(`--global-property "${options.globalProperty}"`);
    }

    if (options.config) {
      args.push(`-c "${options.config}"`);
    }

    if (options.templateDir) {
      args.push(`-t "${options.templateDir}"`);
    }

    if (options.auth) {
      args.push(`--auth "${options.auth}"`);
    }

    if (options.skipValidateSpec) {
      args.push('--skip-validate-spec');
    }

    if (options.strictSpec) {
      args.push('--strict-spec');
    }

    return args;
  }

  private async copySpecToOutput(spec: string, outputDir: string): Promise<void> {
    try {
      let specContent: string;
      
      if (spec.startsWith('http://') || spec.startsWith('https://')) {
        // Fetch from URL
        const response = await fetch(spec);
        specContent = await response.text();
      } else {
        // Read from file
        specContent = await fs.readFile(spec, 'utf-8');
      }

      // Determine if it's JSON or YAML and save accordingly
      const isJson = spec.endsWith('.json') || (specContent.trim().startsWith('{'));
      const outputFileName = isJson ? 'openapi.json' : 'openapi.yaml';
      const outputPath = path.join(outputDir, outputFileName);
      
      await fs.writeFile(outputPath, specContent);
      console.log(`✓ OpenAPI spec copied to: ${outputPath}`);
    } catch (error) {
      console.warn(`Warning: Could not copy spec file: ${error}`);
    }
  }
}