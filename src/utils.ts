import chalk from 'chalk';

export interface DeadCodeItem {
  file: string;
  symbol: string;
  line: number;
  type?: string; // Optional for Python-specific metadata
}

function groupByFile(items: DeadCodeItem[]): { [file: string]: DeadCodeItem[] } {
  const grouped: { [file: string]: DeadCodeItem[] } = {};
  items.forEach(item => {
    grouped[item.file] = grouped[item.file] || [];
    grouped[item.file].push(item);
  });
  return grouped;
}

export function printResults(results: { js?: DeadCodeItem[]; py?: DeadCodeItem[] }) {
  console.log(chalk.bold('\n🔎 Dead Code Report:'));

  if (results.js?.length) {
    console.log(chalk.red(`\n❗ Found ${results.js.length} unused item${results.js.length > 1 ? 's' : ''} in JavaScript/TypeScript:`));
    const grouped = groupByFile(results.js);
    for (const [file, items] of Object.entries(grouped)) {
      console.log(chalk.cyan(`\n${file}:`));
      items.forEach(item => console.log(`  - ${chalk.yellow(item.symbol)} (line ${item.line})`));
    }
  }

  if (results.py?.length) {
    console.log(chalk.red(`\n❗ Found ${results.py.length} unused item${results.py.length > 1 ? 's' : ''} in Python:`));
    const grouped = groupByFile(results.py);
    for (const [file, items] of Object.entries(grouped)) {
      console.log(chalk.cyan(`\n${file}:`));
      items.forEach(item => console.log(`  - ${chalk.yellow(item.symbol)} (line ${item.line})`));
    }
  }

  if (!results.js?.length && !results.py?.length) {
    console.log(chalk.green('\n✅ No dead code found!'));
  }
}