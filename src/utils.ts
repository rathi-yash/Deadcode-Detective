import { writeFileSync } from 'fs';
import chalk from 'chalk';

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

function groupAndSortByFile(items: DeadCodeItem[]): { [file: string]: DeadCodeItem[] } {
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
  const totalDeadCode = (results.js?.length || 0) + (results.py?.length || 0);
  const timestamp = new Date().toUTCString();

  switch (format) {
    case 'cli':
      printCliResults(results);
      break;

      case 'html':
        const html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Deadcode Detective Report</title>
            <style>
              body {
                font-family: Arial, Helvetica, sans-serif;
                background-color: #f0f0f0;
                color: #333333;
                margin: 30px;
                padding: 15px;
                line-height: 1.8;
              }
              h1 {
                color: #3498db;
                font-size: 20px;
                text-align: center;
                margin-bottom: 20px;
                font-weight: bold;
              }
              p {
                font-size: 16px;
                margin: 10px 0;
                text-align: center;
                background-color: rgba(230, 243, 255, 0.05);
                padding: 10px;
                border-radius: 4px;
              }
              .clean { color: #2ecc71; }
              .dead { color: #e74c3c; }
              table {
                border-collapse: collapse;
                width: 100%;
                margin: 20px 0;
                border-radius: 6px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              th, td {
                border: 1px solid #d3d3d3;
                padding: 15px;
                text-align: left;
                font-size: 16px;
              }
              th {
                background-color: #3498db;
                color: white;
                font-weight: bold;
              }
              tr:nth-child(even) { background-color: #ffffff; }
              tr:nth-child(odd) { background-color: #f7f7f7; }
              tr:hover { background-color: #e8e8e8; }
              a {
                color: #3498db;
                text-decoration: none;
              }
              a:hover {
                color: #5dade2;
                text-decoration: underline;
              }
              .footer {
                text-align: center;
                color: #666666;
                font-size: 12px;
                margin-top: 20px;
              }
              details {
                margin-bottom: 10px;
              }
              summary {
                cursor: pointer;
                padding: 10px;
                background-color: #f7f7f7;
                border-radius: 4px;
                font-weight: bold;
                color: #3498db;
              }
              summary:hover {
                background-color: #e8e8e8;
              }
            </style>
          </head>
          <body>
            <h1>Deadcode Detective Report</h1>
            <p><strong>Total Dead Code: ${totalDeadCode}</strong></p>
            ${totalDeadCode > 0 ? `
              ${Object.entries({ ...(results.js ? { js: results.js } : {}), ...(results.py ? { py: results.py } : {}) })
                .map(([lang, items]: [string, DeadCodeItem[]]) => {
                  const grouped = groupAndSortByFile(items);
                  return Object.entries(grouped).map(([file, fileItems]) => `
                    <details open>
                      <summary>${file} (${fileItems.length} item${fileItems.length > 1 ? 's' : ''})</summary>
                      <table>
                        <tr><th>Symbol</th><th>Line</th><th>Language</th>${lang === 'py' ? '<th>Confidence (%)</th>' : ''}</tr>
                        ${fileItems.map(item => `
                          <tr>
                            <td class="${item.symbol === 'No dead code found!' ? 'clean' : 'dead'}">❗ ${item.symbol}</td>
                            <td>${item.line}</td>
                            <td>${item.type ? 'Python' : 'JS'}</td>
                            ${item.confidence ? `<td>${item.confidence}%</td>` : ''}
                          </tr>
                        `).join('')}
                      </table>
                    </details>
                  `).join('');
                }).join('')}
            ` : '<p class="clean">✅ No dead code found!</p>'}
            <div class="footer">
              Generated by Deadcode Detective v1.0.1 | 
              <a href="https://github.com/rathi-yash/Deadcode-Detective">GitHub</a> | 
              <a href="https://www.npmjs.com/package/deadcode-detective">npm</a> | 
              ${timestamp}
            </div>
          </body>
          </html>
        `;
        if (outputPath) {
          writeFileSync(outputPath, html, 'utf-8');
          console.log(chalk.green(`HTML report saved to ${outputPath}`));
        } else {
          console.log(html);
        }
        break;

    case 'json':
      const json = JSON.stringify({
        js: results.js?.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line) || [],
        py: results.py?.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line) || [],
        summary: { totalDeadCode, timestamp },
      }, null, 2);
      if (outputPath) {
        writeFileSync(outputPath, json, 'utf-8');
        console.log(chalk.green(`JSON report saved to ${outputPath}`));
      } else {
        console.log(json);
      }
      break;
  }
}