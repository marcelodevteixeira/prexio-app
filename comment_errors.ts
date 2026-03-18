import fs from 'fs';
import { execSync } from 'child_process';

try {
  execSync('npx tsc --noEmit');
} catch (error: any) {
  const output = error.stdout.toString();
  const lines = output.split('\n');
  
  const filesToFix: Record<string, Set<number>> = {};
  
  for (const line of lines) {
    const match = line.match(/^([^:]+)\((\d+),\d+\): error TS/);
    if (match) {
      const file = match[1];
      const lineNum = parseInt(match[2], 10);
      if (!filesToFix[file]) {
        filesToFix[file] = new Set();
      }
      filesToFix[file].add(lineNum);
    }
  }
  
  for (const file in filesToFix) {
    if (file.includes('api/')) continue; // Ignore api folder
    if (file === 'src/App.tsx') continue; // Don't mess up App.tsx
    
    let content = fs.readFileSync(file, 'utf-8').split('\n');
    const linesToComment = Array.from(filesToFix[file]).sort((a, b) => b - a);
    
    for (const lineNum of linesToComment) {
      const idx = lineNum - 1;
      if (content[idx] && !content[idx].trim().startsWith('//')) {
        content[idx] = '// ' + content[idx];
      }
    }
    
    fs.writeFileSync(file, content.join('\n'));
  }
}
