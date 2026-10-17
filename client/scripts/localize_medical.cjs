const fs = require('fs');
const path = require('path');

// 1. Inventory.jsx
const invPath = path.join(__dirname, '..', 'src', 'pages', 'medical', 'Inventory.jsx');
let inv = fs.readFileSync(invPath, 'utf8');

const invReplacements = [
  ['<option value="">All Categories</option>', '<option value="">{t(\'medicalProvider:inventory.allCategories\', \'All Categories\')}</option>'],
  ['<option value="">All Availability</option>', '<option value="">{t(\'medicalProvider:inventory.allAvailability\', \'All Availability\')}</option>'],
  ['<option value="available">Available</option>', '<option value="available">{t(\'medicalProvider:inventory.available\', \'Available\')}</option>'],
  ['<option value="unavailable">Unavailable</option>', '<option value="unavailable">{t(\'medicalProvider:inventory.unavailable\', \'Unavailable\')}</option>'],
  ['<option value="true">Active Items Only</option>', '<option value="true">{t(\'medicalProvider:inventory.activeItemsOnly\', \'Active Items Only\')}</option>'],
  ['<option value="false">Deactivated Items Only</option>', '<option value="false">{t(\'medicalProvider:inventory.deactivatedItemsOnly\', \'Deactivated Items Only\')}</option>'],
  ['<option value="all">All Items</option>', '<option value="all">{t(\'medicalProvider:inventory.allItems\', \'All Items\')}</option>'],
  ['<span>Show Low Stock Items Only (Stock ≤ 10)</span>', '<span>{t(\'medicalProvider:inventory.showLowStockOnly\', \'Show Low Stock Items Only (Stock ≤ 10)\')}</span>'],
  ['Loading medicine inventory...', "{t('medicalProvider:inventory.loadingInventory', 'Loading medicine inventory...')}"],
  ['<th className="py-3 px-4">Medicine Name</th>', '<th className="py-3 px-4">{t(\'medicalProvider:inventory.medicineNameRequired\', \'Medicine Name\')}</th>'],
  ['<th className="py-3 px-4">Category</th>', '<th className="py-3 px-4">{t(\'common:labels.category\', \'Category\')}</th>'],
  ['<th className="py-3 px-4 text-right">Price (₹)</th>', '<th className="py-3 px-4 text-right">{t(\'common:labels.price\', \'Price (₹)\')}</th>'],
  ['<th className="py-3 px-4 text-right">Stock</th>', '<th className="py-3 px-4 text-right">{t(\'common:labels.stock\', \'Stock\')}</th>'],
  ['<th className="py-3 px-4 text-center">Unit</th>', '<th className="py-3 px-4 text-center">{t(\'medicalProvider:inventory.unit\', \'Unit\')}</th>'],
  ['<th className="py-3 px-4 text-center">Availability</th>', '<th className="py-3 px-4 text-center">{t(\'medicalProvider:inventory.availability\', \'Availability\')}</th>'],
  ['<th className="py-3 px-4 text-center">Active Status</th>', '<th className="py-3 px-4 text-center">{t(\'medicalProvider:inventory.activeStatus\', \'Active Status\')}</th>'],
  ['<th className="py-3 px-4 text-center">Actions</th>', '<th className="py-3 px-4 text-center">{t(\'common:labels.actions\', \'Actions\')}</th>'],
  ['<span className="text-slate-500 block text-[10px] uppercase font-sans">Stock Quantity</span>', '<span className="text-slate-500 block text-[10px] uppercase font-sans">{t(\'medicalProvider:inventory.stockQuantity\', \'Stock Quantity\')}</span>'],
  ['OUT OF STOCK', "{t('medicalProvider:inventory.outOfStockBadge', 'OUT OF STOCK')}"],
  ['LOW STOCK', "{t('medicalProvider:inventory.lowStockBadge', 'LOW STOCK')}"],
  ['<label className="font-semibold text-slate-700">Medicine Name *</label>', '<label className="font-semibold text-slate-700">{t(\'medicalProvider:inventory.medicineNameRequired\', \'Medicine Name *\')}</label>'],
  ['<label className="font-semibold text-slate-700">Generic Name</label>', '<label className="font-semibold text-slate-700">{t(\'medicalProvider:inventory.genericName\', \'Generic Name\')}</label>'],
  ['<label className="font-semibold text-slate-700">Category *</label>', '<label className="font-semibold text-slate-700">{t(\'medicalProvider:inventory.categoryRequired\', \'Category *\')}</label>'],
  ['<label className="font-semibold text-slate-700">Price (₹) *</label>', '<label className="font-semibold text-slate-700">{t(\'medicalProvider:inventory.priceRequired\', \'Price (₹) *\')}</label>'],
  ['<label className="font-semibold text-slate-700">Unit Type *</label>', '<label className="font-semibold text-slate-700">{t(\'medicalProvider:inventory.unitTypeRequired\', \'Unit Type *\')}</label>'],
  ['<label className="font-semibold text-slate-700">Stock Quantity *</label>', '<label className="font-semibold text-slate-700">{t(\'medicalProvider:inventory.stockQuantityRequired\', \'Stock Quantity *\')}</label>'],
  ['<label className="font-semibold text-slate-700">Initial Availability *</label>', '<label className="font-semibold text-slate-700">{t(\'medicalProvider:inventory.initialAvailability\', \'Initial Availability *\')}</label>'],
  ['<label className="font-semibold text-slate-700">Description / Usage Notes</label>', '<label className="font-semibold text-slate-700">{t(\'medicalProvider:inventory.descriptionNotes\', \'Description / Usage Notes\')}</label>'],
  ['<span>Update Stock Quantity</span>', "<span>{t('medicalProvider:inventory.updateStockTitle', 'Update Stock Quantity')}</span>"],
  ['Current Stock:', "{t('medicalProvider:inventory.currentStock', 'Current Stock:')}"],
  ['<label className="font-semibold text-slate-700">New Stock Quantity *</label>', '<label className="font-semibold text-slate-700">{t(\'medicalProvider:inventory.newStockQuantityRequired\', \'New Stock Quantity *\')}</label>']
];

