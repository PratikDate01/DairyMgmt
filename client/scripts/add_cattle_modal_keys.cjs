const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'en', 'farmer.json');
const mrPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'mr', 'farmer.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const mr = JSON.parse(fs.readFileSync(mrPath, 'utf8'));

const enCattle = {
  noScansYet: 'No scans yet',
  aiHealthScreeningHistory: 'AI Health Screening History',
  loadingHealthRecords: 'Loading health screening records...',
  noHealthScreeningsYet: 'No health screenings recorded yet for {{name}}.'
};

const mrCattle = {
  noScansYet: 'अद्याप कोणतेही स्कॅन नाही',
  aiHealthScreeningHistory: 'AI आरोग्य तपासणी इतिहास',
  loadingHealthRecords: 'आरोग्य तपासणी नोंदी लोड होत आहेत...',
  noHealthScreeningsYet: '{{name}} साठी अद्याप कोणतीही आरोग्य तपासणी नोंदवलेली नाही.'
};

Object.assign(en.cattle, enCattle);
Object.assign(mr.cattle, mrCattle);

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
fs.writeFileSync(mrPath, JSON.stringify(mr, null, 2) + '\n', 'utf8');
console.log('Successfully updated cattle extra keys in farmer locales.');
