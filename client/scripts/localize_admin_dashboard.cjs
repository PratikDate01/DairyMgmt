const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const adminJsxPath = path.join(__dirname, '..', 'src', 'pages', 'dashboards', 'AdminDashboard.jsx');

function updateJson(filePath, updater) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  updater(data);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// Ensure any missing admin keys are populated in en and mr
const enAdminPath = path.join(localesDir, 'en', 'admin.json');
const mrAdminPath = path.join(localesDir, 'mr', 'admin.json');

const newAdminKeys = {
  recentUsersTitle: 'Recent User Registrations',
  recentUsersSubtitle: 'Latest 5 registered accounts',
  noRecentUsers: 'No recent users found',
  recentVetsTitle: 'Recent Veterinary Requests',
  recentVetsSubtitle: 'Latest clinical escalations & diagnosis requests',
  noRecentVetRequests: 'No recent veterinary requests found',
  yourAccount: 'Your Account',
  noVerificationsFound: 'No Verifications Matching Criteria',
  searchCattlePlaceholder: 'Search tag, breed, notes...',
  searchMedicinePlaceholder: 'Search medicine name...',
  noMedicinesFound: 'No Medicines Found',
  searchFodderPlaceholder: 'Search fodder title, location...',
  noFodderFound: 'No Fodder Listings Found',
  noComplaintsFound: 'No Complaints Found',
  noNotesAdded: 'No notes added',
  medicinesCatalogOversight: 'Medicine Inventory & Catalog Oversight',
  fodderMarketplaceOversight: 'Fodder Marketplace Oversight',
  complaintsResolution: 'Complaints & Grievance Resolution'
};

const newAdminKeysMr = {
  recentUsersTitle: 'अलीकडील वापरकर्ता नोंदण्या',
  recentUsersSubtitle: 'नवीनतम ५ नोंदणीकृत खाती',
  noRecentUsers: 'कोणतेही अलीकडील वापरकर्ते आढळले नाहीत',
  recentVetsTitle: 'अलीकडील पशुवैद्यकीय विनंत्या',
  recentVetsSubtitle: 'नवीनतम वैद्यकीय विनंत्या व निदान नोंदी',
  noRecentVetRequests: 'कोणत्याही अलीकडील पशुवैद्यकीय विनंत्या आढळल्या नाहीत',
  yourAccount: 'आपले खाते',
  noVerificationsFound: 'निकषांशी जुळणाऱ्या पडताळण्या आढळल्या नाहीत',
  searchCattlePlaceholder: 'टॅग, जात, नोंदी शोधा...',
  searchMedicinePlaceholder: 'औषधाचे नाव शोधा...',
  noMedicinesFound: 'कोणतीही औषधे आढळली नाहीत',
  searchFodderPlaceholder: 'चारा शीर्षक, ठिकाण शोधा...',
  noFodderFound: 'कोणत्याही चारा जाहिराती आढळल्या नाहीत',
  noComplaintsFound: 'कोणतीही तक्रार आढळली नाही',
  noNotesAdded: 'कोणतीही नोंद जोडलेली नाही',
  medicinesCatalogOversight: 'औषध साठा आणि सूची निरीक्षण',
  fodderMarketplaceOversight: 'चारा बाजारपेठ निरीक्षण',
  complaintsResolution: 'तक्रार निवारण आणि समर्थन'
};

updateJson(enAdminPath, (d) => {
  d.dashboard = d.dashboard || {};
  for (const [k, v] of Object.entries(newAdminKeys)) {
    d.dashboard[k] = d.dashboard[k] || v;
  }
});

updateJson(mrAdminPath, (d) => {
  d.dashboard = d.dashboard || {};
  for (const [k, v] of Object.entries(newAdminKeysMr)) {
    d.dashboard[k] = v;
  }
});

console.log('Admin locales updated.');

// Now replace in AdminDashboard.jsx
let content = fs.readFileSync(adminJsxPath, 'utf8');

