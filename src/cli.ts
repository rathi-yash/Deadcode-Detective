#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { detectJS } from './detectors/js.js';
import { detectPython } from './detectors/python.js';
import { generateOutput } from './utils.js';
import { DeadCodeItem } from './types.js';

program
  .name('deadcode-detective')
  .description('Detect dead code in JavaScript/TypeScript and Python projects')
  .version('1.1.0');

program
  .command('detect')
  .option('--js <path>', 'Scan JavaScript/TypeScript files')
  .option('--py <path>', 'Scan Python files')
  .option('--confidence <number>', 'Confidence threshold for Python dead code detection (0-100, default: 60)', '60')
  .option('--format <type>', 'Output format (cli, hyml, json, default: cli)', 'cli')
  .option('--output <file>', 'Output file path (for html/json, defaults to console for json,file for html)')
  .action(async (options) => {
    const spinner = ora('Scanning for dead code...').start();
    const results: { js?: DeadCodeItem[]; py?: DeadCodeItem[] } = {};

    try {
      if (options.js) {
        spinner.text = 'Scanning JavaScript/TypeScript files...';
        results.js = await detectJS(options.js);
      }
      if (options.py) {
        spinner.text = 'Scanning Python files...';
        const confidence = parseInt(options.confidence, 10);
        results.py = await detectPython(options.py, confidence);
      }
      spinner.succeed('Scan completed successfully');

      const format = options.format.toLowerCase() as 'cli' | 'html' | 'json';
      const outputPath = options.output;
      await generateOutput(results, format, outputPath);
    } catch (error) {
      spinner.fail('Scan failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program.parse();