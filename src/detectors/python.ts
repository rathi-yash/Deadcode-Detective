import { execSync } from 'child_process';
import { existsSync, readdirSync, Dirent } from 'fs';
import { join, resolve, relative } from 'path';
import { minimatch } from 'minimatch';
import { DeadCodeItem } from '../types.js';
import chalk from 'chalk';

export async function detectPython(path: string, confidence: number = 60, ignorePatterns: string[] = []): Promise<DeadCodeItem[]> {
  console.log('Make sure `vulture` is installed (`pip install vulture`)');
  try {
    if (isNaN(confidence) || confidence > 100 || confidence < 0) {
      throw new Error('Confidence must be a number between 0 and 100');
    }

    const minConfidence = Math.max(0, Math.min(100, confidence));
    const projectRoot = resolve(process.cwd());
    const files = getFiles(path).filter(file => {
      const absoluteFile = resolve(file).replace(/\\/g, '/');
      const relativeFile = relative(projectRoot, absoluteFile).replace(/\\/g, '/');
      return !ignorePatterns.some(pattern => minimatch(relativeFile, pattern.replace(/\\/g, '/'), { matchBase: false, dot: true }));
    });
    if (files.length === 0) return [];

    const output = execSync(`vulture ${files.join(' ')} --min-confidence ${minConfidence}`, { encoding: 'utf-8' });
    return parseVultureOutput(output);
  } catch (error) {
    const err = error as any;
    if (err.stdout) {
      return parseVultureOutput(err.stdout.toString());
    }
    console.error(chalk.red('vulture error occurred, returning empty results:', err.message || err.stderr));
    return [];
  }
}

function getFiles(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  const entries: Dirent[] = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getFiles(fullPath));
    } else if (fullPath.endsWith('.py')) {
      results.push(fullPath);
    }
  }
  return results;
}

function parseVultureOutput(output: string): DeadCodeItem[] {
  return output
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const [fileLine, rest] = line.split(': ');
      if (!fileLine || !rest) return null;

      const [file, lineNumber] = fileLine.split(':');
      const match = rest.match(/^(unused \w+)\s+'([^']+)'\s*(?:\(((\d+)% confidence)\))?/);
      if (!match) return null;

      const [, type, symbol, _, confidenceStr] = match;
      const confidence = confidenceStr ? parseInt(confidenceStr, 10) : undefined;
      return {
        file,
        symbol,
        type,
        line: parseInt(lineNumber) || 0,
        confidence,
      } as DeadCodeItem;
    })
    .filter((item): item is DeadCodeItem => item !== null);
}