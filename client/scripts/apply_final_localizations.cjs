const fs = require('fs');
const path = require('path');

// 1. MilkCollection.jsx
const milkCollectionPath = path.join(__dirname, '../src/pages/dairy/MilkCollection.jsx');
let milkContent = fs.readFileSync(milkCollectionPath, 'utf8');

milkContent = milkContent.replace(
  'placeholder="e.g. 12.5"',
  "placeholder={t('dairyOwner:collection.quantityPlaceholder', 'e.g. 12.5')}"
);
milkContent = milkContent.replace(
  'placeholder="e.g. 4.5"',
  "placeholder={t('dairyOwner:collection.fatPlaceholder', 'e.g. 4.5')}"
);
milkContent = milkContent.replace(
  'placeholder="e.g. 45.00"',
  "placeholder={t('dairyOwner:collection.ratePlaceholder', 'e.g. 45.00')}"
);
fs.writeFileSync(milkCollectionPath, milkContent, 'utf8');
console.log('MilkCollection.jsx updated');

// 2. Inventory.jsx
const inventoryPath = path.join(__dirname, '../src/pages/medical/Inventory.jsx');
let invContent = fs.readFileSync(inventoryPath, 'utf8');

invContent = invContent.replace(
  'placeholder="e.g. 45.00"',
  "placeholder={t('medicalProvider:inventory.pricePlaceholder', 'e.g. 45.00')}"
);
invContent = invContent.replace(
  'placeholder="e.g. 100"',
  "placeholder={t('medicalProvider:inventory.stockPlaceholder', 'e.g. 100')}"
);
invContent = invContent.replace(
  '>\n                                Out of Stock\n                              <',
  ">{t('medicalProvider:inventory.outOfStock', 'Out of Stock')}<"
);
invContent = invContent.replace(
  '>\n                                Low Stock\n                              <',
  ">{t('medicalProvider:inventory.lowStockWarning', 'Low Stock')}<"
);
fs.writeFileSync(inventoryPath, invContent, 'utf8');
console.log('Inventory.jsx updated');

// 3. AdminDashboard.jsx
const adminPath = path.join(__dirname, '../src/pages/dashboards/AdminDashboard.jsx');
let adminContent = fs.readFileSync(adminPath, 'utf8');

// Replace No recent users found
adminContent = adminContent.replace(
  '<p className="text-xs text-slate-400 py-3 text-center">No recent users found</p>',
  "<p className=" + '"text-xs text-slate-400 py-3 text-center">' + "{t('admin:dashboard.noRecentUsers', 'No recent users found')}</p>"
);

// Replace View All
adminContent = adminContent.replace(
  'View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />',
  "{t('common:actions.viewAll', 'View All')} <ChevronRight className=\"w-3.5 h-3.5 ml-0.5\" />"
);

// Replace No recent vet requests
adminContent = adminContent.replace(
  '<p className="text-xs text-slate-400 py-3 text-center">No recent veterinary requests found</p>',
  "<p className=" + '"text-xs text-slate-400 py-3 text-center">' + "{t('admin:dashboard.noRecentVetRequests', 'No recent veterinary requests found')}</p>"
);

// Replace Medical Stores tab
adminContent = adminContent.replace(
  '>\n                Medical Stores\n              </button>',
  ">\n                {t('admin:dashboard.medicalStores', 'Medical Stores')}\n              </button>"
);

// Replace Status:
adminContent = adminContent.replace(
  '<span className="text-xs text-slate-500 font-medium">Status:</span>\n              <select\n                value={verificationStatusFilter}',
  '<span className="text-xs text-slate-500 font-medium">{t(\'admin:dashboard.statusLabel\', \'Status:\')}</span>\n              <select\n                value={verificationStatusFilter}'
);

// Replace Approve / Reject in verifications
adminContent = adminContent.replace(
  '>\n                            Approve\n                          </button>',
  ">\n                            {t('common:actions.approve', 'Approve')}\n                          </button>"
);
adminContent = adminContent.replace(
  '>\n                            Reject\n                          </button>',
  ">\n                            {t('common:actions.reject', 'Reject')}\n                          </button>"
);

// Replace Health Status:
adminContent = adminContent.replace(
  '<span className="text-xs text-slate-500 font-medium">Health Status:</span>',
  '<span className="text-xs text-slate-500 font-medium">{t(\'admin:dashboard.healthStatusLabel\', \'Health Status:\')}</span>'
);

