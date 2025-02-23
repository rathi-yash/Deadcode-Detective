import { execSync } from 'child_process';
import { DeadCodeItem } from '../utils';

export async function detectPython(path: string, confidence?: number): Promise<DeadCodeItem[]> {
  console.log('Make sure `vulture` is installed (`pip install vulture`)');
  try {
    // Validate confidence
    if (confidence !== undefined) {
      if (isNaN(confidence)) {
        throw new Error('Confidence must be a number between 0 and 100');
      }
      if (confidence > 100) {
        throw new Error('Confidence cannot exceed 100');
      }
      if (confidence < 0) {
        throw new Error('Confidence cannot be less than 0');
      }
    }

    const minConfidence = Math.max(0, Math.min(100, confidence || 60));
    const output = execSync(`vulture ${path} --min-confidence ${minConfidence}`, { encoding: 'utf-8' });
    return parseVultureOutput(output);
  } catch (error) {
    const err = error as any;
    if (err.stdout) {
      return parseVultureOutput(err.stdout.toString());
    }
    throw new Error(err.stderr ? `vulture failed: ${err.stderr}` : `vulture error: ${err.message}`);
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
    .map(item => ({ ...item } as DeadCodeItem)); 
  }