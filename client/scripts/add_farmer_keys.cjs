const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'en', 'farmer.json');
const mrPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'mr', 'farmer.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const mr = JSON.parse(fs.readFileSync(mrPath, 'utf8'));

const enUpdates = {
  medicineRequests: {
    detailsTitle: 'Request Timeline & Details',
    provider: 'Provider',
    providerRemarks: 'Provider Remarks',
    myNotes: 'My Notes',
    timelineTitle: 'Status Timeline',
    timelineRequested: 'Requested',
    timelineAccepted: 'Accepted by Provider',
    timelinePacked: 'Medicine Packed',
    timelineReady: 'Ready for Collection',
    timelineCompleted: 'Completed',
    timelineCancelled: 'Cancelled',
    timelineRejected: 'Rejected'
  },
  cattle: {
    addCattleRecord: 'Add Cattle Record',
    healthy: 'Healthy',
    sick: 'Sick',
    underObservation: 'Under Observation',
    treatmentOngoing: 'Treatment Ongoing',
    cattlePhotoUpload: 'Cattle Photo (Upload from System)',
    updateCattlePhoto: 'Update Cattle Photo (Upload from System)',
    notesMedicalHistory: 'Notes / Medical History',
    notesCharacteristics: 'Notes / Characteristics',
    female: 'Female',
    male: 'Male',
    cattleProfileHistory: 'Cattle Profile & History',
    registeredOwner: 'Registered Owner',
    lastAiHealthCheck: 'Last AI Health Check',
    runHealthScan: 'Run Health Scan'
  },
  milk: {
    startDate: 'Start Date',
    endDate: 'End Date',
    qty: 'Qty',
    fat: 'Fat',
    rate: 'Rate',
    customDateRange: 'Custom Date Range',
    date: 'Date',
    morningShift: 'Morning Shift',
    eveningShift: 'Evening Shift',
    dailyTotalQty: 'Daily Total Qty',
    dailyTotalAmount: 'Daily Total Amount',
    settlementStatus: 'Settlement Status'
  },
  fodder: {
    fodderPhoto: 'Fodder Photo',
    availableFrom: 'Available From',
    viewFullDetailsContact: 'View Full Details & Contact',
    addNewListing: 'Add New Listing',
    fillListingDetails: 'Fill in details to list fodder for neighboring farmers',
    fodderPhotoOptional: 'Fodder Photo (Optional)',
    clickSelectFodderPhoto: 'Click to Select Fodder Photo',
    imageLimit5mb: 'JPG, PNG, WEBP (Max 5MB)',
    listingTitle: 'Listing Title *',
    fodderTypeRequired: 'Fodder Type *',
    specifyCustomType: 'Specify Custom Fodder Type *',
    fodderDescription: 'Fodder Description *',
    priceRequired: 'Price (₹) *',
    quantityRequired: 'Quantity *',
    unitRequired: 'Unit *',
    quintal: 'quintal',
    ton: 'ton',
    bundle: 'bundle',
    acre: 'acre',
    availableDate: 'Available Date *',
    villageArea: 'Village / Area *',
    cityTown: 'City / Town *',
    contactPhone: 'Contact Phone Number',
    savingListing: 'Saving Listing...',
    availableStock: 'Available Stock',
    distance: 'Distance',
    distanceUnavailable: 'Distance unavailable',
    fodderDetailsQuality: 'Fodder Details & Quality:',
    sellerFarmer: 'Seller Farmer',
    callSeller: 'Call Seller'
  },
  cases: {
    dosage: 'Dosage:',
    duration: 'Duration:',
    referralHistory: 'Referral History',
    pendingDoctorResponse: 'Request pending doctor response.'
  }
};