// Replace View History
adminContent = adminContent.replace(
  '<span>View History</span>',
  "<span>{t('admin:dashboard.viewHistory', 'View History')}</span>"
);

// Replace Category:
adminContent = adminContent.replace(
  '<span className="text-xs text-slate-500 font-medium">Category:</span>',
  '<span className="text-xs text-slate-500 font-medium">{t(\'admin:dashboard.categoryLabel\', \'Category:\')}</span>'
);

// Replace Medicine categories in select
adminContent = adminContent.replace(
  '<option value="antibiotic">Antibiotic</option>',
  '<option value="antibiotic">{t(\'admin:dashboard.catAntibiotic\', \'Antibiotic\')}</option>'
);
adminContent = adminContent.replace(
  '<option value="anti_inflammatory">Anti-Inflammatory</option>',
  '<option value="anti_inflammatory">{t(\'admin:dashboard.catAntiInflammatory\', \'Anti-Inflammatory\')}</option>'
);
adminContent = adminContent.replace(
  '<option value="vaccine">Vaccine</option>',
  '<option value="vaccine">{t(\'admin:dashboard.catVaccine\', \'Vaccine\')}</option>'
);
adminContent = adminContent.replace(
  '<option value="nutritional_supplement">Nutritional Supplement</option>',
  '<option value="nutritional_supplement">{t(\'admin:dashboard.catNutritionalSupplement\', \'Nutritional Supplement\')}</option>'
);
adminContent = adminContent.replace(
  '<option value="antiseptic">Antiseptic</option>',
  '<option value="antiseptic">{t(\'admin:dashboard.catAntiseptic\', \'Antiseptic\')}</option>'
);
adminContent = adminContent.replace(
  '<option value="anthelmintic">Anthelmintic</option>',
  '<option value="anthelmintic">{t(\'admin:dashboard.catAnthelmintic\', \'Anthelmintic\')}</option>'
);
adminContent = adminContent.replace(
  '<option value="hormone">Hormone</option>',
  '<option value="hormone">{t(\'admin:dashboard.catHormone\', \'Hormone\')}</option>'
);

// Replace Status: in fodder
adminContent = adminContent.replace(
  '<span className="text-xs text-slate-500 font-medium">Status:</span>\n              <select\n                value={fodderStatusFilter}',
  '<span className="text-xs text-slate-500 font-medium">{t(\'admin:dashboard.statusLabel\', \'Status:\')}</span>\n              <select\n                value={fodderStatusFilter}'
);

// Replace Ecosystem Integrity Notice
const ecosystemTarget = `<div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-slate-800">Ecosystem Integrity Notice</div>
              <p>
                All reporting aggregations displayed in this dashboard and the dedicated reports page are computed dynamically from active MongoDB collections (<span className="font-mono">users</span>, <span className="font-mono">cattle</span>, <span className="font-mono">vetrequests</span>, <span className="font-mono">milkcollections</span>, <span className="font-mono">payments</span>, <span className="font-mono">complaints</span>).
              </p>
              <p>
                Admin oversight does not duplicate financial ledgers or alter clinical examination findings without authorized doctor progression.
              </p>
            </div>`;

const ecosystemReplacement = `<div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-slate-800">{t('admin:dashboard.ecosystemIntegrityNotice', 'Ecosystem Integrity Notice')}</div>
              <p>
                {t('admin:dashboard.ecosystemNotice1', 'All reporting aggregations displayed in this dashboard and the dedicated reports page are computed dynamically from active MongoDB collections')} (<span className="font-mono">users</span>, <span className="font-mono">cattle</span>, <span className="font-mono">vetrequests</span>, <span className="font-mono">milkcollections</span>, <span className="font-mono">payments</span>, <span className="font-mono">complaints</span>).
              </p>
              <p>
                {t('admin:dashboard.ecosystemNotice2', 'Admin oversight does not duplicate financial ledgers or alter clinical examination findings without authorized doctor progression.')}
              </p>
            </div>`;

if (adminContent.includes(ecosystemTarget)) {
  adminContent = adminContent.replace(ecosystemTarget, ecosystemReplacement);
} else {
  console.log('Ecosystem block not exact match, using line replacements');
  adminContent = adminContent.replace(
    '<div className="font-semibold text-slate-800">Ecosystem Integrity Notice</div>',
    '<div className="font-semibold text-slate-800">{t(\'admin:dashboard.ecosystemIntegrityNotice\', \'Ecosystem Integrity Notice\')}</div>'
  );
}

