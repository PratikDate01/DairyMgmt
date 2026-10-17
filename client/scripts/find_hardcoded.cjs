const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function getAllJsxFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllJsxFiles(fullPath));
    } else if (file.endsWith('.jsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getAllJsxFiles(srcDir);
console.log(`Found ${files.length} JSX files in src.`);

const hardcodedMatches = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(srcDir, file);

  // Check if file uses translation
  const hasUseTranslation = content.includes('useTranslation') || content.includes('i18n');

  // Simple regex for JSX text nodes: >Text< where Text has English words and not just whitespace or symbols
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Look for text between tags: >Some English Text<
    const jsxTextMatch = line.match(/>\s*([A-Za-z]{3,}[^<>{}]*)\s*</);
    if (jsxTextMatch) {
      const text = jsxTextMatch[1].trim();
      // Ignore common false positives
      if (!['http', 'https', 'className', 'true', 'false', 'null', 'undefined', 'console', 'return', 'import', 'from'].includes(text)) {
        hardcodedMatches.push({
          file: relPath,
          line: idx + 1,
          type: 'JSX Text',
          text
        });
      }
    }
  });
});

console.log(`Potential hardcoded JSX text matches: ${hardcodedMatches.length}`);
// Print breakdown by file
const fileCounts = {};
hardcodedMatches.forEach(m => {
  fileCounts[m.file] = (fileCounts[m.file] || 0) + 1;
});

const sortedFiles = Object.entries(fileCounts).sort((a, b) => b[1] - a[1]);
console.log('Top files with potential hardcoded strings:');
sortedFiles.slice(0, 20).forEach(([f, count]) => {
  console.log(`  ${f}: ${count}`);
});
