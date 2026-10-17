const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const enDir = path.join(localesDir, 'en');
const mrDir = path.join(localesDir, 'mr');

const namespaces = fs.readdirSync(enDir).filter(f => f.endsWith('.json'));

let totalEnKeys = 0;
let totalMrKeys = 0;
let missingKeys = 0;
let emptyValues = 0;

function countKeys(obj, prefix = '', lang = 'en', counterpart = null) {
  let count = 0;
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      count += countKeys(v, fullKey, lang, counterpart ? counterpart[k] : null);
    } else {
      count++;
      if (typeof v === 'string' && v.trim() === '') {
        console.error(`[${lang}] Empty value at ${fullKey}`);
        emptyValues++;
      }
      if (counterpart && counterpart[k] === undefined) {
        console.error(`[${lang}] Key missing in counterpart: ${fullKey}`);
        missingKeys++;
      }
    }
  }
  return count;
}

console.log('=== LOCALIZATION CATALOG PARITY AUDIT ===');
namespaces.forEach(ns => {
  const enFile = path.join(enDir, ns);
  const mrFile = path.join(mrDir, ns);

  if (!fs.existsSync(mrFile)) {
    console.error(`Missing Marathi namespace file: ${ns}`);
    missingKeys++;
    return;
  }

  const enContent = JSON.parse(fs.readFileSync(enFile, 'utf8'));
  const mrContent = JSON.parse(fs.readFileSync(mrFile, 'utf8'));

  const enKeys = countKeys(enContent, ns, 'en', mrContent);
  const mrKeys = countKeys(mrContent, ns, 'mr', enContent);

  totalEnKeys += enKeys;
  totalMrKeys += mrKeys;

  console.log(`Namespace: ${ns.padEnd(20)} | EN: ${enKeys.toString().padStart(4)} keys | MR: ${mrKeys.toString().padStart(4)} keys | Status: ${enKeys === mrKeys ? 'PARITY OK' : 'MISMATCH'}`);
});

console.log('--------------------------------------------------');
console.log(`Total Namespaces: ${namespaces.length}`);
console.log(`Total EN Keys:    ${totalEnKeys}`);
console.log(`Total MR Keys:    ${totalMrKeys}`);
console.log(`Missing Keys:     ${missingKeys}`);
console.log(`Empty Values:     ${emptyValues}`);

if (missingKeys === 0 && emptyValues === 0 && totalEnKeys === totalMrKeys) {
  console.log('RESULT: 100% CATALOG PARITY VERIFIED');
  process.exit(0);
} else {
  console.error('RESULT: CATALOG AUDIT FAILED');
  process.exit(1);
}
