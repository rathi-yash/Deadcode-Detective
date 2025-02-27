import { execSync } from 'child_process';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { DeadCodeItem } from '../types.js';

export async function detectJS(path: string): Promise<DeadCodeItem[]> {
  console.log('Make sure `ts-prune` is installed (`npm install -g ts-prune`)');
  try {
    const tsConfigPath = './tsconfig.json';
    const absoluteTsConfigPath = resolve(tsConfigPath);
    if (!existsSync(absoluteTsConfigPath)) {
      throw new Error(`tsconfig.json not found at ${absoluteTsConfigPath}`);
    }
    const command = `npx ts-prune -p ${tsConfigPath} --error`;
    const output = execSync(command, { encoding: 'utf-8', cwd: process.cwd() });
    return parseTSPruneOutput(output, path);
  } catch (error) {
    const err = error as any;
    if (err.stdout) {
      return parseTSPruneOutput(err.stdout.toString(), path);
    }
    throw new Error(err.stderr ? `ts-prune failed: ${err.stderr}` : `ts-prune error: ${err.message}`);
  }
}

function parseTSPruneOutput(output: string, basePath: string): DeadCodeItem[] {
  const normalizedBasePath = resolve(basePath).replace(/\\/g, '/');
  return output
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('Found'))
    .map(line => {
      const match = line.match(/^(.+):(\d+)\s+-\s+(.+)$/);
      if (match) {
        const [, file, lineNumber, symbol] = match;
        const normalizedFile = file.replace(/\\/g, '/').replace(/^\/+/, '');
        const absoluteFile = resolve(normalizedFile).replace(/\\/g, '/');
        if (absoluteFile.startsWith(normalizedBasePath)) {
          const relativeFile = absoluteFile.substring(normalizedBasePath.length + 1);
          
          // Determine language based on file extension
          let language: string;
          if (relativeFile.endsWith('.ts')) {
            language = 'TS';
          } else {
            language = 'JS';
          }
          return { file: relativeFile, symbol: symbol.trim(), line: parseInt(lineNumber) || 0, language } as DeadCodeItem;
        }
      }
      return null;
    })
    .filter((item): item is DeadCodeItem => item !== null);
}