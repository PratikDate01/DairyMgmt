const fs = require('fs');
const path = require('path');

// 1. MilkCollection.jsx
const milkColPath = path.join(__dirname, '..', 'src', 'pages', 'dairy', 'MilkCollection.jsx');
let milkCol = fs.readFileSync(milkColPath, 'utf8');

const milkReplacements = [
  ['<label className="text-[11px] font-semibold text-slate-600 block">Start Date</label>', '<label className="text-[11px] font-semibold text-slate-600 block">{t(\'dairyOwner:collection.startDate\', \'Start Date\')}</label>'],
  ['<label className="text-[11px] font-semibold text-slate-600 block">End Date</label>', '<label className="text-[11px] font-semibold text-slate-600 block">{t(\'dairyOwner:collection.endDate\', \'End Date\')}</label>'],
  ['<option value="last7days">Last 7 Days</option>', '<option value="last7days">{t(\'dairyOwner:collection.last7Days\', \'Last 7 Days\')}</option>'],
  ['<option value="last10days">Last 10 Days</option>', '<option value="last10days">{t(\'dairyOwner:collection.last10Days\', \'Last 10 Days\')}</option>'],
  ['<option value="thisMonth">This Month</option>', '<option value="thisMonth">{t(\'dairyOwner:collection.thisMonth\', \'This Month\')}</option>'],
  ['<span className="text-slate-500 text-[10px] block uppercase font-semibold">Records</span>', '<span className="text-slate-500 text-[10px] block uppercase font-semibold">{t(\'dairyOwner:collection.recordsCount\', \'Records\')}</span>'],
  ['<span className="text-slate-500 text-[10px] block uppercase font-semibold">Total Quantity</span>', '<span className="text-slate-500 text-[10px] block uppercase font-semibold">{t(\'dairyOwner:collection.totalQuantity\', \'Total Quantity\')}</span>'],
  ['<span className="text-slate-500 text-[10px] block uppercase font-semibold">Total Value</span>', '<span className="text-slate-500 text-[10px] block uppercase font-semibold">{t(\'dairyOwner:collection.totalValue\', \'Total Value\')}</span>'],
  ['<span className="text-slate-500 text-[10px] block uppercase font-semibold">Unsettled Value</span>', '<span className="text-slate-500 text-[10px] block uppercase font-semibold">{t(\'dairyOwner:collection.unsettledValue\', \'Unsettled Value\')}</span>'],
  ['<th className="py-3 px-4">Date</th>', '<th className="py-3 px-4">{t(\'common:labels.date\', \'Date\')}</th>'],
  ['<th className="py-3 px-4">Farmer</th>', '<th className="py-3 px-4">{t(\'common:roles.farmer\', \'Farmer\')}</th>'],
  ['<th className="py-3 px-4">Session</th>', '<th className="py-3 px-4">{t(\'common:labels.session\', \'Session\')}</th>'],
  ['<th className="py-3 px-4 text-right">Quantity (L)</th>', '<th className="py-3 px-4 text-right">{t(\'common:labels.quantity\', \'Quantity (L)\')}</th>'],
  ['<th className="py-3 px-4 text-right">Fat (%)</th>', '<th className="py-3 px-4 text-right">{t(\'common:labels.fat\', \'Fat (%)\')}</th>'],
  ['<th className="py-3 px-4 text-right">Rate (₹/L)</th>', '<th className="py-3 px-4 text-right">{t(\'common:labels.rate\', \'Rate (₹/L)\')}</th>'],
  ['<th className="py-3 px-4 text-right">Total Amount</th>', '<th className="py-3 px-4 text-right">{t(\'common:labels.totalAmount\', \'Total Amount\')}</th>'],
  ['<th className="py-3 px-4 text-center">Settlement Status</th>', '<th className="py-3 px-4 text-center">{t(\'farmer:milk.settlementStatus\', \'Settlement Status\')}</th>']
];

for (const [target, repl] of milkReplacements) {
  milkCol = milkCol.split(target).join(repl);
}
fs.writeFileSync(milkColPath, milkCol, 'utf8');

// 2. Payments.jsx
const paymentsPath = path.join(__dirname, '..', 'src', 'pages', 'dairy', 'Payments.jsx');
let payments = fs.readFileSync(paymentsPath, 'utf8');

