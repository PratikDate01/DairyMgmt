import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { medicineService } from '../../services/medicineService';
import { createMedicineRequest } from '../../services/medicineRequestService';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Pill,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  Building2,
  ShoppingBag,
  Info,
  X,
  ShieldCheck,
  Search,
  ArrowRight
} from 'lucide-react';

export const FarmerMedicines = () => {
  const { token } = useAuth();

  // Upload & File State
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');

  // Processing & Results State
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Identified & Matching Results
  const [extractedMedicines, setExtractedMedicines] = useState([]);
  const [matchingMedicines, setMatchingMedicines] = useState([]);

  // Medicine Request Modal State
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Handle Prescription File Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Unsupported file type. Please upload a JPG, PNG, WEBP image or PDF document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit. Please select a smaller file.');
      return;
    }

    setError('');
    setSelectedFile(file);
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');
    setAnalysisDone(false);
    setExtractedMedicines([]);
    setMatchingMedicines([]);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileName('');
    setFileSize('');
    setError('');
    setAnalysisDone(false);
    setExtractedMedicines([]);
    setMatchingMedicines([]);
  };

  // Submit Prescription to Backend Processing
  const handleAnalyzePrescription = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please upload a prescription file first.');
      return;
    }

    try {
      setAnalyzing(true);
      setError('');

      let payloadData = filePreview || fileName;
      const res = await medicineService.processPrescription(token, {
        prescriptionData: payloadData,
        fileName,
        fileType: selectedFile.type
      });

      setExtractedMedicines(res.extractedMedicines || []);
      setMatchingMedicines(res.matchingMedicines || []);
      setAnalysisDone(true);
    } catch (err) {
      console.error('Error analyzing prescription:', err);
      setError(err.message || 'Failed to process prescription document.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Open Medicine Request Modal
  const openRequestModal = (med) => {
    setSelectedMedicine(med);
    setQuantity(1);
    setNotes('');
    setModalError('');
  };

  // Submit Medicine Request (Existing Workflow Integration)
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMedicine) return;

    if (quantity <= 0) {
      setModalError('Quantity must be at least 1');
      return;
    }

    if (quantity > selectedMedicine.stockQuantity) {
      setModalError(`Quantity cannot exceed available stock (${selectedMedicine.stockQuantity})`);
      return;
    }

    try {
      setSubmitting(true);
      setModalError('');

      const res = await createMedicineRequest({
        medicineId: selectedMedicine._id,
        quantity,
        notes
      });

      if (res.success) {
        setSuccessMsg(`Medicine request created for ${selectedMedicine.name}. You can track status in 'My Medicine Requests'.`);
        setSelectedMedicine(null);
      }
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <PageHeader
        title="Prescription Medicine Search & Catalog"
        description="Upload your veterinarian prescription to automatically identify prescribed medicines and find available products from registered medical providers."
        breadcrumbs={['Home', 'Farmer Portal', 'Prescription Search']}
        actions={
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-600" /> Prescription Driven
            </span>
          </div>
        }
      />

      {/* Global Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-700 font-bold text-xs">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-800 font-bold text-xs">Dismiss</button>
        </div>
      )}

      {/* Step-by-Step Visual Workflow Tracker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs text-xs font-semibold text-center">
        <div className={`p-2 rounded-xl flex items-center justify-center space-x-1.5 ${selectedFile ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-500'}`}>
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
          <span>Upload Prescription</span>
        </div>
        <div className={`p-2 rounded-xl flex items-center justify-center space-x-1.5 ${analyzing ? 'bg-blue-50 text-blue-700 animate-pulse' : analysisDone ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-500'}`}>
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
          <span>Analyze Document</span>
        </div>
        <div className={`p-2 rounded-xl flex items-center justify-center space-x-1.5 ${extractedMedicines.length > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-500'}`}>
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
          <span>Identify Medicines</span>
        </div>
        <div className={`p-2 rounded-xl flex items-center justify-center space-x-1.5 ${matchingMedicines.length > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>
          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">4</span>
          <span>Request Available</span>
        </div>
      </div>

      {/* Section 1: Upload Prescription Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Upload Veterinary Prescription</h2>
              <p className="text-xs text-slate-500">Upload doctor's prescription (JPG, PNG, WEBP, or PDF) to scan for prescribed medicines</p>
            </div>
          </div>
        </div>

        {!selectedFile ? (
          <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-800 block mb-1">Click to Upload Prescription Document</span>
            <span className="text-[11px] text-slate-500 block mb-2">Supports JPG, PNG, WEBP, PDF (Max 10MB)</span>
            <span className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition">
              Browse System File
            </span>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 min-w-0">
              {filePreview ? (
                <img src={filePreview} alt="Prescription preview" className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl shrink-0">
                  📄
                </div>
              )}
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">{fileName}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Size: {fileSize}</span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold rounded-md inline-block mt-1">
                  Ready for Analysis
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleClearFile}
                className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Change File
              </button>
              <button
                type="button"
                onClick={handleAnalyzePrescription}
                disabled={analyzing}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Prescription...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Analyze Prescription & Find Medicines</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Medical Safety & Disclaimer Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 text-amber-950 rounded-2xl flex items-start space-x-3 text-xs">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-amber-900 mb-0.5">Medical Safety Notice</span>
          <span>
            Prescription information is processed to help identify available medicines from registered medical providers. 
            Always verify the prescription details with a qualified veterinarian or authorized medical provider before requesting or using any medicine.
          </span>
        </div>
      </div>

      {/* Results Section after Analysis */}
      {analysisDone && (
        <div className="space-y-6">
          {/* Identified Medicines Card */}
          <SectionCard
            title="Prescription Identified Medicines"
            subtitle={`System analyzed your prescription and extracted ${extractedMedicines.length} medicine item(s)`}
          >
            {extractedMedicines.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No medicine names could be identified from this prescription document.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {extractedMedicines.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                      item.available
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                        : 'bg-amber-50/60 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0 mr-2">
                      <Pill className={`w-4 h-4 shrink-0 ${item.available ? 'text-emerald-600' : 'text-amber-600'}`} />
                      <span className="truncate font-bold">{item.name}</span>
                    </div>

                    {item.available ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md flex items-center shrink-0">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Available
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-md flex items-center shrink-0">
                        <XCircle className="w-3 h-3 mr-1 text-amber-600" /> Not Currently Available
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Available Matching Medicines Catalog */}
          <SectionCard
            title="Matching Available Medicines Catalog"
            subtitle={`Found ${matchingMedicines.length} in-stock product(s) matching your prescription`}
          >
            {matchingMedicines.length === 0 ? (
              <EmptyState
                title="No Matching Medicines Available"
                description="Prescribed medicines are not currently in stock from registered medical providers. You can try again later or check with a local veterinary clinic."
                icon={Pill}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchingMedicines.map((m) => (
                  <div key={m._id} className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3 text-xs flex flex-col justify-between hover:border-blue-300 transition">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{m.name}</h4>
                          {m.genericName && (
                            <p className="text-[11px] text-slate-400 italic">Generic: {m.genericName}</p>
                          )}
                        </div>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 font-semibold text-[10px] rounded">
                          {m.category}
                        </span>
                      </div>

                      {m.description && (
                        <p className="text-slate-600 text-[11px] line-clamp-2">{m.description}</p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200 space-y-3">
                      <div className="flex items-center justify-between font-mono">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block font-sans">Unit Price</span>
                          <span className="font-bold text-emerald-700 text-sm">₹{m.price?.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-500 font-sans"> / {m.unit}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase block font-sans">In-Stock</span>
                          <span className="font-bold text-slate-800">{m.stockQuantity} {m.unit}s</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-xl border border-slate-200">
                        <div className="flex items-center space-x-1.5 text-slate-600">
                          <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-semibold truncate">{m.medicalProvider?.name || 'Medical Provider'}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{m.medicalProvider?.phone}</span>
                      </div>

                      <button
                        onClick={() => openRequestModal(m)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center justify-center space-x-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Request Medicine</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* Medicine Request Modal (Reusing Existing Medicine Request System) */}
      {selectedMedicine && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Request Medicine</h3>
                <p className="text-xs text-slate-400">Submit a purchase request to provider</p>
              </div>
              <button onClick={() => setSelectedMedicine(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-xs">
              <p className="font-bold text-slate-900 text-sm">{selectedMedicine.name}</p>
              <p className="text-slate-500">Provider: <span className="font-semibold text-slate-700">{selectedMedicine.medicalProvider?.name}</span></p>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-700 font-medium">
                <span>Unit Price: ₹{selectedMedicine.price?.toFixed(2)} / {selectedMedicine.unit}</span>
                <span>Stock: {selectedMedicine.stockQuantity} {selectedMedicine.unit}s</span>
              </div>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Requested Quantity ({selectedMedicine.unit}s)</label>
                <input
                  type="number"
                  min="1"
                  max={selectedMedicine.stockQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Instructions (Optional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Need urgent pickup by morning..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-emerald-900">
                <span className="text-xs font-semibold">Total Calculated Amount:</span>
                <span className="text-base font-bold text-emerald-700 font-mono">
                  ₹{(quantity * (selectedMedicine.price || 0)).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMedicine(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
