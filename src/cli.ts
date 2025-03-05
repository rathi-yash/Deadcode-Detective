#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { detectJS } from './detectors/js.js';
import { detectPython } from './detectors/python.js';
import { generateOutput } from './utils.js';
import { DeadCodeItem } from './types.js';

// Force UTF-8 on Windows
if (process.platform === 'win32') {
  process.stdout.setEncoding('utf8');
  process.stderr.setEncoding('utf8');
}

program
  .name('deadcode-detective')
  .description('Detect dead code in JavaScript/TypeScript and Python projects')
  .version('1.1.0');

program
  .command('detect')
  .option('--js <path>', 'Scan JavaScript/TypeScript files')
  .option('--py <path>', 'Scan Python files')
  .option('--confidence <number>', 'Confidence threshold for Python dead code detection (0-100, default: 60)', '60')
  .option('--format <type>', 'Output format (cli, html, json, default: cli)', 'cli')
  .option('--output <file>', 'Output file path (for html/json, defaults to console for json, file for html)')
  .option('--ignore <patterns>', 'Comma-separated paths/patterns to ignore (e.g., "**/test/**,node_modules/**")')
  .action(async (options) => {
    const spinner = ora('Scanning for dead code...').start();
    const results: { js?: DeadCodeItem[]; py?: DeadCodeItem[] } = {};

    const rawPatterns = options.ignore ? options.ignore.split(',') : [];
    console.log(`Raw ignore patterns: ${rawPatterns}`);
    const hasExpansion = rawPatterns.some((p: string) => p.includes('C:') || p.match(/[A-Za-z]:/));
    let ignorePatterns = rawPatterns
      .map((p: string) => p.trim())
      .filter((p: string) => !p.includes('C:') && !p.match(/[A-Za-z]:/));
    console.log(`Filtered ignore patterns: ${ignorePatterns}`);
    if (hasExpansion) {
      console.warn(chalk.yellow('Warning: Shell expansion detected in ignore patterns. Ignoring them—use single quotes (e.g., \'**/test/**\') or check shell settings.'));
      ignorePatterns = []; // No defaults, just skip bad patterns
    }

    try {
      if (options.js) {
        spinner.text = 'Scanning JavaScript/TypeScript files...';
        results.js = await detectJS(options.js, ignorePatterns);
      }
      if (options.py) {
        spinner.text = 'Scanning Python files...';
        const confidence = parseInt(options.confidence, 10);
        results.py = await detectPython(options.py, confidence, ignorePatterns);
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