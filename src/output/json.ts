import { DeadCodeItem } from "../utils";
import { writeFileSync } from "fs";
import chalk from "chalk";

export async function generateJsonOutput(results: { js?: DeadCodeItem[]; py?: DeadCodeItem[] }, outputPath?: string): Promise<void> {
  const totalDeadCode = (results.js?.length || 0) + (results.py?.length || 0);
  const timestamp = new Date().toUTCString();

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
}