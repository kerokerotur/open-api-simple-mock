#!/usr/bin/env node

import { Command } from 'commander';
import { generateCommand } from './commands/generate';
import { runCommand } from './commands/run';

const program = new Command();

program
  .name('open-api-nice-mock')
  .description('CLI tool to generate TypeScript models and mock servers from OpenAPI specifications')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate TypeScript models and mock server code from OpenAPI specification')
  .argument('<spec>', 'OpenAPI specification file path or URL')
  .option('-o, --output <dir>', 'Output directory', './generated')
  .option('-g, --generator-name <name>', 'Generator name', 'typescript-node')
  .option('--additional-properties <props>', 'Additional properties for generator')
  .option('--global-property <props>', 'Global properties for generator')
  .option('--config <file>', 'Configuration file for generator')
  .option('--template-dir <dir>', 'Template directory')
  .option('--auth <auth>', 'Authorization header for fetching spec')
  .option('--skip-validate-spec', 'Skip validation of input spec')
  .option('--strict-spec', 'Treat spec strictly')
  .action(generateCommand);

program
  .command('run')
  .description('Start mock server using generated models')
  .option('-p, --port <port>', 'Port to run the server on', '3000')
  .option('-d, --dir <dir>', 'Directory containing generated files', './generated')
  .option('-h, --host <host>', 'Host to bind the server to', 'localhost')
  .action(runCommand);

program.parse();