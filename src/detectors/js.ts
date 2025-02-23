import { execSync } from 'child_process';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { DeadCodeItem } from '../utils';

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
  const normalizedBasePath = resolve(basePath).replace(/\\/g, '/'); // Absolute path: 'C:/Users/yash9/.../src/test-project/js'
  return output
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('Found'))
    .map(line => {
      const match = line.match(/^(.+):(\d+)\s+-\s+(.+)$/);
      if (match) {
        const [, file, lineNumber, symbol] = match;
        const normalizedFile = file.replace(/\\/g, '/').replace(/^\/+/, ''); // '/src/test-project/js/unused.js' -> 'src/test-project/js/unused.js'
        const absoluteFile = resolve(normalizedFile).replace(/\\/g, '/'); // Absolute path of file
        if (absoluteFile.startsWith(normalizedBasePath)) {
          const relativeFile = absoluteFile.substring(normalizedBasePath.length + 1); // 'unused.js'
          return { file: relativeFile, symbol: symbol.trim(), line: parseInt(lineNumber) || 0 };
        }
      }
      return null;
    })
    .filter((item): item is DeadCodeItem => item !== null);
}