const paymentReplacements = [
  ['<label className="text-xs font-semibold text-slate-700">Select Active Farmer *</label>', '<label className="text-xs font-semibold text-slate-700">{t(\'dairyOwner:payments.selectActiveFarmer\', \'Select Active Farmer *\')}</label>'],
  ['<label className="text-xs font-semibold text-slate-700">From Date (Optional)</label>', '<label className="text-xs font-semibold text-slate-700">{t(\'dairyOwner:payments.fromDateOptional\', \'From Date (Optional)\')}</label>'],
  ['<label className="text-xs font-semibold text-slate-700">To Date (Optional)</label>', '<label className="text-xs font-semibold text-slate-700">{t(\'common:filters.to\', \'To Date (Optional)\')}</label>'],
  ['<span className="text-slate-600">Selected Records</span>', '<span className="text-slate-600">{t(\'dairyOwner:payments.selectedRecords\', \'Selected Records\')}</span>'],
  ['<span className="text-slate-600">Total Milk Volume</span>', '<span className="text-slate-600">{t(\'dairyOwner:payments.totalMilkVolume\', \'Total Milk Volume\')}</span>'],
  ['<span className="text-slate-600 font-semibold">Gross Total Amount</span>', '<span className="text-slate-600 font-semibold">{t(\'dairyOwner:payments.grossTotalAmount\', \'Gross Total Amount\')}</span>'],
  ['<span className="text-emerald-700 font-semibold">Amount Being Paid</span>', '<span className="text-emerald-700 font-semibold">{t(\'dairyOwner:payments.amountBeingPaid\', \'Amount Being Paid\')}</span>'],
  ['<span className="text-amber-800 font-semibold">Remaining Balance</span>', '<span className="text-amber-800 font-semibold">{t(\'dairyOwner:payments.remainingBalance\', \'Remaining Balance\')}</span>'],
  ['<label className="text-xs font-semibold text-slate-700">Amount Paid (₹) *</label>', '<label className="text-xs font-semibold text-slate-700">{t(\'dairyOwner:payments.amountPaidRequired\', \'Amount Paid (₹) *\')}</label>'],
  ['<label className="text-xs font-semibold text-slate-700">Payment Method *</label>', '<label className="text-xs font-semibold text-slate-700">{t(\'dairyOwner:payments.paymentMethodRequired\', \'Payment Method *\')}</label>'],
  ['<option value="bankTransfer">Bank Transfer / NEFT</option>', '<option value="bankTransfer">{t(\'dairyOwner:payments.bankTransfer\', \'Bank Transfer / NEFT\')}</option>'],
  ['<label className="text-xs font-semibold text-slate-700">Payment Date *</label>', '<label className="text-xs font-semibold text-slate-700">{t(\'dairyOwner:payments.paymentDateRequired\', \'Payment Date *\')}</label>'],
  ['<label className="text-xs font-semibold text-slate-700">Ref / UTR / Transaction No.</label>', '<label className="text-xs font-semibold text-slate-700">{t(\'dairyOwner:payments.refTransactionNo\', \'Ref / UTR / Transaction No.\')}</label>'],
  ['<label className="text-xs font-semibold text-slate-700">Remarks / Notes</label>', '<label className="text-xs font-semibold text-slate-700">{t(\'dairyOwner:payments.remarksNotes\', \'Remarks / Notes\')}</label>'],
  ['<option value="partiallyPaid">Partially Paid</option>', '<option value="partiallyPaid">{t(\'dairyOwner:payments.partiallyPaid\', \'Partially Paid\')}</option>'],
  ['<th className="py-3 px-4">Payment Date</th>', '<th className="py-3 px-4">{t(\'dairyOwner:payments.paymentDateLabel\', \'Payment Date\')}</th>'],
  ['<th className="py-3 px-4">Farmer</th>', '<th className="py-3 px-4">{t(\'common:roles.farmer\', \'Farmer\')}</th>'],
  ['<th className="py-3 px-4">Period</th>', '<th className="py-3 px-4">{t(\'dairyOwner:payments.period\', \'Period\')}</th>'],
  ['<th className="py-3 px-4 text-right">Gross Total</th>', '<th className="py-3 px-4 text-right">{t(\'dairyOwner:payments.grossTotal\', \'Gross Total\')}</th>'],
  ['<th className="py-3 px-4 text-right">Paid Amount</th>', '<th className="py-3 px-4 text-right">{t(\'dairyOwner:payments.paidAmount\', \'Paid Amount\')}</th>'],
  ['<th className="py-3 px-4 text-right">Remaining</th>', '<th className="py-3 px-4 text-right">{t(\'dairyOwner:payments.remaining\', \'Remaining\')}</th>'],
  ['<th className="py-3 px-4 text-center">Status</th>', '<th className="py-3 px-4 text-center">{t(\'common:labels.status\', \'Status\')}</th>'],
  ['<th className="py-3 px-4 text-center">Action</th>', '<th className="py-3 px-4 text-center">{t(\'common:labels.action\', \'Action\')}</th>']
];

for (const [target, repl] of paymentReplacements) {
  payments = payments.split(target).join(repl);
}
fs.writeFileSync(paymentsPath, payments, 'utf8');

