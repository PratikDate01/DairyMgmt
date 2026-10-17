const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function batchReplace(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  let count = 0;
  for (const [target, replacement] of replacements) {
    if (content.includes(target)) {
      content = content.split(target).join(replacement);
      count++;
    } else {
      console.warn(`[WARN] Target not found in ${path.basename(filePath)}:\n${target.slice(0, 60)}...`);
    }
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${path.basename(filePath)} (${count}/${replacements.length} replaced)`);
}

// 1. MyCattle.jsx
batchReplace(path.join(srcDir, 'pages', 'farmer', 'MyCattle.jsx'), [
  ['placeholder="Vaccination details, mark, or notes..."', "placeholder={t('farmer:cattle.notesPlaceholder', 'Vaccination details, mark, or notes...')}"]
]);

// 2. FarmerVetRequests.jsx
batchReplace(path.join(srcDir, 'pages', 'farmer', 'FarmerVetRequests.jsx'), [
  ['title="Trigger manual escalation to next available veterinarian"', "title={t('farmer:vetRequests.manualEscalateTooltip', 'Trigger manual escalation to next available veterinarian')}"]
]);

// 3. AIDiseaseScanner.jsx
batchReplace(path.join(srcDir, 'pages', 'farmer', 'AIDiseaseScanner.jsx'), [
  ['<span className="text-xs uppercase tracking-wider text-blue-300 font-bold block">Gauseva HealthTech</span>', '<span className="text-xs uppercase tracking-wider text-blue-300 font-bold block">{t(\'farmer:aiScanner.healthTechBrand\', \'Gauseva HealthTech\')}</span>']
]);

// 4. admin/Reports.jsx
batchReplace(path.join(srcDir, 'pages', 'admin', 'Reports.jsx'), [
  ['title="Gross Settlement Volume"', "title={t('admin:reportsPage.grossSettlementVolume', 'Gross Settlement Volume')}"],
  ['badgeText="Total Paid Out"', "badgeText={t('dairyOwner:payments.totalPaid', 'Total Paid Out')}"],
  ["badgeText={metrics.payments.totalOutstanding > 0 ? 'Pending System Settlement' : 'Clear System Balance'}", "badgeText={metrics.payments.totalOutstanding > 0 ? t('dairyOwner:reports.pendingSystemSettlement', 'Pending System Settlement') : t('dairyOwner:reports.clearSystemBalance', 'Clear System Balance')}"]
]);

// 5. CaseDetailModal.jsx
batchReplace(path.join(srcDir, 'pages', 'veterinarian', 'CaseDetailModal.jsx'), [
  ['placeholder="Enter professional clinical observations, diagnosis verification, or notes for the farmer..."', "placeholder={t('veterinarian:caseDetail.clinicalNotesPlaceholder', 'Enter professional clinical observations, diagnosis verification, or notes for the farmer...')}"] ,
  ['placeholder="Specify recommended treatment, prescribed medicine, or hygiene protocol..."', "placeholder={t('veterinarian:caseDetail.treatmentPlaceholder', 'Specify recommended treatment, prescribed medicine, or hygiene protocol...')}"]
]);

// 6. ConnectedFarmers.jsx
batchReplace(path.join(srcDir, 'pages', 'dairy', 'ConnectedFarmers.jsx'), [
  ['title="Disconnect Relationship"', "title={t('dairyOwner:farmers.disconnectTooltip', 'Disconnect Relationship')}"],
  ['<SectionCard title="Past Connections History" subtitle="Rejected or disconnected relationship logs">', '<SectionCard title={t(\'dairyOwner:farmers.pastConnectionsTitle\', \'Past Connections History\')} subtitle={t(\'dairyOwner:farmers.pastConnectionsSubtitle\', \'Past rejected or disconnected connection logs\')}>']
]);

// 7. farmer/MilkCollections.jsx
batchReplace(path.join(srcDir, 'pages', 'farmer', 'MilkCollections.jsx'), [
  ['title="Refresh Collections"', "title={t('farmer:milkCollections.refreshTooltip', 'Refresh Collections')}"],
  ['title="No Summary Available"', "title={t('farmer:milkCollections.noSummaryAvailable', 'No Summary Available')}"],
  ['description="Could not generate 10-day summary for the selected period."', "description={t('farmer:milkCollections.noSummaryDesc', 'Could not generate 10-day summary for the selected period.')}"],
  ['title="No Collections Recorded in Period"', "title={t('farmer:milkCollections.noCollectionsInPeriod', 'No Collections Recorded in Period')}"],
  ['description="No morning or evening milk records exist in the selected 10-day period."', "description={t('farmer:milkCollections.noCollectionsInPeriodDesc', 'No morning or evening milk records exist in the selected 10-day period.')}"],
  ['Daily Shift Entries ({summaryData.dailyRecords?.length} Days)', "{t('farmer:milkCollections.dailyShiftEntries', { count: summaryData.dailyRecords?.length, defaultValue: `Daily Shift Entries (${summaryData.dailyRecords?.length} Days)` })}"]
]);

// 8. medical/MedicineRequests.jsx
batchReplace(path.join(srcDir, 'pages', 'medical', 'MedicineRequests.jsx'), [
  ['placeholder="Search medicine or farmer..."', "placeholder={t('medicalProvider:requests.searchPlaceholder', 'Search medicine or farmer...')}"] ,
  ['<p className="text-base font-semibold text-slate-700">No requests found</p>', '<p className="text-base font-semibold text-slate-700">{t(\'medicalProvider:requests.noRequestsFound\', \'No requests found\')}</p>'],
  ['placeholder="e.g. Out of stock, expired batch..."', "placeholder={t('medicalProvider:requests.rejectPlaceholder', 'e.g. Out of stock, expired batch...')}"] ,
  ['placeholder="e.g. Customer requested cancellation..."', "placeholder={t('medicalProvider:requests.cancelPlaceholder', 'e.g. Customer requested cancellation...')}"] ,
  ['className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition shadow-sm"\n            >\n              Apply Filter\n            </button>', 'className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition shadow-sm"\n            >\n              {t(\'common:actions.applyFilter\', \'Apply Filter\')}\n            </button>'],
  ['className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition"\n            >\n              Reset\n            </button>', 'className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition"\n            >\n              {t(\'common:actions.reset\', \'Reset\')}\n            </button>'],
  ['className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium"\n              >\n                Cancel\n              </button>', 'className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium"\n              >\n                {t(\'common:actions.cancel\', \'Cancel\')}\n              </button>'],
  ['className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium"\n              >\n                Close\n              </button>', 'className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium"\n              >\n                {t(\'common:actions.close\', \'Close\')}\n              </button>'],
  ["{actionLoading ? 'Rejecting...' : 'Reject Request'}", "{actionLoading ? t('common:status.loading', 'Rejecting...') : t('medicalProvider:requests.rejectRequest', 'Reject Request')}"]
]);

// 9. farmer/Medicines.jsx
batchReplace(path.join(srcDir, 'pages', 'farmer', 'Medicines.jsx'), [
  ['title="Prescription Identified Medicines"', "title={t('farmer:medicines.prescriptionIdentifiedTitle', 'Prescription Identified Medicines')}"],
  ['<p className="text-xs text-slate-500 py-4 text-center">No medicine names could be identified from this prescription document.</p>', '<p className="text-xs text-slate-500 py-4 text-center">{t(\'farmer:medicines.noIdentifiedMedicines\', \'No medicine names could be identified from this prescription document.\')}</p>'],
  ['<CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Available', '<CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> {t(\'status.available\', \'Available\')}'],
  ['<XCircle className="w-3 h-3 mr-1 text-amber-600" /> Not Currently Available', '<XCircle className="w-3 h-3 mr-1 text-amber-600" /> {t(\'status.unavailable\', \'Not Currently Available\')}'],
  ['title="Matching Available Medicines Catalog"', "title={t('farmer:medicines.matchingCatalogTitle', 'Matching Available Medicines Catalog')}"],
  ['title="No Matching Medicines Available"', "title={t('farmer:medicines.noMatchingMedicines', 'No Matching Medicines Available')}"],
  ['description="Prescribed medicines are not currently in stock from registered medical providers. You can try again later or check with a local veterinary clinic."', "description={t('farmer:medicines.noMatchingMedicinesDesc', 'Prescribed medicines are not currently in stock from registered medical providers. You can try again later or check with a local veterinary clinic.')}"],
  ['placeholder="e.g. Need urgent pickup by morning..."', "placeholder={t('farmer:medicines.notesPlaceholder', 'e.g. Need urgent pickup by morning...')}"]
]);

// 10. farmer/FodderMarketplace.jsx
batchReplace(path.join(srcDir, 'pages', 'farmer', 'FodderMarketplace.jsx'), [
  ['title="Delete Listing"', "title={t('common:actions.delete', 'Delete Listing')}"],
  ['placeholder="e.g. Fresh Green Maize Fodder"', "placeholder={t('farmer:fodder.titlePlaceholder', 'e.g. Fresh Green Maize Fodder')}"],
  ['placeholder="e.g. Organic Mustard Straw"', "placeholder={t('farmer:fodder.customTypePlaceholder', 'e.g. Organic Mustard Straw')}"],
  ['placeholder="Describe quality, moisture content, feeding suitability for cows/buffaloes..."', "placeholder={t('farmer:fodder.descriptionPlaceholder', 'Describe quality, moisture content, feeding suitability for cows/buffaloes...')}"] ,
  ['placeholder="e.g. Rampur Village"', "placeholder={t('farmer:fodder.villagePlaceholder', 'e.g. Rampur Village')}"],
  ['placeholder="e.g. Anand"', "placeholder={t('farmer:fodder.cityPlaceholder', 'e.g. Anand')}"],
  ['placeholder="e.g. +91 9876543210"', "placeholder={t('farmer:fodder.phonePlaceholder', 'e.g. +91 9876543210')}"]
]);

// 11. dairy/Reports.jsx
batchReplace(path.join(srcDir, 'pages', 'dairy', 'Reports.jsx'), [
  ['title="Total Disbursed Paid"', "title={t('dairyOwner:reports.totalDisbursedPaid', 'Total Disbursed Paid')}"],
  ['title="Pending Outstanding"', "title={t('dairyOwner:reports.pendingOutstanding', 'Pending Outstanding')}"],
  ["badgeText={paymentSummary.totalOutstandingAmount > 0 ? 'Unsettled Balance' : 'Clear Ledger'}", "badgeText={paymentSummary.totalOutstandingAmount > 0 ? t('dairyOwner:reports.unsettledBalance', 'Unsettled Balance') : t('dairyOwner:reports.clearLedger', 'Clear Ledger')}"],
  ['<SectionCard title="Milk Collection Performance Summary" subtitle="Key metrics on volume, fat content, and rate averages">', '<SectionCard title={t(\'dairyOwner:reports.milkPerformanceTitle\', \'Milk Collection Performance Summary\')} subtitle={t(\'dairyOwner:reports.milkPerformanceSubtitle\', \'Key metrics on volume, fat content, and rate averages\')}>'],
  ['title="Connected Farmer Performance Summary"\n        subtitle="Individual supplier contributions, valuation, payments, and outstanding balances"', 'title={t(\'dairyOwner:reports.farmerPerformanceTitle\', \'Connected Farmer Performance Summary\')}\n        subtitle={t(\'dairyOwner:reports.farmerPerformanceSubtitle\', \'Individual supplier contributions, valuation, payments, and outstanding balances\')}'],
  ['title="No Farmer Activity Found"\n            description="No active connected farmers have recorded collection history in this system."', 'title={t(\'dairyOwner:reports.noFarmerActivity\', \'No Farmer Activity Found\')}\n            description={t(\'dairyOwner:reports.noFarmerActivityDesc\', \'No active connected farmers have recorded collection history in this system.\')}'],
  ['<SectionCard title="Date-Wise Milk Collection History" subtitle="Aggregated daily collection metrics">', '<SectionCard title={t(\'dairyOwner:reports.dateWiseMilkTitle\', \'Date-Wise Milk Collection History\')} subtitle={t(\'dairyOwner:reports.dateWiseMilkSubtitle\', \'Aggregated daily collection metrics\')}>'],
  ['<EmptyState title="No Daily Collection Data" description="No collection logs found for selected period."', '<EmptyState title={t(\'dairyOwner:reports.noDailyCollection\', \'No Daily Collection Data\')} description={t(\'dairyOwner:reports.noDailyCollectionDesc\', \'No collection logs found for selected period.\')}'],
  ['<SectionCard title="Date-Wise Payment Settlement History" subtitle="Daily aggregated payment disbursements and remaining balances">', '<SectionCard title={t(\'dairyOwner:reports.dateWisePaymentTitle\', \'Date-Wise Payment Settlement History\')} subtitle={t(\'dairyOwner:reports.dateWisePaymentSubtitle\', \'Daily aggregated payment disbursements and remaining balances\')}>'],
  ['<EmptyState title="No Settlement Statements" description="No payment settlements found for selected period."', '<EmptyState title={t(\'dairyOwner:reports.noSettlementStatements\', \'No Settlement Statements\')} description={t(\'dairyOwner:reports.noSettlementStatementsDesc\', \'No payment settlements found for selected period.\')}']
]);

// 12. ClinicalWorkspaceModal.jsx
batchReplace(path.join(srcDir, 'components', 'veterinarian', 'ClinicalWorkspaceModal.jsx'), [
  ['placeholder="e.g. 102.5 °F (Normal is ~101.5 °F)"', "placeholder={t('veterinarian:clinicalWorkspace.tempPlaceholder', 'e.g. 102.5 °F (Normal is ~101.5 °F)')}"],
  ['placeholder="Record visible physical signs e.g., skin lesions, udder swelling, nasal discharge, fever, lameness..."', "placeholder={t('veterinarian:clinicalWorkspace.physicalSymptomsPlaceholder', 'Record visible physical signs e.g., skin lesions, udder swelling, nasal discharge, fever, lameness...')}"] ,
  ['placeholder="Detail overall health condition, hydration status, rumination activity, behavior..."', "placeholder={t('veterinarian:clinicalWorkspace.observationsPlaceholder', 'Detail overall health condition, hydration status, rumination activity, behavior...')}"] ,
  ['placeholder="Any other relevant details or history provided by the farmer..."', "placeholder={t('veterinarian:clinicalWorkspace.additionalNotesPlaceholder', 'Any other relevant details or history provided by the farmer...')}"] ,
  ['placeholder="e.g. Acute Mastitis (Left Hind Quarter), Lumpy Skin Disease, Foot & Mouth Disease..."', "placeholder={t('veterinarian:clinicalWorkspace.diagnosisPlaceholder', 'e.g. Acute Mastitis (Left Hind Quarter), Lumpy Skin Disease, Foot & Mouth Disease...')}"] ,
  ['placeholder="Explain why this diagnosis was reached, pathological observations, laboratory findings..."', "placeholder={t('veterinarian:clinicalWorkspace.diagnosisNotesPlaceholder', 'Explain why this diagnosis was reached, pathological observations, laboratory findings...')}"] ,
  ['placeholder="Outline clinical treatment protocol, injection procedures, isolation requirements..."', "placeholder={t('veterinarian:clinicalWorkspace.treatmentAdvicePlaceholder', 'Outline clinical treatment protocol, injection procedures, isolation requirements...')}"] ,
  ['placeholder="Sanitation advice, milking hygiene, calf segregation, diet adjustments..."', "placeholder={t('veterinarian:clinicalWorkspace.careAdvicePlaceholder', 'Sanitation advice, milking hygiene, calf segregation, diet adjustments...')}"] ,
  ['placeholder="Detail instructions e.g. apply teat dip after milking, keep animal clean, complete full antibiotic course..."', "placeholder={t('veterinarian:clinicalWorkspace.generalInstructionsPlaceholder', 'Detail instructions e.g. apply teat dip after milking, keep animal clean, complete full antibiotic course...')}"] ,
  ['placeholder="Feed modifications, fresh water intake, mineral mixture supplements..."', "placeholder={t('veterinarian:clinicalWorkspace.dietaryAdvicePlaceholder', 'Feed modifications, fresh water intake, mineral mixture supplements...')}"] ,
  ['placeholder="e.g. Schedule check-up if fever persists after 3 days, monitor milk yield recovery..."', "placeholder={t('veterinarian:clinicalWorkspace.followUpPlaceholder', 'e.g. Schedule check-up if fever persists after 3 days, monitor milk yield recovery...')}"]
]);

// 13. dairy/MilkCollection.jsx
batchReplace(path.join(srcDir, 'pages', 'dairy', 'MilkCollection.jsx'), [
  ['title="Record Daily Milk Collection"\n            subtitle="Authoritative recording of milk intake from actively connected farmers"', 'title={t(\'dairyOwner:collection.recordDailyTitle\', \'Record Daily Milk Collection\')}\n            subtitle={t(\'dairyOwner:collection.recordDailySubtitle\', \'Authoritative recording of milk intake from actively connected farmers\')}'],
  ['title="No Active Farmers Available"\n                description="You must have actively connected farmers to record milk collections. Connect with farmers using their registered mobile number first."', 'title={t(\'dairyOwner:collection.noActiveFarmersTitle\', \'No Active Farmers Available\')}\n                description={t(\'dairyOwner:collection.noActiveFarmersDesc\', \'You must have actively connected farmers to record milk collections. Connect with farmers using their registered mobile number first.\')}'],
  ['>Go to Connected Farmers<', ">{t('dairyOwner:collection.goToConnectedFarmers', 'Go to Connected Farmers')}<"],
  ['title="10-Day Billing & Payout Summary"\n            subtitle="Authoritative milk collection and settlement summary for standard 10-day payment cycles"', 'title={t(\'dairyOwner:collection.tenDayBillingTitle\', \'10-Day Billing & Payout Summary\')}\n            subtitle={t(\'dairyOwner:collection.tenDayBillingSubtitle\', \'Authoritative milk collection and settlement summary for standard 10-day payment cycles\')}'],
  ['<span>10-Day Billing Cycle:</span>', '<span>{t(\'dairyOwner:collection.tenDayBillingCycle\', \'10-Day Billing Cycle:\')}</span>'],
  ['title="Select Farmer to View 10-Day Summary"\n                description="Select a connected farmer and billing period above to generate the breakdown."', 'title={t(\'dairyOwner:collection.selectFarmerToViewSummary\', \'Select Farmer to View 10-Day Summary\')}\n                description={t(\'dairyOwner:collection.selectFarmerToViewSummaryDesc\', \'Select a connected farmer and billing period above to generate the breakdown.\')}'],
  ['Total Milk Supplied\n                    </span>', "{t('dairyOwner:collection.totalMilkSupplied', 'Total Milk Supplied')}\n                    </span>"],
  ['Milk Amount Recorded\n                    </span>', "{t('dairyOwner:collection.milkAmountRecorded', 'Milk Amount Recorded')}\n                    </span>"],
  ['Amount Already Paid\n                    </span>', "{t('dairyOwner:collection.amountAlreadyPaid', 'Amount Already Paid')}\n                    </span>"],
  ['Outstanding Balance\n                    </span>', "{t('dairyOwner:collection.outstandingBalance', 'Outstanding Balance')}\n                    </span>"],
  ['title="No Collections Found in Selected Period"\n                    description="No morning or evening milk records exist for this farmer in the selected 10-day period."', 'title={t(\'dairyOwner:collection.noCollectionsFoundInPeriod\', \'No Collections Found in Selected Period\')}\n                    description={t(\'dairyOwner:collection.noCollectionsFoundInPeriodDesc\', \'No morning or evening milk records exist for this farmer in the selected 10-day period.\')}'],
  ['title="Milk Collection History Log"\n            subtitle="Search, filter, and review all recorded shift collection entries"', 'title={t(\'dairyOwner:collection.historyLogTitle\', \'Milk Collection History Log\')}\n            subtitle={t(\'dairyOwner:collection.historyLogSubtitle\', \'Search, filter, and review all recorded shift collection entries\')}'],
  ['title="Refresh History"', "title={t('common:actions.refresh', 'Refresh History')}"],
  ['title="No Collection Records Found"\n                description="No milk collection records match the selected filter parameters."', 'title={t(\'dairyOwner:collection.noCollectionRecordsFound\', \'No Collection Records Found\')}\n                description={t(\'dairyOwner:collection.noCollectionRecordsFoundDesc\', \'No milk collection records match the selected filter parameters.\')}']
]);

// 14. dairy/Payments.jsx
batchReplace(path.join(srcDir, 'pages', 'dairy', 'Payments.jsx'), [
  ['title="Step 1: Select Farmer & Date Range"\n            subtitle="Fetch unsettled milk collection records"', 'title={t(\'dairyOwner:payments.step1Title\', \'Step 1: Select Farmer & Date Range\')}\n            subtitle={t(\'dairyOwner:payments.step1Subtitle\', \'Fetch unsettled milk collection records\')}'],
  ['title="No Active Farmers"\n                description="Connect with farmers first before recording payment settlements."', 'title={t(\'dairyOwner:payments.noActiveFarmers\', \'No Active Farmers\')}\n                description={t(\'dairyOwner:payments.noActiveFarmersDesc\', \'Connect with farmers first before recording payment settlements.\')}'],
  ['subtitle="Select collections to include in this settlement"', 'subtitle={t(\'dairyOwner:payments.step2Subtitle\', \'Select collections to include in this settlement\')}'],
  ['<span>Select All ({unpaidCollections.length})</span>', '<span>{t(\'dairyOwner:payments.selectAllCount\', { count: unpaidCollections.length, defaultValue: `Select All (${unpaidCollections.length})` })}</span>'],
  ['<SectionCard title="Step 3: Settlement & Payment Details" subtitle="Review authoritative totals and payment mode">', '<SectionCard title={t(\'dairyOwner:payments.step3Title\', \'Step 3: Settlement & Payment Details\')} subtitle={t(\'dairyOwner:payments.step3Subtitle\', \'Review authoritative totals and payment mode\')}>'],
  ['Settlement Preview\n                    </span>', "{t('dairyOwner:payments.settlementPreview', 'Settlement Preview')}\n                    </span>"],
  ['placeholder="e.g. UTR1298401924"', "placeholder={t('dairyOwner:payments.refUtrPlaceholder', 'e.g. UTR1298401924')}"],
  ['placeholder="e.g. Weekly settlement for Oct 1st week"', "placeholder={t('dairyOwner:payments.remarksPlaceholder', 'e.g. Weekly settlement for Oct 1st week')}"],
  ['title="No Unsettled Collections"\n              description="This farmer has no pending unpaid milk collections for the selected filter."', 'title={t(\'dairyOwner:payments.noUnsettledTitle\', \'No Unsettled Collections\')}\n              description={t(\'dairyOwner:payments.noUnsettledDesc\', \'This farmer has no pending unpaid milk collections for the selected filter.\')}'],
  ['title="Total Settlement Volume"', "title={t('dairyOwner:payments.totalSettlementVolume', 'Total Settlement Volume')}"],
  ['title="Total Paid Out"', "title={t('dairyOwner:payments.totalPaidOut', 'Total Paid Out')}"],
  ['title="Pending Outstanding"', "title={t('dairyOwner:payments.pendingOutstanding', 'Pending Outstanding')}"],
  ['title="Payment Settlement History"\n            subtitle="Past settlement ledger records"', 'title={t(\'dairyOwner:payments.historyTitle\', \'Payment Settlement History\')}\n            subtitle={t(\'dairyOwner:payments.historySubtitle\', \'Past settlement ledger records\')}'],
  ['title="Refresh History"', "title={t('common:actions.refresh', 'Refresh History')}"],
  ['title="No Settlement Records Found"\n                description="No payment settlement history matches the selected filters."', 'title={t(\'dairyOwner:payments.noHistoryTitle\', \'No Settlement Records Found\')}\n                description={t(\'dairyOwner:payments.noHistoryDesc\', \'No payment settlement history matches the selected filters.\')}'],
  ['title="View Details"', "title={t('dairyOwner:payments.viewDetails', 'View Details')}"]
]);

// 15. medical/Inventory.jsx
batchReplace(path.join(srcDir, 'pages', 'medical', 'Inventory.jsx'), [
  ['title="Total Medicines"', "title={t('medicalProvider:dashboard.totalInventory', 'Total Medicines')}"],
  ['title="Available in Catalog"', "title={t('medicalProvider:inventory.availableInCatalog', 'Available in Catalog')}"],
  ['title="Out of Stock"', "title={t('medicalProvider:inventory.outOfStock', 'Out of Stock')}"],
  ['title="Low Stock Warning"', "title={t('medicalProvider:inventory.lowStockWarning', 'Low Stock Warning')}"],
  ['placeholder="Search by name, generic, category..."', "placeholder={t('medicalProvider:inventory.searchPlaceholder', 'Search by name, generic, category...')}"] ,
  ['>Clear All Filters</button>', ">{t('common:actions.clearFilters', 'Clear All Filters')}</button>"],
  ['title="Medicine Inventory Register"', "title={t('medicalProvider:inventory.registerTitle', 'Medicine Inventory Register')}"],
  ['title="Refresh List"', "title={t('common:actions.refresh', 'Refresh List')}"],
  ['title="No Medicine Records Found"\n            description="No items match your filter criteria or no medicines have been added yet."', 'title={t(\'medicalProvider:inventory.noRecordsFound\', \'No Medicine Records Found\')}\n            description={t(\'medicalProvider:inventory.noRecordsFoundDesc\', \'No items match your filter criteria or no medicines have been added yet.\')}'],
  ['title="Click to toggle availability"', "title={t('medicalProvider:inventory.toggleAvailability', 'Click to toggle availability')}"],
  ['title="Edit Details"', "title={t('medicalProvider:inventory.editDetails', 'Edit Details')}"],
  ['title="Update Stock"', "title={t('medicalProvider:inventory.updateStock', 'Update Stock')}"],
  ['title="Deactivate Item"', "title={t('medicalProvider:inventory.deactivateItem', 'Deactivate Item')}"],
  ['placeholder="e.g. Amoxicillin 500mg"', "placeholder={t('medicalProvider:inventory.namePlaceholder', 'e.g. Amoxicillin 500mg')}"],
  ['placeholder="e.g. Amoxicillin Trihydrate"', "placeholder={t('medicalProvider:inventory.genericPlaceholder', 'e.g. Amoxicillin Trihydrate')}"],
  ['placeholder="e.g. Broad-spectrum antibiotic for livestock treatment"', "placeholder={t('medicalProvider:inventory.descriptionPlaceholder', 'e.g. Broad-spectrum antibiotic for livestock treatment')}"]
]);

console.log('Finished updating JSX strings.');