const replacements = [
  // Overview Tab
  ['title="Total Users"', "title={t('admin:dashboard.totalUsersStat', 'Total Users')}"],
  ['title="Farmers"', "title={t('admin:dashboard.farmersStat', 'Farmers')}"],
  ['title="Dairy Owners"', "title={t('admin:dashboard.dairyOwnersStat', 'Dairy Owners')}"],
  ['title="Veterinarians"', "title={t('admin:dashboard.veterinariansStat', 'Veterinarians')}"],
  ['title="Medical Stores"', "title={t('admin:dashboard.medicalStoresStat', 'Medical Stores')}"],
  ['title="Administrators"', "title={t('admin:dashboard.administratorsStat', 'Administrators')}"],
  ['>User & Account Metrics</h3>', ">{t('admin:dashboard.userAccountMetrics', 'User & Account Metrics')}</h3>"],
  ['>Operational Oversight</h3>', ">{t('admin:dashboard.operationalOversight', 'Operational Oversight')}</h3>"],
  ['title="Registered Cattle"', "title={t('admin:dashboard.registeredCattleStat', 'Registered Cattle')}"],
  ['title="Active Vet Requests"', "title={t('admin:dashboard.activeVetRequestsStat', 'Active Vet Requests')}"],
  ['title="Active Medicines"', "title={t('admin:dashboard.activeMedicinesStat', 'Active Medicines')}"],
  ['title="Active Fodder Listings"', "title={t('admin:dashboard.activeFodderListingsStat', 'Active Fodder Listings')}"],
  ['title="Open Complaints"', "title={t('admin:dashboard.openComplaintsStat', 'Open Complaints')}"],
  ['>Cumulative Milk Volume</span>', ">{t('admin:dashboard.cumulativeMilkVolume', 'Cumulative Milk Volume')}</span>"],
  ['>Disbursed Payments</span>', ">{t('admin:dashboard.disbursedPayments', 'Disbursed Payments')}</span>"],
  ['>Outstanding Balances</span>', ">{t('admin:dashboard.outstandingBalances', 'Outstanding Balances')}</span>"],
  ['>Pending Professional Verifications</h4>', ">{t('admin:dashboard.pendingProfessionalVerifications', 'Pending Professional Verifications')}</h4>"],
  ['title="Recent User Registrations"\n              subtitle="Latest 5 registered accounts"', 'title={t(\'admin:dashboard.recentUsersTitle\', \'Recent User Registrations\')}\n              subtitle={t(\'admin:dashboard.recentUsersSubtitle\', \'Latest 5 registered accounts\')}'],
  ['>No recent users found</div>', ">{t('admin:dashboard.noRecentUsers', 'No recent users found')}</div>"],
  ['title="Recent Veterinary Requests"\n              subtitle="Latest clinical escalations & diagnosis requests"', 'title={t(\'admin:dashboard.recentVetsTitle\', \'Recent Veterinary Requests\')}\n              subtitle={t(\'admin:dashboard.recentVetsSubtitle\', \'Latest clinical escalations & diagnosis requests\')}'],
  ['>No recent veterinary requests found</div>', ">{t('admin:dashboard.noRecentVetRequests', 'No recent veterinary requests found')}</div>"],

  // Users Tab
  ['title="System User Directory"\n            subtitle="Inspect user accounts, normalized multi-role profiles, and toggle account activation status"', 'title={t(\'admin:users.title\', \'System User Directory\')}\n            subtitle={t(\'admin:users.subtitle\', \'Inspect user accounts, normalized multi-role profiles, and toggle account activation status\')}'],
  ['<option value="all">All Roles</option>', '<option value="all">{t(\'admin:dashboard.allRoles\', \'All Roles\')}</option>'],
  ['<option value="farmer">Farmer</option>', '<option value="farmer">{t(\'common:roles.farmer\', \'Farmer\')}</option>'],
  ['<option value="dairyOwner">Dairy Owner</option>', '<option value="dairyOwner">{t(\'common:roles.dairyOwner\', \'Dairy Owner\')}</option>'],
  ['<option value="veterinarian">Veterinarian</option>', '<option value="veterinarian">{t(\'common:roles.veterinarian\', \'Veterinarian\')}</option>'],
  ['<option value="medicalProvider">Medical Store</option>', '<option value="medicalProvider">{t(\'common:roles.medicalProvider\', \'Medical Store\')}</option>'],
  ['<option value="admin">Administrator</option>', '<option value="admin">{t(\'admin:dashboard.administrator\', \'Administrator\')}</option>'],
  ['<option value="all">All Statuses</option>', '<option value="all">{t(\'admin:dashboard.allStatuses\', \'All Statuses\')}</option>'],
  ['<option value="active">Active Only</option>', '<option value="active">{t(\'admin:dashboard.activeOnly\', \'Active Only\')}</option>'],
  ['<option value="suspended">Suspended Only</option>', '<option value="suspended">{t(\'admin:dashboard.suspendedOnly\', \'Suspended Only\')}</option>'],
  ['placeholder="Search name, phone, email..."', "placeholder={t('admin:dashboard.searchUserPlaceholder', 'Search name, phone, email...')}"] ,
  ['Loading users directory...\n            </div>', "{t('admin:dashboard.loadingDirectory', 'Loading users directory...')}\n            </div>"],
  ['title="No Users Found"\n              description="No user records matched your current role, status, or search query."', 'title={t(\'admin:dashboard.noUsersTitle\', \'No Users Found\')}\n              description={t(\'admin:dashboard.noUsersDesc\', \'No user records matched your current role, status, or search query.\')}'],
  ['<th className="px-4 py-3">User</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.userCol\', \'User\')}</th>'],
  ['<th className="px-4 py-3">Contact</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.contactCol\', \'Contact\')}</th>'],
  ['<th className="px-4 py-3">Roles</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.rolesCol\', \'Roles\')}</th>'],
  ['<th className="px-4 py-3">Account Status</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.accountStatusCol\', \'Account Status\')}</th>'],
  ['<th className="px-4 py-3">Verification</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.verificationCol\', \'Verification\')}</th>'],
  ['<th className="px-4 py-3">Registered</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.registeredCol\', \'Registered\')}</th>'],
  ['<th className="px-4 py-3 text-right">Actions</th>', '<th className="px-4 py-3 text-right">{t(\'admin:dashboard.actionsCol\', \'Actions\')}</th>'],
  ['(Your Account)', "({t('admin:dashboard.yourAccount', 'Your Account')})"],

  // Verifications Tab
  ['title="Professional Verification Management"\n            subtitle="Review, approve, or reject veterinarians and medical stores with persistent credentials"', 'title={t(\'admin:verifications.title\', \'Professional Verification Management\')}\n            subtitle={t(\'admin:verifications.subtitle\', \'Review, approve, or reject veterinarians and medical stores with persistent credentials\')}'],
  ['<span>Status:</span>', '<span>{t(\'admin:dashboard.statusLabel\', \'Status:\')}</span>'],
  ['<option value="all">All Verification Statuses</option>', '<option value="all">{t(\'admin:dashboard.allVerificationStatuses\', \'All Verification Statuses\')}</option>'],
  ['<option value="pending">Pending Review Only</option>', '<option value="pending">{t(\'admin:dashboard.pendingReviewOnly\', \'Pending Review Only\')}</option>'],
  ['<option value="approved">Approved</option>', '<option value="approved">{t(\'admin:dashboard.approved\', \'Approved\')}</option>'],
  ['<option value="rejected">Rejected</option>', '<option value="rejected">{t(\'admin:dashboard.rejected\', \'Rejected\')}</option>'],
  ['title="No Verifications Matching Criteria"', 'title={t(\'admin:dashboard.noVerificationsFound\', \'No Verifications Matching Criteria\')}'],
  ['<th className="px-4 py-3">Professional / Entity</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.professionalEntity\', \'Professional / Entity\')}</th>'],
  ['<th className="px-4 py-3">Specialization / Clinic</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.specializationClinic\', \'Specialization / Clinic\')}</th>'],
  ['<th className="px-4 py-3">License Number</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.licenseNumber\', \'License Number\')}</th>'],
  ['<th className="px-4 py-3">Admin Notes</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.adminNotes\', \'Admin Notes\')}</th>'],
  ['Not recorded', "{t('admin:dashboard.notRecorded', 'Not recorded')}"],
  ['None', "{t('admin:dashboard.none', 'None')}"],

  // Cattle Tab
  ['title="Platform Cattle Herd Directory"\n            subtitle="System-wide cattle records registered by all connected farmers"', 'title={t(\'admin:cattle.title\', \'Platform Cattle Herd Directory\')}\n            subtitle={t(\'admin:cattle.subtitle\', \'System-wide cattle records registered by all connected farmers\')}'],
  ['<span>Health Status:</span>', '<span>{t(\'admin:dashboard.healthStatusLabel\', \'Health Status:\')}</span>'],
  ['<option value="all">All Health Conditions</option>', '<option value="all">{t(\'admin:dashboard.allHealthConditions\', \'All Health Conditions\')}</option>'],
  ['<option value="healthy">Healthy</option>', '<option value="healthy">{t(\'admin:dashboard.healthy\', \'Healthy\')}</option>'],
  ['<option value="sick">Sick</option>', '<option value="sick">{t(\'admin:dashboard.sick\', \'Sick\')}</option>'],
  ['<option value="under_observation">Under Observation</option>', '<option value="under_observation">{t(\'admin:dashboard.underObservation\', \'Under Observation\')}</option>'],
  ['<option value="vaccinated">Vaccinated</option>', '<option value="vaccinated">{t(\'admin:dashboard.vaccinated\', \'Vaccinated\')}</option>'],
  ['<option value="critical">Critical</option>', '<option value="critical">{t(\'admin:dashboard.critical\', \'Critical\')}</option>'],
  ['placeholder="Search tag, breed, notes..."', "placeholder={t('admin:dashboard.searchCattlePlaceholder', 'Search tag, breed, notes...')}"] ,
  ['title="No Cattle Records Found"', "title={t('admin:cattle.noCattle', 'No Cattle Records Found')}"],
  ['<th className="px-4 py-3">Tag / Identifier</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.tagIdentifier\', \'Tag / Identifier\')}</th>'],
  ['<th className="px-4 py-3">Owner (Farmer)</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.ownerFarmer\', \'Owner (Farmer)\')}</th>'],
  ['<th className="px-4 py-3">Breed & Gender</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.breedGender\', \'Breed & Gender\')}</th>'],
  ['<th className="px-4 py-3">Age</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.age\', \'Age\')}</th>'],
  ['<th className="px-4 py-3">Health Status</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.healthStatusLabel\', \'Health Status\')}</th>'],
  ['<th className="px-4 py-3">Registered Date</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.registeredDate\', \'Registered Date\')}</th>'],

  // Vet Requests Tab
  ['title="Veterinary Requests & Escalations"\n            subtitle="Oversight of disease scans, clinical triage, veterinarian assignments, and escalation history"', 'title={t(\'admin:vetRequests.title\', \'Veterinary Requests & Escalations\')}\n            subtitle={t(\'admin:vetRequests.subtitle\', \'Oversight of disease scans, clinical triage, veterinarian assignments, and escalation history\')}'],
  ['<option value="all">All Clinical Stages</option>', '<option value="all">{t(\'admin:dashboard.allClinicalStages\', \'All Clinical Stages\')}</option>'],
  ['<option value="all">All Risk Levels</option>', '<option value="all">{t(\'admin:dashboard.allRiskLevels\', \'All Risk Levels\')}</option>'],
  ['title="No Veterinary Requests Found"', "title={t('admin:vetRequests.noRequests', 'No Veterinary Requests Found')}"],
  ['<th className="px-4 py-3">Cattle & Farmer</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.cattleFarmer\', \'Cattle & Farmer\')}</th>'],
  ['<th className="px-4 py-3">Assigned Veterinarian</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.assignedVeterinarian\', \'Assigned Veterinarian\')}</th>'],
  ['<th className="px-4 py-3">Risk Level</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.riskLevel\', \'Risk Level\')}</th>'],
  ['<th className="px-4 py-3">Escalations</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.escalations\', \'Escalations\')}</th>'],
  ['<th className="px-4 py-3 text-right">Inspection</th>', '<th className="px-4 py-3 text-right">{t(\'admin:dashboard.inspection\', \'Inspection\')}</th>'],
  ['>Unassigned</span>', ">{t('admin:dashboard.unassigned', 'Unassigned')}</span>"],
  ['>Direct</span>', ">{t('admin:dashboard.direct', 'Direct')}</span>"],
  ['title="View History"', "title={t('admin:dashboard.viewHistory', 'View History')}"],

  // Medicines Tab
  ['title="Medicine Inventory & Catalog Oversight"\n            subtitle="System-wide pharmaceutical catalog registered by verified Medical Stores"', 'title={t(\'admin:dashboard.medicinesCatalogOversight\', \'Medicine Inventory & Catalog Oversight\')}\n            subtitle={t(\'admin:dashboard.medicinesSubtitle\', \'System-wide pharmaceutical catalog registered by verified Medical Stores\')}'],
  ['<span>Category:</span>', '<span>{t(\'admin:dashboard.categoryLabel\', \'Category:\')}</span>'],
  ['<option value="all">All Categories</option>', '<option value="all">{t(\'admin:dashboard.allCategories\', \'All Categories\')}</option>'],
  ['placeholder="Search medicine name..."', "placeholder={t('admin:dashboard.searchMedicinePlaceholder', 'Search medicine name...')}"] ,
  ['title="No Medicines Found"', "title={t('admin:dashboard.noMedicinesFound', 'No Medicines Found')}"],
  ['<th className="px-4 py-3">Medicine</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.medicine\', \'Medicine\')}</th>'],
  ['<th className="px-4 py-3">Category</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.categoryLabel\', \'Category\')}</th>'],
  ['<th className="px-4 py-3">Medical Store</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.medicalStoreCol\', \'Medical Store\')}</th>'],
  ['<th className="px-4 py-3">Unit Price</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.unitPrice\', \'Unit Price\')}</th>'],
  ['<th className="px-4 py-3">Stock Available</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.stockAvailable\', \'Stock Available\')}</th>'],

  // Fodder Tab
  ['title="Fodder Marketplace Oversight"\n            subtitle="Farmer-to-farmer fodder listings with administrative moderation control"', 'title={t(\'admin:dashboard.fodderMarketplaceOversight\', \'Fodder Marketplace Oversight\')}\n            subtitle={t(\'admin:dashboard.fodderSubtitle\', \'Farmer-to-farmer fodder listings with administrative moderation control\')}'],
  ['<option value="active">Active Only</option>', '<option value="active">{t(\'admin:dashboard.activeOnlyListing\', \'Active Only\')}</option>'],
  ['<option value="sold">Sold</option>', '<option value="sold">{t(\'admin:dashboard.soldListing\', \'Sold\')}</option>'],
  ['<option value="inactive">Inactive / Moderated</option>', '<option value="inactive">{t(\'admin:dashboard.inactiveModerated\', \'Inactive / Moderated\')}</option>'],
  ['<option value="expired">Expired</option>', '<option value="expired">{t(\'admin:dashboard.expiredListing\', \'Expired\')}</option>'],
  ['placeholder="Search fodder title, location..."', "placeholder={t('admin:dashboard.searchFodderPlaceholder', 'Search fodder title, location...')}"] ,
  ['title="No Fodder Listings Found"', "title={t('admin:dashboard.noFodderFound', 'No Fodder Listings Found')}"],
  ['<th className="px-4 py-3">Listing Title</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.listingTitle\', \'Listing Title\')}</th>'],
  ['<th className="px-4 py-3">Fodder Type</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.fodderType\', \'Fodder Type\')}</th>'],
  ['<th className="px-4 py-3">Quantity & Price</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.quantityPrice\', \'Quantity & Price\')}</th>'],
  ['<th className="px-4 py-3">Location</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.location\', \'Location\')}</th>'],
  ['<th className="px-4 py-3 text-right">Moderation</th>', '<th className="px-4 py-3 text-right">{t(\'admin:dashboard.moderation\', \'Moderation\')}</th>'],

  // Complaints Tab
  ['title="Complaints & Grievance Resolution"\n            subtitle="User-submitted dispute and support complaints with administrative status resolution"', 'title={t(\'admin:dashboard.complaintsResolution\', \'Complaints & Grievance Resolution\')}\n            subtitle={t(\'admin:dashboard.complaintsSubtitle\', \'User-submitted dispute and support complaints with administrative status resolution\')}'],
  ['<option value="all">All Complaint Statuses</option>', '<option value="all">{t(\'admin:dashboard.allComplaintStatuses\', \'All Complaint Statuses\')}</option>'],
  ['title="No Complaints Found"', "title={t('admin:dashboard.noComplaintsFound', 'No Complaints Found')}"],
  ['<th className="px-4 py-3">Title & Category</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.titleCategory\', \'Title & Category\')}</th>'],
  ['<th className="px-4 py-3">Submitted By</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.submittedBy\', \'Submitted By\')}</th>'],
  ['<th className="px-4 py-3">Admin Resolution Notes</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.adminResolutionNotes\', \'Admin Resolution Notes\')}</th>'],
  ['<th className="px-4 py-3">Submitted At</th>', '<th className="px-4 py-3">{t(\'admin:dashboard.submittedAt\', \'Submitted At\')}</th>'],
  ['>No notes added</span>', ">{t('admin:dashboard.noNotesAdded', 'No notes added')}</span>"],

  // Reports Preview in Admin Dashboard
  ['title="System Administration & Global Reports"\n            subtitle="Real-time financial and operational aggregates across all registered modules"', 'title={t(\'admin:reportsPage.title\', \'System Administration & Global Reports\')}\n            subtitle={t(\'admin:reportsPage.subtitle\', \'Real-time financial and operational aggregates across all registered modules\')}'],
  ['>Full Analytics View</span>', ">{t('admin:dashboard.fullAnalyticsView', 'Full Analytics View')}</span>"],
  ['>Milk Volume Intake</span>', ">{t('admin:dashboard.milkVolumeIntake', 'Milk Volume Intake')}</span>"],
  ['>Disbursed Funds</span>', ">{t('admin:dashboard.disbursedFunds', 'Disbursed Funds')}</span>"],
  ['>Outstanding Balance</span>', ">{t('admin:dashboard.outstandingBalance', 'Outstanding Balance')}</span>"],
  ['>Ecosystem Integrity Notice</h4>', ">{t('admin:dashboard.ecosystemIntegrityNotice', 'Ecosystem Integrity Notice')}</h4>"],

  // Modals
  ['>Target Account</label>', ">{t('admin:dashboard.targetAccount', 'Target Account')}</label>"],
  ['>Verification Decision</label>', ">{t('admin:dashboard.verificationDecision', 'Verification Decision')}</label>"],
  ['>Medical / Veterinary License Number</label>', ">{t('admin:dashboard.medVetLicenseNumber', 'Medical / Veterinary License Number')}</label>"],
  ['>Verification Notes / Justification</label>', ">{t('admin:dashboard.verificationNotesJustification', 'Verification Notes / Justification')}</label>"],
  ['>Complaint Details</h3>', ">{t('admin:dashboard.complaintDetails', 'Complaint Details')}</h3>"],
  ['>Complaint Title</label>', ">{t('admin:dashboard.complaintTitle', 'Complaint Title')}</label>"],
  ['>Description</label>', ">{t('admin:dashboard.description', 'Description')}</label>"],
  ['>Cattle Profile</h3>', ">{t('admin:dashboard.cattleProfile', 'Cattle Profile')}</h3>"],
  ['>Farmer Owner</h4>', ">{t('admin:dashboard.farmerOwner', 'Farmer Owner')}</h4>"],
  ['>Case Notes</h4>', ">{t('admin:dashboard.caseNotes', 'Case Notes')}</h4>"]
];

let replacedCount = 0;
for (const [target, repl] of replacements) {
  if (content.includes(target)) {
    content = content.split(target).join(repl);
    replacedCount++;
  } else {
    // console.warn('Missed target:', target.slice(0, 50));
  }
}

fs.writeFileSync(adminJsxPath, content, 'utf8');
console.log(`AdminDashboard.jsx updated: ${replacedCount}/${replacements.length} replaced.`);
