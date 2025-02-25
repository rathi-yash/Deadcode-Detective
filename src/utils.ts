import chalk from 'chalk';
import { generateHtmlOutput } from './output/html';
import { generateJsonOutput } from './output/json';

export interface DeadCodeItem {
  file: string;
  symbol: string;
  line: number;
  type?: string; 
  confidence?: number; 
}

function printCliResults(results: { js?: DeadCodeItem[]; py?: DeadCodeItem[] }) {
  console.log(chalk.bold('\n🔎 Dead Code Report:'));

  if (results.js?.length) {
    console.log(chalk.red(`\n❗ Found ${results.js.length} unused item${results.js.length > 1 ? 's' : ''} in JavaScript/TypeScript:`));
    const grouped = groupAndSortByFile(results.js);
    for (const [file, items] of Object.entries(grouped)) {
      console.log(chalk.cyan(`\n${file}:`));
      items.forEach(item => console.log(`  - ${chalk.yellow(item.symbol)} (line ${item.line})`));
    }
  }

  if (results.py?.length) {
    console.log(chalk.red(`\n❗ Found ${results.py.length} unused item${results.py.length > 1 ? 's' : ''} in Python:`));
    const grouped = groupAndSortByFile(results.py);
    for (const [file, items] of Object.entries(grouped)) {
      console.log(chalk.cyan(`\n${file}:`));
      items.forEach(item => console.log(`  - ${chalk.yellow(item.symbol)} (line ${item.line})${item.confidence ? ` (confidence: ${item.confidence}%)` : ''}`));
    }
  }

  if (!results.js?.length && !results.py?.length) {
    console.log(chalk.green('\n✅ No dead code found!'));
  }
}

export function groupAndSortByFile(items: DeadCodeItem[]): { [file: string]: DeadCodeItem[] } {
  const grouped: { [file: string]: DeadCodeItem[] } = {};
  items.forEach(item => {
    grouped[item.file] = grouped[item.file] || [];
    grouped[item.file].push(item);
  });
  // Sort files alphabetically and items within each file by line number
  for (const file in grouped) {
    grouped[file].sort((a, b) => a.line - b.line);
  }
  return grouped;
}

export async function generateOutput(results: { js?: DeadCodeItem[]; py?: DeadCodeItem[] }, format: 'cli' | 'html' | 'json', outputPath?: string) {
  switch (format) {
    case 'cli':
      printCliResults(results);
      break;

    case 'html':
      await generateHtmlOutput(results, outputPath);
      break;

    case 'json':
      await generateJsonOutput(results, outputPath);
      break;
    default:
      throw new Error('Invalid Format');
  }
}