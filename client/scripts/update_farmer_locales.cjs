const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'en', 'farmer.json');
const mrPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'mr', 'farmer.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const mr = JSON.parse(fs.readFileSync(mrPath, 'utf8'));

const enExtra = {
  uploadDocument: 'Upload Document',
  analyzeFile: 'Analyze File',
  extractMedicines: 'Extract Medicines',
  requestAvailable: 'Request Available',
  uploadPrescription: 'Upload Veterinary Prescription',
  uploadPrescriptionDesc: "Upload doctor's prescription (JPG, PNG, WEBP, or PDF) to scan for prescribed medicines",
  clickUploadPrompt: 'Click to Upload Prescription Document',
  supportsTypes: 'Supports JPG, PNG, WEBP, PDF (Max 10MB)',
  browseSystemFile: 'Browse System File',
  changeFile: 'Change File',
  analyzingPrescription: 'Analyzing Prescription...',
  analyzeAndFind: 'Analyze Prescription and Find Medicines',
  medicalSafetyNotice: 'Medical Safety Notice',
  medicalSafetyBody: 'Prescription information is processed to help identify available medicines from registered medical providers. Always verify the prescription details with a qualified veterinarian or authorized medical provider before requesting or using any medicine.',
  requestMedicineModalTitle: 'Request Medicine',
  requestMedicineModalSubtitle: 'Submit a purchase request to provider',
  notesInstructions: 'Notes / Instructions (Optional)',
  totalCalculatedAmount: 'Total Calculated Amount:',
  submittingRequest: 'Submitting Request...',
  submitRequestBtn: 'Submit Request',
  medicineName: 'Medicine Requested',
  provider: 'Medical Provider'
};

const mrExtra = {
  uploadDocument: 'दस्तऐवज अपलोड करा',
  analyzeFile: 'फाइल तपासा',
  extractMedicines: 'औषधे शोधा',
  requestAvailable: 'उपलब्ध औषधांची मागणी',
  uploadPrescription: 'पशुवैद्यकीय चिठ्ठी अपलोड करा',
  uploadPrescriptionDesc: 'औषधे शोधण्यासाठी डॉक्टरांची चिठ्ठी (JPG, PNG, WEBP किंवा PDF) अपलोड करा',
  clickUploadPrompt: 'औषध चिठ्ठी अपलोड करण्यासाठी येथे क्लिक करा',
  supportsTypes: 'JPG, PNG, WEBP, PDF चे समर्थन (कमाल १० MB)',
  browseSystemFile: 'फाइल निवडा',
  changeFile: 'फाइल बदला',
  analyzingPrescription: 'चिठ्ठी तपासली जात आहे...',
  analyzeAndFind: 'चिठ्ठी तपासा आणि औषधे शोधा',
  medicalSafetyNotice: 'वैद्यकीय सुरक्षा सूचना',
  medicalSafetyBody: 'नोंदणीकृत औषध विक्रेत्यांकडून उपलब्ध औषधे शोधण्यासाठी ही माहिती वापरली जाते. औषध वापरण्यापूर्वी नेहमी पात्र पशुवैद्यकाचा सल्ला घ्या.',
  requestMedicineModalTitle: 'औषधाची मागणी करा',
  requestMedicineModalSubtitle: 'विक्रेत्याकडे खरेदीची मागणी पाठवा',
  notesInstructions: 'सूचना / टीप (पर्यायी)',
  totalCalculatedAmount: 'एकूण देय रक्कम:',
  submittingRequest: 'मागणी पाठवली जात आहे...',
  submitRequestBtn: 'मागणी पाठवा',
  medicineName: 'मागणी केलेले औषध',
  provider: 'औषध विक्रेता'
};

Object.assign(en.medicines, enExtra);
Object.assign(mr.medicines, mrExtra);

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
fs.writeFileSync(mrPath, JSON.stringify(mr, null, 2) + '\n', 'utf8');
console.log('Successfully updated farmer medicines locales in en and mr.');
