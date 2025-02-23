#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { detectJS } from './detectors/js.js'; // Remove .ts
import { detectPython } from './detectors/python.js'; // Remove .ts
import { printResults, DeadCodeItem } from './utils.js';

program
  .name('deadcode-detective')
  .description('Detect dead code in JavaScript/TypeScript and Python projects')
  .version('1.0.0');

program
  .command('detect')
  .option('--js <path>', 'Scan JavaScript/TypeScript files')
  .option('--py <path>', 'Scan Python files')
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
        results.py = await detectPython(options.py);
      }
      spinner.succeed('Scan completed successfully');
      printResults(results);
    } catch (error) {
      spinner.fail('Scan failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program.parse();