// Replace Approve / Reject Account in verification modal
adminContent = adminContent.replace(
  '>\n                    Approve Account\n                  </button>',
  ">\n                    {t('admin:dashboard.approveAccount', 'Approve Account')}\n                  </button>"
);
adminContent = adminContent.replace(
  '>\n                    Reject Account\n                  </button>',
  ">\n                    {t('admin:dashboard.rejectAccount', 'Reject Account')}\n                  </button>"
);

// Replace license placeholder
adminContent = adminContent.replace(
  'placeholder="VET-MH-2024-8841"',
  "placeholder={t('admin:dashboard.licensePlaceholder', 'e.g. VET-MH-2024-8841')}"
);

// Replace Complaint Details
adminContent = adminContent.replace(
  '<label className="block text-slate-500 font-semibold mb-1">Complaint Details</label>',
  '<label className="block text-slate-500 font-semibold mb-1">{t(\'admin:dashboard.complaintDetails\', \'Complaint Details\')}</label>'
);

// Replace Status in complaint modal
adminContent = adminContent.replace(
  '<label className="block text-slate-500 font-semibold mb-1">Status</label>\n                <select\n                  value={complaintModal.status}',
  '<label className="block text-slate-500 font-semibold mb-1">{t(\'common:labels.status\', \'Status\')}</label>\n                <select\n                  value={complaintModal.status}'
);

// Replace Admin Resolution Notes
adminContent = adminContent.replace(
  '<label className="block text-slate-500 font-semibold mb-1">Admin Resolution Notes</label>',
  '<label className="block text-slate-500 font-semibold mb-1">{t(\'admin:dashboard.adminResolutionNotes\', \'Admin Resolution Notes\')}</label>'
);

// Replace placeholder in new complaint
adminContent = adminContent.replace(
  'placeholder="Discrepancy in milk collection fat rate"',
  "placeholder={t('admin:dashboard.complaintTitlePlaceholder', 'e.g. Discrepancy in milk collection fat rate')}"
);

// Replace Category in new complaint
adminContent = adminContent.replace(
  '<label className="block text-slate-500 font-semibold mb-1">Category</label>\n                <select\n                  value={newComplaintModal.category}',
  '<label className="block text-slate-500 font-semibold mb-1">{t(\'common:labels.category\', \'Category\')}</label>\n                <select\n                  value={newComplaintModal.category}'
);

// Replace Cattle Profile
adminContent = adminContent.replace(
  '<span className="text-slate-400 uppercase text-[10px] font-bold block">Cattle Profile</span>',
  '<span className="text-slate-400 uppercase text-[10px] font-bold block">{t(\'admin:dashboard.cattleProfile\', \'Cattle Profile\')}</span>'
);

// Replace Farmer Owner
adminContent = adminContent.replace(
  '<span className="text-slate-400 uppercase text-[10px] font-bold block">Farmer Owner</span>',
  '<span className="text-slate-400 uppercase text-[10px] font-bold block">{t(\'admin:dashboard.farmerOwner\', \'Farmer Owner\')}</span>'
);

// Replace Clinical Status & Risk
adminContent = adminContent.replace(
  '<span className="text-slate-500 font-semibold block mb-1">Clinical Status & Risk</span>',
  '<span className="text-slate-500 font-semibold block mb-1">{t(\'admin:dashboard.clinicalStatusRisk\', \'Clinical Status & Risk\')}</span>'
);

// Replace Case Notes
adminContent = adminContent.replace(
  '<span className="text-slate-500 font-semibold block mb-1">Case Notes</span>',
  '<span className="text-slate-500 font-semibold block mb-1">{t(\'admin:dashboard.caseNotes\', \'Case Notes\')}</span>'
);

// Replace Escalation & Referral Timeline
adminContent = adminContent.replace(
  '<span className="text-slate-500 font-semibold block mb-2">Escalation & Referral Timeline</span>',
  '<span className="text-slate-500 font-semibold block mb-2">{t(\'admin:dashboard.escalationReferralTimeline\', \'Escalation & Referral Timeline\')}</span>'
);

fs.writeFileSync(adminPath, adminContent, 'utf8');
console.log('AdminDashboard.jsx updated');