// 3. Reports.jsx
const reportsPath = path.join(__dirname, '..', 'src', 'pages', 'dairy', 'Reports.jsx');
let reports = fs.readFileSync(reportsPath, 'utf8');

const reportReplacements = [
  ['<label className="text-[11px] font-semibold text-slate-600">Start Date</label>', '<label className="text-[11px] font-semibold text-slate-600">{t(\'dairyOwner:reports.startDate\', \'Start Date\')}</label>'],
  ['<label className="text-[11px] font-semibold text-slate-600">End Date</label>', '<label className="text-[11px] font-semibold text-slate-600">{t(\'dairyOwner:reports.endDate\', \'End Date\')}</label>'],
  ['<span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Volume</span>', '<span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{t(\'dairyOwner:reports.totalVolume\', \'Total Volume\')}</span>'],
  ['<span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Average Shift Intake</span>', '<span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{t(\'dairyOwner:reports.averageShiftIntake\', \'Average Shift Intake\')}</span>'],
  ['<span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Average Fat %</span>', '<span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{t(\'dairyOwner:reports.averageFatPercent\', \'Average Fat %\')}</span>'],
  ['<span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Average Rate</span>', '<span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{t(\'dairyOwner:reports.averageRate\', \'Average Rate\')}</span>'],
  ['<span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Valuation</span>', '<span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{t(\'dairyOwner:reports.totalValuation\', \'Total Valuation\')}</span>'],
  ['<th className="py-3 px-4">Farmer</th>', '<th className="py-3 px-4">{t(\'common:roles.farmer\', \'Farmer\')}</th>'],
  ['<th className="py-3 px-4 text-right">Milk Quantity</th>', '<th className="py-3 px-4 text-right">{t(\'dairyOwner:reports.milkQuantity\', \'Milk Quantity\')}</th>'],
  ['<th className="py-3 px-4 text-right">Milk Valuation</th>', '<th className="py-3 px-4 text-right">{t(\'dairyOwner:reports.milkValuation\', \'Milk Valuation\')}</th>'],
  ['<th className="py-3 px-4 text-right">Total Paid</th>', '<th className="py-3 px-4 text-right">{t(\'dairyOwner:reports.totalPaid\', \'Total Paid\')}</th>'],
  ['<th className="py-3 px-4 text-right">Outstanding</th>', '<th className="py-3 px-4 text-right">{t(\'dairyOwner:reports.outstanding\', \'Outstanding\')}</th>'],
  ['<th className="py-3 px-4 text-center">Collections</th>', '<th className="py-3 px-4 text-center">{t(\'dairyOwner:reports.collectionsCount\', \'Collections\')}</th>'],
  ['<th className="py-3 px-4 text-center">Last Intake Date</th>', '<th className="py-3 px-4 text-center">{t(\'dairyOwner:reports.lastIntakeDate\', \'Last Intake Date\')}</th>'],
  ['<span className="text-[10px] text-slate-400 block uppercase font-sans">Supplied</span>', '<span className="text-[10px] text-slate-400 block uppercase font-sans">{t(\'dairyOwner:reports.supplied\', \'Supplied\')}</span>'],
  ['<span className="text-[10px] text-slate-400 block uppercase font-sans">Paid</span>', '<span className="text-[10px] text-slate-400 block uppercase font-sans">{t(\'dairyOwner:reports.paid\', \'Paid\')}</span>'],
  ['<span className="text-[10px] text-slate-400 block uppercase font-sans">Pending</span>', '<span className="text-[10px] text-slate-400 block uppercase font-sans">{t(\'dairyOwner:reports.pending\', \'Pending\')}</span>'],
  ['<th className="py-3 px-4">Date</th>', '<th className="py-3 px-4">{t(\'common:labels.date\', \'Date\')}</th>'],
  ['<th className="py-3 px-4 text-center">Settlements Issued</th>', '<th className="py-3 px-4 text-center">{t(\'dairyOwner:reports.settlementsIssued\', \'Settlements Issued\')}</th>'],
  ['<th className="py-3 px-4 text-right">Gross Total</th>', '<th className="py-3 px-4 text-right">{t(\'dairyOwner:reports.grossTotal\', \'Gross Total\')}</th>'],
  ['<th className="py-3 px-4 text-right">Paid Disbursed</th>', '<th className="py-3 px-4 text-right">{t(\'dairyOwner:reports.paidDisbursed\', \'Paid Disbursed\')}</th>'],
  ['<th className="py-3 px-4 text-right">Outstanding Balance</th>', '<th className="py-3 px-4 text-right">{t(\'dairyOwner:reports.outstandingBalance\', \'Outstanding Balance\')}</th>']
];

for (const [target, repl] of reportReplacements) {
  reports = reports.split(target).join(repl);
}
fs.writeFileSync(reportsPath, reports, 'utf8');
console.log('Successfully applied all remaining dairy replacements.');
