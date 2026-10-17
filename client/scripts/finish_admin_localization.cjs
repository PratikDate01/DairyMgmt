const fs = require('fs');
const path = require('path');

const adminJsxPath = path.join(__dirname, '..', 'src', 'pages', 'dashboards', 'AdminDashboard.jsx');
let content = fs.readFileSync(adminJsxPath, 'utf8');

const replacements = [
  // SectionCard Titles & Subtitles with multi-line variations
  ['title="System User Directory"\n          subtitle="Inspect user accounts, normalized multi-role profiles, and toggle account activation status"', 'title={t(\'admin:users.title\', \'System User Directory\')}\n          subtitle={t(\'admin:users.subtitle\', \'Inspect user accounts, normalized multi-role profiles, and toggle account activation status\')}'],
  ['title="Professional Verification Management"\n          subtitle="Review, approve, or reject veterinarians and medical stores with persistent credentials"', 'title={t(\'admin:verifications.title\', \'Professional Verification Management\')}\n          subtitle={t(\'admin:verifications.subtitle\', \'Review, approve, or reject veterinarians and medical stores with persistent credentials\')}'],
  ['title="Platform Cattle Herd Directory"\n          subtitle="System-wide cattle records registered by all connected farmers"', 'title={t(\'admin:cattle.title\', \'Platform Cattle Herd Directory\')}\n          subtitle={t(\'admin:cattle.subtitle\', \'System-wide cattle records registered by all connected farmers\')}'],
  ['title="Veterinary Requests & Escalations"\n          subtitle="Oversight of disease scans, clinical triage, veterinarian assignments, and escalation history"', 'title={t(\'admin:vetRequests.title\', \'Veterinary Requests & Escalations\')}\n          subtitle={t(\'admin:vetRequests.subtitle\', \'Oversight of disease scans, clinical triage, veterinarian assignments, and escalation history\')}'],
  ['title="Medicine Inventory & Catalog Oversight"\n          subtitle="System-wide pharmaceutical catalog registered by verified Medical Stores"', 'title={t(\'admin:dashboard.medicinesCatalogOversight\', \'Medicine Inventory & Catalog Oversight\')}\n          subtitle={t(\'admin:dashboard.medicinesSubtitle\', \'System-wide pharmaceutical catalog registered by verified Medical Stores\')}'],
  ['title="Fodder Marketplace Oversight"\n          subtitle="Farmer-to-farmer fodder listings with administrative moderation control"', 'title={t(\'admin:dashboard.fodderMarketplaceOversight\', \'Fodder Marketplace Oversight\')}\n          subtitle={t(\'admin:dashboard.fodderSubtitle\', \'Farmer-to-farmer fodder listings with administrative moderation control\')}'],
  ['title="Complaints & Grievance Resolution"\n          subtitle="User-submitted dispute and support complaints with administrative status resolution"', 'title={t(\'admin:dashboard.complaintsResolution\', \'Complaints & Grievance Resolution\')}\n          subtitle={t(\'admin:dashboard.complaintsSubtitle\', \'User-submitted dispute and support complaints with administrative status resolution\')}'],
  ['title="System Administration & Global Reports"\n          subtitle="Real-time financial and operational aggregates across all registered modules"', 'title={t(\'admin:reportsPage.title\', \'System Administration & Global Reports\')}\n          subtitle={t(\'admin:reportsPage.subtitle\', \'Real-time financial and operational aggregates across all registered modules\')}'],

  // Recent feeds texts
  ['<p className="text-xs text-slate-400 py-4 text-center">No recent users found</p>', '<p className="text-xs text-slate-400 py-4 text-center">{t(\'admin:dashboard.noRecentUsers\', \'No recent users found\')}</p>'],
  ['<p className="text-xs text-slate-400 py-4 text-center">No recent veterinary requests found</p>', '<p className="text-xs text-slate-400 py-4 text-center">{t(\'admin:dashboard.noRecentVetRequests\', \'No recent veterinary requests found\')}</p>'],

  // Section labels & headers
  ['<span className="text-xs font-semibold text-slate-600 flex items-center space-x-1">\n              <Filter className="w-3.5 h-3.5" />\n              <span>Status:</span>', '<span className="text-xs font-semibold text-slate-600 flex items-center space-x-1">\n              <Filter className="w-3.5 h-3.5" />\n              <span>{t(\'admin:dashboard.statusLabel\', \'Status:\')}</span>'],
  ['<span className="text-xs font-semibold text-slate-600 flex items-center space-x-1">\n              <HeartPulse className="w-3.5 h-3.5" />\n              <span>Health Status:</span>', '<span className="text-xs font-semibold text-slate-600 flex items-center space-x-1">\n              <HeartPulse className="w-3.5 h-3.5" />\n              <span>{t(\'admin:dashboard.healthStatusLabel\', \'Health Status:\')}</span>'],
  ['<span className="text-xs font-semibold text-slate-600 flex items-center space-x-1">\n              <Filter className="w-3.5 h-3.5" />\n              <span>Category:</span>', '<span className="text-xs font-semibold text-slate-600 flex items-center space-x-1">\n              <Filter className="w-3.5 h-3.5" />\n              <span>{t(\'admin:dashboard.categoryLabel\', \'Category:\')}</span>'],

  // Clinical stages
  ['<option value="pending">Pending</option>', '<option value="pending">{t(\'status.pending\', \'Pending\')}</option>'],
  ['<option value="accepted">Accepted</option>', '<option value="accepted">{t(\'status.accepted\', \'Accepted\')}</option>'],
  ['<option value="examination">Examination</option>', '<option value="examination">{t(\'status.examination\', \'Examination\')}</option>'],
  ['<option value="diagnosed">Diagnosed</option>', '<option value="diagnosed">{t(\'status.diagnosed\', \'Diagnosed\')}</option>'],
  ['<option value="prescription_created">Prescription Created</option>', '<option value="prescription_created">{t(\'status.prescription_created\', \'Prescription Created\')}</option>'],
  ['<option value="completed">Completed</option>', '<option value="completed">{t(\'status.completed\', \'Completed\')}</option>'],
  ['<option value="cancelled">Cancelled</option>', '<option value="cancelled">{t(\'status.cancelled\', \'Cancelled\')}</option>'],

  // Risk levels
  ['<option value="low">Low</option>', '<option value="low">{t(\'status.low\', \'Low\')}</option>'],
  ['<option value="medium">Medium</option>', '<option value="medium">{t(\'status.medium\', \'Medium\')}</option>'],
  ['<option value="high">High</option>', '<option value="high">{t(\'status.high\', \'High\')}</option>'],

  // Table headers
  ['<th className="px-4 py-3">Status</th>', '<th className="px-4 py-3">{t(\'common:labels.status\', \'Status\')}</th>'],
  ['<th className="px-4 py-3">Date</th>', '<th className="px-4 py-3">{t(\'common:labels.date\', \'Date\')}</th>'],
  ['<th className="px-4 py-3">Farmer</th>', '<th className="px-4 py-3">{t(\'common:roles.farmer\', \'Farmer\')}</th>'],
  ['<span className="text-slate-400 font-normal">View History</span>', '<span className="text-slate-400 font-normal">{t(\'admin:dashboard.viewHistory\', \'View History\')}</span>'],

  // Medicine categories options
  ['<option value="Antibiotic">Antibiotic</option>', '<option value="Antibiotic">{t(\'admin:dashboard.catAntibiotic\', \'Antibiotic\')}</option>'],
  ['<option value="Anti-Inflammatory">Anti-Inflammatory</option>', '<option value="Anti-Inflammatory">{t(\'admin:dashboard.catAntiInflammatory\', \'Anti-Inflammatory\')}</option>'],
  ['<option value="Vaccine">Vaccine</option>', '<option value="Vaccine">{t(\'admin:dashboard.catVaccine\', \'Vaccine\')}</option>'],
  ['<option value="Nutritional Supplement">Nutritional Supplement</option>', '<option value="Nutritional Supplement">{t(\'admin:dashboard.catNutritionalSupplement\', \'Nutritional Supplement\')}</option>'],
  ['<option value="Antiseptic">Antiseptic</option>', '<option value="Antiseptic">{t(\'admin:dashboard.catAntiseptic\', \'Antiseptic\')}</option>'],
  ['<option value="Anthelmintic">Anthelmintic</option>', '<option value="Anthelmintic">{t(\'admin:dashboard.catAnthelmintic\', \'Anthelmintic\')}</option>'],
  ['<option value="Hormone">Hormone</option>', '<option value="Hormone">{t(\'admin:dashboard.catHormone\', \'Hormone\')}</option>'],
  ['<option value="General">General</option>', '<option value="General">{t(\'admin:dashboard.catGeneral\', \'General\')}</option>'],

  // Complaints filter and category options
  ['<option value="open">Open</option>', '<option value="open">{t(\'status.open\', \'Open\')}</option>'],
  ['<option value="in_progress">In Progress</option>', '<option value="in_progress">{t(\'status.in_progress\', \'In Progress\')}</option>'],
  ['<option value="resolved">Resolved</option>', '<option value="resolved">{t(\'status.resolved\', \'Resolved\')}</option>'],
  ['<option value="closed">Closed</option>', '<option value="closed">{t(\'status.closed\', \'Closed\')}</option>'],
  ['<option value="general">General</option>', '<option value="general">{t(\'complaints:categories.general\', \'General\')}</option>'],
  ['<option value="milk_collection">Milk Collection</option>', '<option value="milk_collection">{t(\'complaints:categories.milk_collection\', \'Milk Collection\')}</option>'],
  ['<option value="payments">Payments</option>', '<option value="payments">{t(\'complaints:categories.payments\', \'Payments\')}</option>'],
  ['<option value="veterinary">Veterinary</option>', '<option value="veterinary">{t(\'complaints:categories.veterinary\', \'Veterinary\')}</option>'],
  ['<option value="medicines">Medicines</option>', '<option value="medicines">{t(\'complaints:categories.medicines\', \'Medicines\')}</option>'],
  ['<option value="fodder">Fodder</option>', '<option value="fodder">{t(\'complaints:categories.fodder\', \'Fodder\')}</option>'],
  ['<option value="account">Account</option>', '<option value="account">{t(\'complaints:categories.account\', \'Account\')}</option>'],

  // Modal Placeholders and Headers
  ['placeholder="e.g. VET-MH-2024-8841"', 'placeholder="VET-MH-2024-8841"'],
  ['placeholder="Notes regarding credentials or rejection reason..."', 'placeholder={t(\'admin:verifications.reviewerNotes\', \'Notes regarding credentials or rejection reason...\')}'],
  ['placeholder="Explain actions taken or resolution..."', 'placeholder={t(\'admin:dashboard.adminResolutionNotes\', \'Explain actions taken or resolution...\')}'],
  ['placeholder="e.g. Discrepancy in milk collection fat rate"', 'placeholder="Discrepancy in milk collection fat rate"'],
  ['placeholder="Detailed description of the issue..."', 'placeholder={t(\'admin:dashboard.description\', \'Detailed description of the issue...\')}'],

  // Ecosystem notice
  ['<h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Ecosystem Integrity Notice</h4>', '<h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">{t(\'admin:dashboard.ecosystemIntegrityNotice\', \'Ecosystem Integrity Notice\')}</h4>']
];

let replaced = 0;
for (const [target, repl] of replacements) {
  if (content.includes(target)) {
    content = content.split(target).join(repl);
    replaced++;
  }
}

fs.writeFileSync(adminJsxPath, content, 'utf8');
console.log(`Replaced ${replaced}/${replacements.length} items in AdminDashboard.jsx`);