const mrUpdates = {
  medicineRequests: {
    detailsTitle: 'मागणी तपशील आणि टाइमलाइन',
    provider: 'औषध विक्रेता',
    providerRemarks: 'औषध विक्रेत्याच्या टिप्पण्या',
    myNotes: 'माझ्या नोंदी',
    timelineTitle: 'स्थिती टाइमलाइन',
    timelineRequested: 'मागणी नोंदवली',
    timelineAccepted: 'विक्रेत्याने स्वीकारली',
    timelinePacked: 'औषध पॅक केले',
    timelineReady: 'घेऊन जाण्यासाठी तयार',
    timelineCompleted: 'पूर्ण झाले',
    timelineCancelled: 'रद्द केले',
    timelineRejected: 'नाकारले'
  },
  cattle: {
    addCattleRecord: 'जनावर नोंदणी जोडा',
    healthy: 'निरोगी',
    sick: 'आजारी',
    underObservation: 'निरीक्षणाखाली',
    treatmentOngoing: 'उपचार सुरू',
    cattlePhotoUpload: 'जनावराचा फोटो (सिस्टममधून अपलोड करा)',
    updateCattlePhoto: 'जनावराचा फोटो बदला (सिस्टममधून अपलोड करा)',
    notesMedicalHistory: 'नोंदी / वैद्यकीय इतिहास',
    notesCharacteristics: 'नोंदी / वैशिष्ट्ये',
    female: 'मादी',
    male: 'नर',
    cattleProfileHistory: 'जनावराचे प्रोफाइल आणि इतिहास',
    registeredOwner: 'नोंदणीकृत मालक',
    lastAiHealthCheck: 'शेवटची AI आरोग्य तपासणी',
    runHealthScan: 'आरोग्य स्कॅन करा'
  },
  milk: {
    startDate: 'सुरुवात तारीख',
    endDate: 'शेवट तारीख',
    qty: 'प्रमाण',
    fat: 'फॅट',
    rate: 'दर',
    customDateRange: 'सानुकूल तारीख श्रेणी',
    date: 'तारीख',
    morningShift: 'सकाळची फेरी',
    eveningShift: 'संध्याकाळची फेरी',
    dailyTotalQty: 'दैनिक एकूण प्रमाण',
    dailyTotalAmount: 'दैनिक एकूण रक्कम',
    settlementStatus: 'निकाली स्थिती'
  },
  fodder: {
    fodderPhoto: 'चाऱ्याचा फोटो',
    availableFrom: 'पासून उपलब्ध',
    viewFullDetailsContact: 'पूर्ण तपशील आणि संपर्क पहा',
    addNewListing: 'नवीन नोंद जोडा',
    fillListingDetails: 'परिसरातील शेतकऱ्यांसाठी चारा विक्रीची माहिती भरा',
    fodderPhotoOptional: 'चाऱ्याचा फोटो (पर्यायी)',
    clickSelectFodderPhoto: 'चाऱ्याचा फोटो निवडण्यासाठी येथे क्लिक करा',
    imageLimit5mb: 'JPG, PNG, WEBP (कमाल ५ MB)',
    listingTitle: 'शीर्षक *',
    fodderTypeRequired: 'चाऱ्याचा प्रकार *',
    specifyCustomType: 'इतर चाऱ्याचा प्रकार नमूद करा *',
    fodderDescription: 'चाऱ्याचे वर्णन *',
    priceRequired: 'किंमत (₹) *',
    quantityRequired: 'प्रमाण *',
    unitRequired: 'एकक *',
    quintal: 'क्विंटल',
    ton: 'टन',
    bundle: 'पेंढी',
    acre: 'एकर',
    availableDate: 'उपलब्ध तारीख *',
    villageArea: 'गाव / परिसर *',
    cityTown: 'तालुका / शहर *',
    contactPhone: 'संपर्क फोन नंबर',
    savingListing: 'नोंद जतन होत आहे...',
    availableStock: 'उपलब्ध साठा',
    distance: 'अंतर',
    distanceUnavailable: 'अंतर उपलब्ध नाही',
    fodderDetailsQuality: 'चाऱ्याचा तपशील आणि गुणवत्ता:',
    sellerFarmer: 'विक्रेता शेतकरी',
    callSeller: 'विक्रेत्यास कॉल करा'
  },
  cases: {
    dosage: 'मात्रा:',
    duration: 'कालावधी:',
    referralHistory: 'संदर्भ इतिहास',
    pendingDoctorResponse: 'डॉक्टरांच्या प्रतिसादाची प्रतीक्षा आहे.'
  }
};

for (const section of Object.keys(enUpdates)) {
  if (!en[section]) en[section] = {};
  if (!mr[section]) mr[section] = {};
  Object.assign(en[section], enUpdates[section]);
  Object.assign(mr[section], mrUpdates[section]);
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
fs.writeFileSync(mrPath, JSON.stringify(mr, null, 2) + '\n', 'utf8');
console.log('Successfully added farmer updates to en and mr locales.');
