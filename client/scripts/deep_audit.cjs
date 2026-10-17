const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function walk(dir) {
  let list = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      list = list.concat(walk(full));
    } else if (f.endsWith('.jsx')) {
      list.push(full);
    }
  }
  return list;
}

const files = walk(srcDir);
const report = [];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  const fileIssues = [];

  lines.forEach((l, idx) => {
    // 1. Text between JSX tags >English Text<
    const textMatches = l.match(/>([^<>{}\n]+)</g);
    if (textMatches) {
      for (const tm of textMatches) {
        const text = tm.slice(1, -1).trim();
        if (text.length > 2 && /[A-Za-z]/.test(text)) {
          if (!['div', 'span', 'p', 'true', 'false', 'null', 'undefined', 'className'].includes(text) &&
              !text.startsWith('http') && !text.startsWith('mailto:') && !text.startsWith('tel:') &&
              !/^[0-9\s.,:\/\\#\-\+*%()]+$/.test(text) &&
              !text.includes('console.') && !text.includes('return ')) {
            if (/^[A-Za-z0-9\s.,\-_!?()\/:'"₹]+$/.test(text) && /[a-z]/.test(text)) {
              fileIssues.push({ line: idx + 1, type: 'JSX text', text });
            }
          }
        }
      }
    }

    // 2. Hardcoded placeholder="..."
    const placeholderMatch = l.match(/placeholder=["']([^"']+)["']/);
    if (placeholderMatch) {
      const ph = placeholderMatch[1].trim();
      if (ph.length > 2 && /[A-Za-z]/.test(ph) && !ph.includes('{') && !ph.includes('t(')) {
        fileIssues.push({ line: idx + 1, type: 'Placeholder', text: ph });
      }
    }

    // 3. Hardcoded title="..." on components
    const titleMatch = l.match(/title=["']([^"']+)["']/);
    if (titleMatch) {
      const tit = titleMatch[1].trim();
      if (tit.length > 2 && /[A-Za-z]/.test(tit) && !['cursor-pointer', 'fixed'].includes(tit) && !tit.includes('{') && !tit.includes('t(')) {
        fileIssues.push({ line: idx + 1, type: 'Title prop', text: tit });
      }
    }
  });

  if (fileIssues.length > 0) {
    report.push({ file: path.relative(srcDir, f), count: fileIssues.length, issues: fileIssues });
  }
}

console.log('Total files checked:', files.length);
console.log('Files with potential hardcoded strings:', report.length);
report.sort((a,b) => b.count - a.count).forEach(r => {
  console.log(`${r.file.padEnd(50)} : ${r.count} items`);
});

fs.writeFileSync(path.join(__dirname, 'audit_report.json'), JSON.stringify(report, null, 2), 'utf8');
console.log('Saved detailed audit to client/scripts/audit_report.json');
