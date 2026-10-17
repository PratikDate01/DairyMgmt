const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const targetFile = process.argv[2];

if (!targetFile) {
  console.log('Usage: node scripts/inspect_file.cjs <relative_path>');
  process.exit(1);
}

const fullPath = path.join(srcDir, targetFile);
const content = fs.readFileSync(fullPath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  const jsxTextMatch = line.match(/>\s*([A-Za-z]{3,}[^<>{}]*)\s*</);
  if (jsxTextMatch) {
    const text = jsxTextMatch[1].trim();
    if (!['http', 'https', 'className', 'true', 'false', 'null', 'undefined', 'console', 'return', 'import', 'from'].includes(text)) {
      console.log(`L${idx + 1}: ${text}`);
    }
  }
});
