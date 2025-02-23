import { execSync } from 'child_process';
import { DeadCodeItem } from '../utils';

export async function detectPython(path: string): Promise<DeadCodeItem[]> {
  console.log('Make sure `vulture` is installed (`pip install vulture`)');
  try {
    const output = execSync(`vulture ${path} --min-confidence 60`, { encoding: 'utf-8' });
    return parseVultureOutput(output);
  } catch (error) {
    const err = error as any;
    if (err.stdout) {
      return parseVultureOutput(err.stdout.toString());
    }
    return [];
  }
}

function parseVultureOutput(output: string): DeadCodeItem[] {
  return output
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const [fileLine, rest] = line.split(': ');
      if (!fileLine || !rest) return null;

      const [file, lineNumber] = fileLine.split(':');
      const match = rest.match(/^(unused \w+)\s+'([^']+)'/);
      if (!match) return null;

      const [, type, symbol] = match;
      return { file, symbol, type, line: parseInt(lineNumber) || 0 };
    })
    .filter((item): item is { file: string; symbol: string; type: string; line: number } => item !== null)
    .map(item => ({ ...item } as DeadCodeItem)); // Cast to DeadCodeItem with optional `type`
}