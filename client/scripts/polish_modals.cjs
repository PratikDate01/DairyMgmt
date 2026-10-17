const fs = require('fs');
const path = require('path');

function updateFile(relPath, replacements) {
  const fullPath = path.join(__dirname, '..', relPath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let count = 0;
  for (const [target, rep] of replacements) {
    if (content.includes(target)) {
      content = content.replace(target, rep);
      count++;
    } else {
      console.warn(`[WARN] Target not found in ${relPath}: ${target.slice(0, 40)}...`);
    }
  }
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated ${relPath}: ${count} replacements applied.`);
}

// 1. PendingCases.jsx
updateFile('src/pages/veterinarian/PendingCases.jsx', [
  [
    '<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-sm">\n          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">',
    '<div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-sm overflow-y-auto">\n          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto modal-animate">'
  ]
]);

// 2. Inventory.jsx
updateFile('src/pages/medical/Inventory.jsx', [
  [
    '<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-xs">\n          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">',
    '<div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-xs overflow-y-auto">\n          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 my-auto max-h-[90vh] overflow-y-auto modal-animate">'
  ],
  [
    '<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-xs">\n          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">',
    '<div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-xs overflow-y-auto">\n          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 my-auto max-h-[90vh] overflow-y-auto modal-animate">'
  ]
]);

// 3. MedicineRequests.jsx (medical)
updateFile('src/pages/medical/MedicineRequests.jsx', [
  [
    '<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">\n          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">',
    '<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">\n          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 my-auto max-h-[90vh] overflow-y-auto modal-animate">'
  ]
]);

// 4. Medicines.jsx (farmer)
updateFile('src/pages/farmer/Medicines.jsx', [
  [
    '<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">\n          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">',
    '<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">\n          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 my-auto max-h-[90vh] overflow-y-auto modal-animate">'
  ]
]);

// 5. MyCattle.jsx
updateFile('src/pages/farmer/MyCattle.jsx', [
  [
    '<div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-sm flex items-center justify-center p-4">\n          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">\n            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">',
    '<div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">\n          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden my-auto max-h-[90vh] flex flex-col modal-animate">\n            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">'
  ],
  [
    '<form onSubmit={handleCreateSubmit} className="p-6 space-y-4">',
    '<form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">'
  ],
  [
    '<div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-sm flex items-center justify-center p-4">\n          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">\n            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">',
    '<div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">\n          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden my-auto max-h-[90vh] flex flex-col modal-animate">\n            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">'
  ],
  [
    '<form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">',
    '<form onSubmit={handleUpdateSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">'
  ],
  [
    '<div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-sm flex items-center justify-center p-4">\n          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">',
    '<div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">\n          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden my-auto max-h-[90vh] flex flex-col modal-animate">'
  ],
  [
    '<div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-sm flex items-center justify-center p-4">\n          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 text-center space-y-4">',
    '<div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">\n          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 text-center space-y-4 my-auto modal-animate">'
  ],
  [
    'View Result\n                        </button>',
    "{t('common:actions.view', 'View Result')}\n                        </button>"
  ],
  [
    'Close\n                </button>',
    "{t('common:actions.close', 'Close')}\n                </button>"
  ]
]);

// 6. Payments.jsx (farmer)
updateFile('src/pages/farmer/Payments.jsx', [
  [
    '<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-xs">\n          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">',
    '<div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-xs overflow-y-auto">\n          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 my-auto max-h-[90vh] overflow-y-auto modal-animate">'
  ]
]);

// 7. AdminDashboard.jsx
updateFile('src/pages/dashboards/AdminDashboard.jsx', [
  [
    '<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">\n          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">',
    '<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">\n          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden my-auto max-h-[90vh] flex flex-col modal-animate">'
  ],
  [
    '<form onSubmit={handleSubmitVerification} className="p-6 space-y-4 text-xs">',
    '<form onSubmit={handleSubmitVerification} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">'
  ],
  [
    '<form onSubmit={handleSubmitComplaintResolution} className="p-6 space-y-4 text-xs">',
    '<form onSubmit={handleSubmitComplaintResolution} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">'
  ],
  [
    '<form onSubmit={handleCreateNewComplaint} className="p-6 space-y-4 text-xs">',
    '<form onSubmit={handleCreateNewComplaint} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">'
  ]
]);

// 8. Complaints.jsx
updateFile('src/pages/common/Complaints.jsx', [
  [
    '<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">\n          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">',
    '<div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">\n          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden my-auto max-h-[90vh] flex flex-col modal-animate">'
  ],
  [
    '<form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">',
    '<form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">'
  ]
]);

// 9. Payments.jsx (dairy)
updateFile('src/pages/dairy/Payments.jsx', [
  [
    '<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-xs">\n          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">',
    '<div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-xs overflow-y-auto">\n          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 my-auto max-h-[90vh] overflow-y-auto modal-animate">'
  ],
  [
    '<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-xs">\n          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">',
    '<div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-xs overflow-y-auto">\n          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 my-auto max-h-[90vh] overflow-y-auto modal-animate">'
  ]
]);

// 10. VeterinarianRecommendations.jsx
updateFile('src/components/farmer/VeterinarianRecommendations.jsx', [
  [
    '<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-sm">\n          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">',
    '<div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-sm overflow-y-auto">\n          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto modal-animate">'
  ],
  [
    '<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-sm">\n          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">',
    '<div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-sm overflow-y-auto">\n          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto modal-animate">'
  ]
]);

console.log('All modal responsiveness polish applied successfully!');
