import chalk from 'chalk';
import { Ora } from 'ora';
import { generateHtmlOutput } from './output/html.js';
import { generateJsonOutput } from './output/json.js';
import { DeadCodeItem } from './types.js';

function printCliResults(results: { js?: DeadCodeItem[]; py?: DeadCodeItem[] }) {
  console.log(chalk.bold('\n\u{1F50E} Dead Code Report:'));

  if (results.js?.length) {
    console.log(chalk.red(`\n❗ Found ${results.js.length} unused item${results.js.length > 1 ? 's' : ''} in JavaScript/TypeScript:`));
    const grouped = groupAndSortByFile(results.js);
    for (const [file, items] of Object.entries(grouped)) {
      console.log(chalk.cyan(`\n${file}:`));
      items.forEach(item => console.log(`  - ${chalk.yellow(item.symbol)} (line ${item.line}) (${item.language || 'JS'})`));
    }
  }

  if (results.py?.length) {
    console.log(chalk.red(`\n❗ Found ${results.py.length} unused item${results.py.length > 1 ? 's' : ''} in Python:`));
    const grouped = groupAndSortByFile(results.py);
    for (const [file, items] of Object.entries(grouped)) {
      console.log(chalk.cyan(`\n${file}:`));
      items.forEach(item => console.log(`  - ${chalk.yellow(item.symbol)} (line ${item.line})${item.confidence ? ` (confidence: ${item.confidence}%)` : ''} (${item.language || 'Python'})`));
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
  for (const file in grouped) {
    grouped[file].sort((a, b) => a.line - b.line);
  }
  return grouped;
}

export async function generateOutput(
  results: { js?: DeadCodeItem[]; py?: DeadCodeItem[] },
  format: 'cli' | 'html' | 'json',
  outputPath?: string,
  spinner?: Ora
) {
  switch (format) {
    case 'cli':
      if (spinner) spinner.succeed('Scan completed successfully');
      printCliResults(results);
      break;

    case 'html':
      if (spinner) spinner.succeed('Scan completed successfully');
      await generateHtmlOutput(results, outputPath);
      break;

    case 'json':
      if (spinner) spinner.succeed('Scan completed successfully');
      await generateJsonOutput(results, outputPath);
      break;

    default:
      if (spinner) spinner.fail('Invalid format');
      throw new Error('Invalid Format');
  }
}