for (const [target, repl] of invReplacements) {
  inv = inv.split(target).join(repl);
}
fs.writeFileSync(invPath, inv, 'utf8');
console.log('Updated Inventory.jsx');

// 2. MedicineRequests.jsx
const reqPath = path.join(__dirname, '..', 'src', 'pages', 'medical', 'MedicineRequests.jsx');
let req = fs.readFileSync(reqPath, 'utf8');

const reqReplacements = [
  ['<p className="text-xs text-slate-400 mt-1">Stock reserved</p>', '<p className="text-xs text-slate-400 mt-1">{t(\'medicalProvider:requests.stockReserved\', \'Stock reserved\')}</p>'],
  ['<p className="text-xs text-slate-400 mt-1">Ready for pickup prep</p>', '<p className="text-xs text-slate-400 mt-1">{t(\'medicalProvider:requests.readyForPickupPrep\', \'Ready for pickup prep\')}</p>'],
  ['<p className="text-xs text-slate-400 mt-1">Waiting collection</p>', '<p className="text-xs text-slate-400 mt-1">{t(\'medicalProvider:requests.waitingCollection\', \'Waiting collection\')}</p>'],
  ['<p className="text-xs text-slate-400 mt-1">Fulfilled requests</p>', '<p className="text-xs text-slate-400 mt-1">{t(\'medicalProvider:requests.fulfilledRequests\', \'Fulfilled requests\')}</p>'],
  ['<p className="text-sm">Loading requests...</p>', '<p className="text-sm">{t(\'medicalProvider:requests.loadingRequests\', \'Loading requests...\')}</p>'],
  ['<p className="text-xs text-slate-400">Try adjusting search or status filters.</p>', '<p className="text-xs text-slate-400">{t(\'medicalProvider:requests.adjustFilterTip\', \'Try adjusting search or status filters.\')}</p>'],
  ['<th className="p-4">Farmer Details</th>', '<th className="p-4">{t(\'medicalProvider:requests.farmerDetails\', \'Farmer Details\')}</th>'],
  ['<th className="p-4">Medicine</th>', '<th className="p-4">{t(\'medicalProvider:requests.medicine\', \'Medicine\')}</th>'],
  ['<th className="p-4">Quantity</th>', '<th className="p-4">{t(\'medicalProvider:requests.quantity\', \'Quantity\')}</th>'],
  ['<th className="p-4">Total Amount</th>', '<th className="p-4">{t(\'medicalProvider:requests.totalAmount\', \'Total Amount\')}</th>'],
  ['<th className="p-4">Requested On</th>', '<th className="p-4">{t(\'medicalProvider:requests.requestedOn\', \'Requested On\')}</th>'],
  ['<h3 className="text-lg font-bold text-slate-800">Request Details</h3>', '<h3 className="text-lg font-bold text-slate-800">{t(\'medicalProvider:requests.requestDetailsTitle\', \'Request Details\')}</h3>'],
  ['<h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Order Summary</h4>', '<h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t(\'medicalProvider:requests.orderSummary\', \'Order Summary\')}</h4>'],
  ['<span className="font-semibold">Farmer Notes:</span>', '<span className="font-semibold">{t(\'medicalProvider:requests.farmerNotes\', \'Farmer Notes:\')}</span>'],
  ['<span className="font-semibold">Provider Remarks:</span>', '<span className="font-semibold">{t(\'medicalProvider:requests.providerRemarks\', \'Provider Remarks:\')}</span>'],
  ['<h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Timeline</h4>', '<h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t(\'medicalProvider:requests.statusTimeline\', \'Status Timeline\')}</h4>'],
  ['<p className="text-xs font-semibold text-slate-800">Requested</p>', '<p className="text-xs font-semibold text-slate-800">{t(\'medicalProvider:requests.timelineRequested\', \'Requested\')}</p>'],
  ['<p className="text-xs font-semibold text-slate-800">Accepted</p>', '<p className="text-xs font-semibold text-slate-800">{t(\'medicalProvider:requests.timelineAccepted\', \'Accepted\')}</p>'],
  ['<p className="text-xs font-semibold text-slate-800">Packed</p>', '<p className="text-xs font-semibold text-slate-800">{t(\'medicalProvider:requests.timelinePacked\', \'Packed\')}</p>'],
  ['<p className="text-xs font-semibold text-slate-800">Ready for Collection</p>', '<p className="text-xs font-semibold text-slate-800">{t(\'medicalProvider:requests.timelineReady\', \'Ready for Collection\')}</p>'],
  ['<p className="text-xs font-semibold text-slate-800">Completed</p>', '<p className="text-xs font-semibold text-slate-800">{t(\'medicalProvider:requests.timelineCompleted\', \'Completed\')}</p>'],
  ['<p className="text-xs font-semibold text-gray-800">Cancelled</p>', '<p className="text-xs font-semibold text-gray-800">{t(\'medicalProvider:requests.timelineCancelled\', \'Cancelled\')}</p>'],
  ['<p className="text-xs font-semibold text-red-800">Rejected</p>', '<p className="text-xs font-semibold text-red-800">{t(\'medicalProvider:requests.timelineRejected\', \'Rejected\')}</p>'],
  ['<h3 className="text-lg font-bold text-slate-800">Reject Medicine Request</h3>', '<h3 className="text-lg font-bold text-slate-800">{t(\'medicalProvider:requests.rejectModalTitle\', \'Reject Medicine Request\')}</h3>'],
  ['<label className="block text-xs font-medium text-slate-700 mb-1">Remarks / Reason</label>', '<label className="block text-xs font-medium text-slate-700 mb-1">{t(\'medicalProvider:requests.remarksReason\', \'Remarks / Reason\')}</label>'],
  ['<h3 className="text-lg font-bold text-slate-800">Cancel Medicine Request</h3>', '<h3 className="text-lg font-bold text-slate-800">{t(\'medicalProvider:requests.cancelModalTitle\', \'Cancel Medicine Request\')}</h3>'],
  ['<label className="block text-xs font-medium text-slate-700 mb-1">Cancellation Reason</label>', '<label className="block text-xs font-medium text-slate-700 mb-1">{t(\'medicalProvider:requests.cancellationReason\', \'Cancellation Reason\')}</label>']
];

for (const [target, repl] of reqReplacements) {
  req = req.split(target).join(repl);
}
fs.writeFileSync(reqPath, req, 'utf8');
console.log('Updated MedicineRequests.jsx');
