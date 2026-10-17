const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/i18n/locales');

// 1. Update admin.json
const enAdminPath = path.join(localesDir, 'en/admin.json');
const mrAdminPath = path.join(localesDir, 'mr/admin.json');
const enAdmin = JSON.parse(fs.readFileSync(enAdminPath, 'utf8'));
const mrAdmin = JSON.parse(fs.readFileSync(mrAdminPath, 'utf8'));

enAdmin.dashboard.approveAccount = 'Approve Account';
enAdmin.dashboard.rejectAccount = 'Reject Account';
enAdmin.dashboard.licensePlaceholder = 'e.g. VET-MH-2024-8841';
enAdmin.dashboard.complaintTitlePlaceholder = 'e.g. Discrepancy in milk collection fat rate';
enAdmin.dashboard.ecosystemNotice1 = 'All reporting aggregations displayed in this dashboard and the dedicated reports page are computed dynamically from active MongoDB collections';
enAdmin.dashboard.ecosystemNotice2 = 'Admin oversight does not duplicate financial ledgers or alter clinical examination findings without authorized doctor progression.';

mrAdmin.dashboard.approveAccount = 'खाते मंजूर करा';
mrAdmin.dashboard.rejectAccount = 'खाते नाकारा';
mrAdmin.dashboard.licensePlaceholder = 'उदा. VET-MH-2024-8841';
mrAdmin.dashboard.complaintTitlePlaceholder = 'उदा. दूध संकलन फॅट दरामध्ये तफावत';
mrAdmin.dashboard.ecosystemNotice1 = 'या डॅशबोर्डवर आणि अहवाल पृष्ठावर दर्शविलेले सर्व एकत्रित आकडे थेट सक्रिय डेटाबेसमधून मोजले जातात';
mrAdmin.dashboard.ecosystemNotice2 = 'प्रशासकीय नियंत्रण आर्थिक लेजरमध्ये बदल करत नाही किंवा अधिकृत डॉक्टरांशिवाय वैद्यकीय निष्कर्ष बदलत नाही.';

fs.writeFileSync(enAdminPath, JSON.stringify(enAdmin, null, 2) + '\n', 'utf8');
fs.writeFileSync(mrAdminPath, JSON.stringify(mrAdmin, null, 2) + '\n', 'utf8');

// 2. Update dairyOwner.json
const enDairyPath = path.join(localesDir, 'en/dairyOwner.json');
const mrDairyPath = path.join(localesDir, 'mr/dairyOwner.json');
const enDairy = JSON.parse(fs.readFileSync(enDairyPath, 'utf8'));
const mrDairy = JSON.parse(fs.readFileSync(mrDairyPath, 'utf8'));

enDairy.collection.quantityPlaceholder = 'e.g. 12.5';
enDairy.collection.fatPlaceholder = 'e.g. 4.5';
enDairy.collection.ratePlaceholder = 'e.g. 45.00';

mrDairy.collection.quantityPlaceholder = 'उदा. १२.५';
mrDairy.collection.fatPlaceholder = 'उदा. ४.५';
mrDairy.collection.ratePlaceholder = 'उदा. ४५.००';

fs.writeFileSync(enDairyPath, JSON.stringify(enDairy, null, 2) + '\n', 'utf8');
fs.writeFileSync(mrDairyPath, JSON.stringify(mrDairy, null, 2) + '\n', 'utf8');

// 3. Update medicalProvider.json
const enMedPath = path.join(localesDir, 'en/medicalProvider.json');
const mrMedPath = path.join(localesDir, 'mr/medicalProvider.json');
const enMed = JSON.parse(fs.readFileSync(enMedPath, 'utf8'));
const mrMed = JSON.parse(fs.readFileSync(mrMedPath, 'utf8'));

enMed.inventory.pricePlaceholder = 'e.g. 45.00';
enMed.inventory.stockPlaceholder = 'e.g. 100';

mrMed.inventory.pricePlaceholder = 'उदा. ४५.००';
mrMed.inventory.stockPlaceholder = 'उदा. १००';

fs.writeFileSync(enMedPath, JSON.stringify(enMed, null, 2) + '\n', 'utf8');
fs.writeFileSync(mrMedPath, JSON.stringify(mrMed, null, 2) + '\n', 'utf8');

console.log('Locale files successfully updated!');
