const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'en', 'farmer.json');
const mrPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'mr', 'farmer.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const mr = JSON.parse(fs.readFileSync(mrPath, 'utf8'));

const enModal = {
  title: 'Veterinary Clinical Case Record',
  cattleTag: 'Cattle Tag:',
  assignedDoctor: 'Assigned Doctor:',
  stepperAccepted: 'Accepted',
  stepperExam: 'Exam',
  stepperDiagnosis: 'Diagnosis',
  stepperRx: 'Prescription',
  stepperComplete: 'Complete',
  tabFindings: 'Doctor Diagnosis & Findings',
  tabPrescription: 'Prescription & Medicines',
  tabTimeline: 'Clinical Progression Audit History',
  procureMedicinesBtn: 'Procure Prescribed Medicines',
  noPrescriptionIssued: 'No Prescription Issued Yet',
  prescriptionPendingDoctor: 'Prescribed medications will appear here once Dr. {{name}} completes clinical evaluation.',
  instructions: 'Instructions:',
  referralHistory: 'Referral History',
  pendingDoctorResponse: 'Request pending doctor response.',
  reassignedFrom: 'Reassigned from Dr. {{name}} ({{reason}})'
};

const mrModal = {
  title: 'पशुवैद्यकीय वैद्यकीय केस नोंद',
  cattleTag: 'जनावराचा टॅग:',
  assignedDoctor: 'नियुक्त डॉक्टर:',
  stepperAccepted: 'स्वीकारले',
  stepperExam: 'तपासणी',
  stepperDiagnosis: 'निदान',
  stepperRx: 'औषध चिठ्ठी',
  stepperComplete: 'पूर्ण',
  tabFindings: 'डॉक्टरांचे निदान व निष्कर्ष',
  tabPrescription: 'औषध चिठ्ठी आणि औषधे',
  tabTimeline: 'वैद्यकीय प्रगती तपासणी इतिहास',
  procureMedicinesBtn: 'विहित औषधांची खरेदी करा',
  noPrescriptionIssued: 'अद्याप कोणतीही औषध चिठ्ठी जारी केलेली नाही',
  prescriptionPendingDoctor: 'डॉ. {{name}} यांनी वैद्यकीय मूल्यांकन पूर्ण केल्यावर विहित औषधे येथे दिसतील.',
  instructions: 'सूचना:',
  referralHistory: 'संदर्भ इतिहास',
  pendingDoctorResponse: 'डॉक्टरांच्या प्रतिसादाची प्रतीक्षा आहे.',
  reassignedFrom: 'डॉ. {{name}} यांच्याकडून पुनर्नियुक्त ({{reason}})'
};

if (!en.caseDetailsModal) en.caseDetailsModal = {};
if (!mr.caseDetailsModal) mr.caseDetailsModal = {};

Object.assign(en.caseDetailsModal, enModal);
Object.assign(mr.caseDetailsModal, mrModal);

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
fs.writeFileSync(mrPath, JSON.stringify(mr, null, 2) + '\n', 'utf8');
console.log('Successfully updated caseDetailsModal in farmer locales.');
