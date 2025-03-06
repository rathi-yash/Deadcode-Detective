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
  .version('1.2.0');

program
  .command('detect')
  .option('--js <path>', 'Scan JavaScript/TypeScript files')
  .option('--py <path>', 'Scan Python files')
  .option('--confidence <number>', 'Confidence threshold for Python dead code detection (0-100, default: 60)', '60')
  .option('--format <type>', 'Output format (cli, html, json, default: cli)', 'cli')
  .option('--output <file>', 'Output file path (for html/json, defaults to console for json, file for html)')
  .option('--ignore <patterns>', 'Comma-separated paths/patterns to ignore, must use single quotes and ** (e.g., \'**/test/**,**/node_modules/**\')')
  .action(async (options) => {
    const spinner = ora('Scanning for dead code...').start();
    const results: { js?: DeadCodeItem[]; py?: DeadCodeItem[] } = {};

    let ignorePatterns: string[] = [];
    if (options.ignore) {
      // Strip leading/trailing quotes before splitting
      const cleanedIgnore = options.ignore.replace(/^'|'$/g, '');
      const rawPatterns = cleanedIgnore.split(',');
      console.log(`\nRaw ignore patterns: ${rawPatterns}`);

      // Check for ** in every pattern
      const missingWildcard = rawPatterns.some((p: string) => !p.includes('**'));
      if (missingWildcard) {
        spinner.fail('Invalid --ignore argument');
        console.error(chalk.red('Error: All ignore patterns must contain "**" (e.g., \'**/test/**,**/node_modules**\').'));
        process.exit(1);
      }

      // Check for shell expansion
      const hasExpansion = rawPatterns.some((p: string) => p.includes('C:') || p.match(/[A-Za-z]:/));
      if (hasExpansion) {
        spinner.fail('Invalid --ignore argument');
        console.error(chalk.red('Error: Shell expansion detected. Use single quotes (e.g., \'**/test/**,**/node_modules**\') and check shell settings (e.g., bypass winpty alias in MINGW64).'));
        process.exit(1);
      }

      ignorePatterns = rawPatterns.map((p: string) => p.trim());
      console.log(`Filtered ignore patterns: ${ignorePatterns}`);
    }

    try {
      if (options.js) {
        spinner.text = 'Scanning JavaScript/TypeScript files...';
        results.js = await detectJS(options.js, ignorePatterns);
      }
      if (options.py) {
        spinner.text = 'Scanning Python files...';
        const confidence = parseInt(options.confidence, 10) || 60;
        const confidenceValue = Math.max(0, Math.min(100, confidence));
        results.py = await detectPython(options.py, confidenceValue, ignorePatterns);
      }
      const format = options.format.toLowerCase() as 'cli' | 'html' | 'json';
      const outputPath = options.output;
      await generateOutput(results, format, outputPath, spinner);
    } catch (error) {
      spinner.fail('Scan failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program.parse();