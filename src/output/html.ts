import { writeFileSync } from 'fs';
import chalk from 'chalk';
import { DeadCodeItem, groupAndSortByFile } from '../utils';

function getTabScript(): string {
  return `
    document.addEventListener('DOMContentLoaded', () => {
      const tabs = document.querySelectorAll('.tab-button');
      const contents = document.querySelectorAll('.tab-content');

      tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          tabs.forEach(t => t.classList.remove('active'));
          contents.forEach(c => c.classList.remove('active'));
          tab.classList.add('active');
          document.querySelector(\`#$\{tab.getAttribute('data-tab')}\`).classList.add('active');
        });
      });

      if (tabs.length > 0) {
        tabs[0].classList.add('active');
        document.querySelector(\`#$\{tabs[0].getAttribute('data-tab')}\`).classList.add('active');
      }
    });
  `;
}

export async function generateHtmlOutput(results: { js?: DeadCodeItem[]; py?: DeadCodeItem[] }, outputPath?: string): Promise<void> {
  const totalDeadCode = (results.js?.length || 0) + (results.py?.length || 0);
  const timestamp = new Date().toUTCString();
  const hasJs = !!results.js && results.js?.length > 0;
  const hasPy = !!results.py && results.py?.length > 0;
  const showTabs = hasJs && hasPy;

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
        .tabs {
          display: flex;
          margin-bottom: 20px;
        }
        .tab-button {
          flex: 1;
          padding: 10px;
          background-color: #f7f7f7;
          border: none;
          border-radius: 4px 4px 0 0;
          cursor: pointer;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 16px;
          color: #3498db;
          margin-right: 5px;
          transition: background-color 0.3s;
        }
        .tab-button.active {
          background-color: #3498db;
          color: white;
        }
        .tab-button:hover:not(.active) {
          background-color: #e8e8e8;
        }
        .tab-content {
          display: none;
          padding: 10px;
        }
        .tab-content.active {
          display: block;
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
        @media (max-width: 768px) {
          .tabs { flex-direction: column; }
          .tab-button { margin-right: 0; margin-bottom: 5px; border-radius: 4px; }
        }
      </style>
      <script>${getTabScript()}</script>
    </head>
    <body>
      <h1>Deadcode Detective Report</h1>
      <p><strong>Total Dead Code: ${totalDeadCode}</strong></p>
      ${totalDeadCode > 0 ? `
        ${showTabs ? `
          <div class="tabs">
            ${hasJs ? '<button class="tab-button active" data-tab="js-tab">JavaScript/TypeScript</button>' : ''}
            ${hasPy ? '<button class="tab-button' + (hasJs ? '' : ' active') + '" data-tab="py-tab">Python</button>' : ''}
          </div>
          ${hasJs ? '<div id="js-tab" class="tab-content active">' : ''}
            ${hasJs ? Object.entries(groupAndSortByFile(results.js!)).map(([file, fileItems]) => `
              <details open>
                <summary>${file} (${fileItems.length} item${fileItems.length > 1 ? 's' : ''})</summary>
                <table>
                  <tr><th>Symbol</th><th>Line</th><th>Language</th></tr>
                  ${fileItems.map(item => `
                    <tr>
                      <td class="${item.symbol === 'No dead code found!' ? 'clean' : 'dead'}">❗ ${item.symbol}</td>
                      <td>${item.line}</td>
                      <td>JS</td>
                    </tr>
                  `).join('')}
                </table>
              </details>
            `).join('') : ''}
          ${hasJs ? '</div>' : ''}
          ${hasPy ? '<div id="py-tab" class="tab-content' + (hasJs ? '' : ' active') + '">' : ''}
            ${hasPy ? Object.entries(groupAndSortByFile(results.py!)).map(([file, fileItems]) => `
              <details open>
                <summary>${file} (${fileItems.length} item${fileItems.length > 1 ? 's' : ''})</summary>
                <table>
                  <tr><th>Symbol</th><th>Line</th><th>Language</th><th>Confidence (%)</th></tr>
                  ${fileItems.map(item => `
                    <tr>
                      <td class="${item.symbol === 'No dead code found!' ? 'clean' : 'dead'}">❗ ${item.symbol}</td>
                      <td>${item.line}</td>
                      <td>Python</td>
                      ${item.confidence !== undefined ? `<td>${item.confidence}%</td>` : '<td>N/A</td>'}
                    </tr>
                  `).join('')}
                </table>
              </details>
            `).join('') : ''}
          ${hasPy ? '</div>' : ''}
        ` : `
          ${hasJs ? Object.entries(groupAndSortByFile(results.js!)).map(([file, fileItems]) => `
            <details open>
              <summary>${file} (${fileItems.length} item${fileItems.length > 1 ? 's' : ''})</summary>
              <table>
                <tr><th>Symbol</th><th>Line</th><th>Language</th></tr>
                ${fileItems.map(item => `
                  <tr>
                    <td class="${item.symbol === 'No dead code found!' ? 'clean' : 'dead'}">❗ ${item.symbol}</td>
                    <td>${item.line}</td>
                    <td>JS</td>
                  </tr>
                `).join('')}
              </table>
            </details>
          `).join('') : ''}
          ${hasPy ? Object.entries(groupAndSortByFile(results.py!)).map(([file, fileItems]) => `
            <details open>
              <summary>${file} (${fileItems.length} item${fileItems.length > 1 ? 's' : ''})</summary>
              <table>
                <tr><th>Symbol</th><th>Line</th><th>Language</th><th>Confidence (%)</th></tr>
                ${fileItems.map(item => `
                  <tr>
                    <td class="${item.symbol === 'No dead code found!' ? 'clean' : 'dead'}">❗ ${item.symbol}</td>
                    <td>${item.line}</td>
                    <td>Python</td>
                    ${item.confidence !== undefined ? `<td>${item.confidence}%</td>` : '<td>N/A</td>'}
                  </tr>
                `).join('')}
              </table>
            </details>
          `).join('') : ''}
        `}
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
}