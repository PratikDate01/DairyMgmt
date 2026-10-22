import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getStatusLabel } from '../../i18n/statusMap';
import { medicineService } from '../../services/medicineService';
import { createMedicineRequest } from '../../services/medicineRequestService';
import { vetRequestService } from '../../services/vetRequestService';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/EmptyState';
import { PrescriptionProcurementModal } from '../../components/farmer/PrescriptionProcurementModal';
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
  ArrowRight,
  Stethoscope,
  ChevronRight,
  Edit3,
  Check,
  Sparkles,
  HelpCircle,
  Scan,
  Eye
} from 'lucide-react';

export const FarmerMedicines = () => {
  const { t } = useTranslation(['farmer', 'common']);
  const { token } = useAuth();
  const [procurementMode, setProcurementMode] = useState('upload_file'); // 'upload_file' | 'doctor_prescriptions'

  // Recent Doctor Prescriptions (Phase 23 Path A)
  const [recentRequests, setRecentRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectedProcurementReq, setSelectedProcurementReq] = useState(null);

  // Upload & File State (Path B)
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [prescribedMedicinesText, setPrescribedMedicinesText] = useState('');

  // Processing & State Machine (Section E: uploading, scanning, matching, success, no-text-found, unsupported-file, failure)
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle' | 'uploading' | 'scanning' | 'matching' | 'success' | 'no-text-found' | 'unsupported-file' | 'failure'
  const [analyzing, setAnalyzing] = useState(false);
  const [rematching, setRematching] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // OCR Results & Extracted Content (Section B & C & D)
  const [ocrText, setOcrText] = useState('');
  const [ocrConfidence, setOcrConfidence] = useState(0);
  const [isEditingOcr, setIsEditingOcr] = useState(false);
  const [editedOcrText, setEditedOcrText] = useState('');
  const [detectedMedicines, setDetectedMedicines] = useState([]);
  const [matchingMedicines, setMatchingMedicines] = useState([]);
  const [unmatchedMedicines, setUnmatchedMedicines] = useState([]);
  const [extractedMedicines, setExtractedMedicines] = useState([]);

  // Manual Inventory Catalog Search (Section D)
  const [showCatalogSearch, setShowCatalogSearch] = useState(false);
  const [catalogMedicines, setCatalogMedicines] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');

  // Medicine Request Modal State
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Fetch Recent Doctor Consultation Prescriptions
  const fetchRecentRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await vetRequestService.getFarmerRequests(token);
      setRecentRequests(data || []);
    } catch (err) {
      console.error('Error loading recent doctor requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchRecentRequests();
  }, [token]);

  // Load store catalog for manual search
  const loadStoreCatalog = async () => {
    if (catalogMedicines.length > 0) return;
    setLoadingCatalog(true);
    try {
      const res = await medicineService.getAvailableMedicines(token);
      const list = Array.isArray(res) ? res : (res?.medicines || []);
      setCatalogMedicines(list);
    } catch (err) {
      console.error('Failed to load store catalog:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  // Handle Prescription File Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setScanStatus('unsupported-file');
      setError('Unsupported file type. Please upload a genuine JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setScanStatus('unsupported-file');
      setError('File size exceeds 25MB limit. Please upload an image under 25MB.');
      return;
    }

    setError('');
    setSelectedFile(file);
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');
    setScanStatus('idle');
    setOcrText('');
    setEditedOcrText('');
    setDetectedMedicines([]);
    setMatchingMedicines([]);
    setUnmatchedMedicines([]);
    setExtractedMedicines([]);

    const reader = new FileReader();
    reader.onloadstart = () => setScanStatus('uploading');
    reader.onloadend = () => {
      setFilePreview(reader.result);
      setScanStatus('idle');
    };
    reader.readAsDataURL(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileName('');
    setFileSize('');
    setPrescribedMedicinesText('');
    setError('');
    setScanStatus('idle');
    setOcrText('');
    setEditedOcrText('');
    setOcrConfidence(0);
    setIsEditingOcr(false);
    setDetectedMedicines([]);
    setMatchingMedicines([]);
    setUnmatchedMedicines([]);
    setExtractedMedicines([]);
  };

  // Submit Prescription to Genuine OCR Scanning & Inventory Matching
  const handleAnalyzePrescription = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFile || !filePreview) {
      setError('Please select a prescription image file to analyze.');
      return;
    }

    try {
      setAnalyzing(true);
      setError('');
      setScanStatus('scanning');

      const res = await medicineService.processPrescription(token, {
        prescriptionData: filePreview,
        fileName,
        fileType: selectedFile.type,
        prescribedMedicinesText
      });

      const extractedText = res.ocrText || '';
      setOcrText(extractedText);
      setEditedOcrText(extractedText);
      setOcrConfidence(res.ocrConfidence || 0);
      setDetectedMedicines(res.detectedMedicines || []);
      setMatchingMedicines(res.matchingMedicines || []);
      setUnmatchedMedicines(res.unmatchedMedicines || []);
      setExtractedMedicines(res.extractedMedicines || []);

      if (!extractedText && (!res.detectedMedicines || res.detectedMedicines.length === 0)) {
        setScanStatus('no-text-found');
      } else {
        setScanStatus('success');
      }
    } catch (err) {
      console.error('Error analyzing prescription:', err);
      setScanStatus('failure');
      setError(err.message || 'Failed to process prescription image.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Re-match when user manually edits OCR text in Section B
  const handleRematchText = async () => {
    if (!editedOcrText.trim()) {
      setError('Please enter or correct medicine text before re-matching.');
      return;
    }

    try {
      setRematching(true);
      setError('');
      setScanStatus('matching');

      const res = await medicineService.processPrescription(token, {
        correctedText: editedOcrText,
        fileName,
        prescribedMedicinesText
      });

      setOcrText(editedOcrText);
      setDetectedMedicines(res.detectedMedicines || []);
      setMatchingMedicines(res.matchingMedicines || []);
      setUnmatchedMedicines(res.unmatchedMedicines || []);
      setExtractedMedicines(res.extractedMedicines || []);
      setIsEditingOcr(false);
      setScanStatus('success');
      setSuccessMsg('Catalog re-matched with your corrected text successfully.');
    } catch (err) {
      console.error('Error re-matching corrected text:', err);
      setError(err.message || 'Failed to re-match inventory with corrected text.');
      setScanStatus('failure');
    } finally {
      setRematching(false);
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

      const res = await createMedicineRequest(
        {
          medicineId: selectedMedicine._id,
          quantity,
          notes
        },
        token
      );

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

  // Filter catalog medicines for manual store search modal
  const filteredCatalog = catalogMedicines.filter(m => {
    if (!catalogSearchQuery) return true;
    const q = catalogSearchQuery.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.genericName?.toLowerCase().includes(q) ||
      m.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <PageHeader
        title={t('farmer:medicinesPage.title', 'Prescription Medicine Search & Catalog')}
        description={t('farmer:medicines.subtitle', 'Scan your veterinarian prescription using optical character recognition (OCR) to automatically identify prescribed medicines and match available products from registered medical stores.')}
        breadcrumbs={[t('common:nav.home', 'Home'), t('common:roles.farmer', 'Farmer'), t('farmer:medicinesPage.title', 'Prescription Search')]}
        backFallback="/farmer/dashboard"
        actions={
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg flex items-center shadow-xs">
              <Scan className="w-3.5 h-3.5 mr-1 text-blue-600" /> {t('farmer:medicinesPage.prescriptionDriven', 'Pixel OCR Scanner')}
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
          <button onClick={() => setError('')} className="text-red-700 font-bold text-xs">{t('common:actions.dismiss', 'Dismiss')}</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-800 font-bold text-xs">{t('common:actions.dismiss', 'Dismiss')}</button>
        </div>
      )}

      {/* Mode Switcher: Upload Prescription vs Doctor Prescriptions */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setProcurementMode('upload_file')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            procurementMode === 'upload_file'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Scan className="w-4 h-4" />
          <span>{t('farmer:medicinesPage.uploadPrescriptionTab', 'Upload & Scan Prescription Image')}</span>
        </button>
        <button
          type="button"
          onClick={() => setProcurementMode('doctor_prescriptions')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            procurementMode === 'doctor_prescriptions'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>{t('farmer:medicinesPage.doctorPrescriptionsTab', 'My Doctor Prescriptions')} ({recentRequests.filter(r => r.prescription?.medicines?.length > 0).length})</span>
        </button>
      </div>

      {/* MODE A: Doctor Consultation Prescriptions List */}
      {procurementMode === 'doctor_prescriptions' && (
        <div className="space-y-4">
          <SectionCard
            title={t('farmer:medicinesPage.doctorPrescriptionsTab', 'Completed Consultation Prescriptions')}
            subtitle={t('farmer:medicinesPage.noPrescriptionsDesc', 'Digital prescriptions issued by licensed veterinarians')}
          >
            {loadingRequests ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                <span>{t('farmer:medicinesPage.loadingRequests', 'Loading doctor consultation prescriptions...')}</span>
              </div>
            ) : recentRequests.filter(r => r.prescription?.medicines?.length > 0).length === 0 ? (
              <EmptyState
                title={t('farmer:medicinesPage.noPrescriptionsFound', 'No Doctor Prescriptions Found')}
                description={t('farmer:medicinesPage.noPrescriptionsDesc', 'When a licensed veterinarian completes a case examination and prescribes medicines, they will appear here.')}
                icon={FileText}
              />
            ) : (
              <div className="space-y-3">
                {recentRequests
                  .filter(r => r.prescription?.medicines?.length > 0)
                  .map((req) => (
                    <div
                      key={req._id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {req.cattle?.nameTag || req.animalIdTag || 'Cattle'}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">
                            {req.aiCondition || req.prescription?.diagnosis || 'Veterinary Rx'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          {t('farmer:medicinesPage.doctorLabel', 'Doctor:')} <strong className="text-slate-800">{req.veterinarian?.name || 'Dr. Assigned'}</strong> • {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {req.prescription?.medicines?.map((m, i) => (
                            <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[10px] rounded font-medium">
                              💊 {m.medicineName || m.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedProcurementReq(req)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{t('farmer:medicinesPage.orderMedicinesBtn', 'Procure Prescribed Medicines')}</span>
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* MODE B: Upload Prescription & Real OCR Scanning Workflow */}
      {procurementMode === 'upload_file' && (
        <div className="space-y-6">
          {/* Step Workflow Indicator */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs text-xs font-semibold text-center">
            <div className={`p-2 rounded-xl flex items-center justify-center space-x-1.5 ${selectedFile ? 'bg-blue-50 text-blue-700 font-bold' : 'bg-slate-50 text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
              <span>{t('farmer:medicines.uploadDocument', 'Upload Prescription')}</span>
            </div>
            <div className={`p-2 rounded-xl flex items-center justify-center space-x-1.5 ${scanStatus === 'scanning' ? 'bg-blue-50 text-blue-700 animate-pulse font-bold' : ocrText ? 'bg-blue-50 text-blue-700 font-bold' : 'bg-slate-50 text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
              <span>{t('farmer:medicines.analyzeFile', 'OCR Pixel Extraction')}</span>
            </div>
            <div className={`p-2 rounded-xl flex items-center justify-center space-x-1.5 ${detectedMedicines.length > 0 ? 'bg-blue-50 text-blue-700 font-bold' : 'bg-slate-50 text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
              <span>{t('farmer:medicines.extractMedicines', 'Catalog Matching')}</span>
            </div>
            <div className={`p-2 rounded-xl flex items-center justify-center space-x-1.5 ${matchingMedicines.length > 0 ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-slate-50 text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">4</span>
              <span>{t('farmer:medicines.requestAvailable', 'Request Available')}</span>
            </div>
          </div>

          {/* Upload Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Scan className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{t('farmer:medicines.uploadPrescription', 'Upload Veterinary Prescription Document')}</h2>
                  <p className="text-xs text-slate-500">Optical Character Recognition reads the actual text printed or written inside the image pixels</p>
                </div>
              </div>
            </div>

            {!selectedFile ? (
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-800 block mb-1">{t('farmer:medicines.clickUploadPrompt', 'Click to Upload Prescription Image')}</span>
                <span className="text-[11px] text-slate-500 block mb-2">Supports JPG, PNG, WEBP (Max 25MB)</span>
                <span className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition">
                  {t('farmer:medicines.browseSystemFile', 'Browse Image File')}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="space-y-3">
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
                        {scanStatus === 'scanning' ? 'Running OCR...' : scanStatus === 'matching' ? 'Matching Inventory...' : scanStatus === 'success' ? 'OCR Analysis Complete' : 'Ready for OCR Scanning'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition"
                    >
                      {t('farmer:medicines.changeFile', 'Change Image')}
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
                          <span>Extracting Pixels via OCR...</span>
                        </>
                      ) : (
                        <>
                          <Scan className="w-4 h-4" />
                          <span>Scan Image Text & Match Store</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Optional doctor instructions note */}
                <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Optional Doctor Notes / Supplement:</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">Adds context if handwriting is partially blurred</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Optional: Enter any handwritten notes or specific dosage instructions..."
                    value={prescribedMedicinesText}
                    onChange={(e) => setPrescribedMedicinesText(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section E: Processing States */}
          {scanStatus === 'scanning' && (
            <div className="p-6 bg-blue-50/80 border border-blue-200 rounded-2xl text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <div>
                <h3 className="font-bold text-blue-950 text-sm">Optical Character Recognition (OCR) in Progress</h3>
                <p className="text-xs text-blue-700 mt-1 max-w-md mx-auto">
                  Reading image pixels with Tesseract.js, detecting veterinary medicine names, strengths, and dosages, then searching the Medical Store database...
                </p>
              </div>
            </div>
          )}

          {scanStatus === 'matching' && (
            <div className="p-6 bg-blue-50/80 border border-blue-200 rounded-2xl text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <div>
                <h3 className="font-bold text-blue-950 text-sm">Matching Inventory Catalog</h3>
                <p className="text-xs text-blue-700 mt-1">Comparing corrected medicine terms with Medical Store inventory...</p>
              </div>
            </div>
          )}

          {scanStatus === 'no-text-found' && (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-950 text-xs">No Legible Text Detected in Image</h4>
                  <p className="text-xs text-amber-800">
                    The OCR engine could not identify printed or high-contrast text in this image. This usually happens if the photo is blurry, dark, or has low resolution.
                  </p>
                  <p className="text-xs text-amber-900 font-semibold pt-1">
                    You can manually type the prescribed medicine names below to find them in store inventory:
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <textarea
                  rows={3}
                  value={editedOcrText}
                  onChange={(e) => setEditedOcrText(e.target.value)}
                  placeholder="Type prescribed medicine names here (e.g. Mastitis Ointment, Vitamin B-Complex Injection, Meloxicam)..."
                  className="w-full p-3 bg-white border border-amber-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
                <button
                  type="button"
                  onClick={handleRematchText}
                  disabled={rematching || !editedOcrText.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {rematching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Find Typed Medicines in Store Inventory</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION A, B, C, D: RESULTS PRESENTATION */}
          {(scanStatus === 'success' || (ocrText && detectedMedicines.length > 0)) && (
            <div className="space-y-6">
              {/* SECTION A: Uploaded Prescription Reference */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span>Section A: Uploaded Prescription Reference</span>
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Scanned via Pixel OCR
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {filePreview && (
                    <img
                      src={filePreview}
                      alt="Uploaded prescription"
                      className="w-24 h-24 object-cover rounded-xl border border-slate-200 shrink-0 shadow-xs"
                    />
                  )}
                  <div className="space-y-1 text-xs text-slate-600 w-full">
                    <p className="font-bold text-slate-900">
                      Original File: <span className="font-mono text-blue-700">{fileName}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 italic">
                      Notice: Filename is for user reference only. Detection is strictly driven by image pixels.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-medium rounded">
                        Size: {fileSize}
                      </span>
                      {ocrConfidence > 0 && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded">
                          OCR Confidence: {Math.round(ocrConfidence)}%
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-semibold rounded">
                        Engine: Tesseract.js (eng+mar)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION B: Extracted OCR Text & Manual Correction */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Section B: Extracted Text from Prescription Pixels
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingOcr(!isEditingOcr);
                      if (!isEditingOcr) setEditedOcrText(ocrText);
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3 text-slate-600" />
                    <span>{isEditingOcr ? 'Cancel Editing' : 'Edit / Correct OCR Text'}</span>
                  </button>
                </div>

                {!isEditingOcr ? (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {ocrText || '(No text extracted)'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500">
                      Modify any misread characters or add missing medicines, then click re-match:
                    </p>
                    <textarea
                      rows={4}
                      value={editedOcrText}
                      onChange={(e) => setEditedOcrText(e.target.value)}
                      className="w-full p-3 bg-white border border-blue-300 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingOcr(false)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleRematchText}
                        disabled={rematching}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                      >
                        {rematching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Re-match with Inventory</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION C: Detected Medicines */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-1.5">
                    <Pill className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Section C: Detected Medicines & Inventory Matches
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {detectedMedicines.filter(m => m.matchStatus !== 'unmatched').length} matched candidate(s)
                  </span>
                </div>

                {detectedMedicines.filter(m => m.matchStatus !== 'unmatched').length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    No matching medicines detected in store inventory for the extracted terms. See Section D below for unmatched items.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {detectedMedicines
                      .filter(item => item.matchStatus !== 'unmatched')
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3 text-xs flex flex-col justify-between hover:border-blue-300 transition"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Extracted from Image</span>
                                <h4 className="font-bold text-slate-900 text-sm">{item.candidateName}</h4>
                                {item.strength && (
                                  <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono font-semibold mr-1">
                                    Strength: {item.strength}
                                  </span>
                                )}
                                {item.dosage && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium">
                                    Dosage: {item.dosage}
                                  </span>
                                )}
                              </div>

                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-md shrink-0 flex items-center ${
                                  item.matchStatus === 'exact'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {item.matchStatus === 'exact' ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Exact Match
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3 h-3 mr-1 text-blue-600" /> Possible Match ({item.confidence}%)
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Stored Database Match */}
                            {item.matchedMedicine && (
                              <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-slate-800">{item.matchedMedicine.name}</span>
                                  <span className="text-[10px] font-mono font-bold text-emerald-700">₹{item.matchedMedicine.price?.toFixed(2)}</span>
                                </div>
                                {item.matchedMedicine.genericName && (
                                  <p className="text-[10px] text-slate-400 italic">Generic: {item.matchedMedicine.genericName}</p>
                                )}
                                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                                  <span>{item.matchedMedicine.isAvailable ? `In Stock: ${item.matchedMedicine.stockQuantity} ${item.matchedMedicine.unit}s` : 'Out of Stock'}</span>
                                  <span>{item.matchedMedicine.medicalProvider?.name || 'Medical Provider'}</span>
                                </div>
                              </div>
                            )}

                            {item.matchNote && (
                              <p className="text-[10px] text-slate-500 italic">ℹ️ {item.matchNote}</p>
                            )}
                          </div>

                          {/* Direct Purchase / Request Button */}
                          {item.matchedMedicine && item.matchedMedicine.isAvailable && (
                            <button
                              onClick={() => openRequestModal(item.matchedMedicine)}
                              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center justify-center space-x-1.5"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>{t('farmer:medicines.requestMedicineModalTitle', 'Request Medicine')}</span>
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* SECTION D: Unmatched Medicines & Manual Inventory Search */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Section D: Unmatched Medicines
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      loadStoreCatalog();
                      setShowCatalogSearch(true);
                    }}
                    className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Store Inventory Manually</span>
                  </button>
                </div>

                {unmatchedMedicines.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    All detected medicine candidates were matched to store records.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-xs text-slate-600">
                      The following medicine names extracted from the prescription could not be matched to available items in the registered medical store catalog:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {unmatchedMedicines.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-950 truncate">{item.candidateName}</span>
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">
                              Not in Store
                            </span>
                          </div>
                          {(item.dosage || item.strength) && (
                            <p className="text-[10px] text-amber-800 font-mono">
                              {[item.strength, item.dosage, item.frequency].filter(Boolean).join(' • ')}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setCatalogSearchQuery(item.candidateName);
                              loadStoreCatalog();
                              setShowCatalogSearch(true);
                            }}
                            className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 pt-1"
                          >
                            <Search className="w-3 h-3" />
                            <span>Find Alternative in Inventory</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Catalog Search Drawer / Modal (Section D) */}
      {showCatalogSearch && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Medical Store Inventory Search</h3>
                <p className="text-xs text-slate-500">Search and request any available medicine directly from registered medical stores</p>
              </div>
              <button onClick={() => setShowCatalogSearch(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by brand name, generic name, or category..."
                value={catalogSearchQuery}
                onChange={(e) => setCatalogSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {loadingCatalog ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                  <span>Loading store catalog...</span>
                </div>
              ) : filteredCatalog.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No medicines match your search.</p>
              ) : (
                filteredCatalog.map((med) => (
                  <div
                    key={med._id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:border-blue-300 transition"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{med.name}</span>
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded font-medium">{med.category}</span>
                      </div>
                      {med.genericName && (
                        <p className="text-[10px] text-slate-400 italic">Generic: {med.genericName}</p>
                      )}
                      <p className="text-[10px] text-slate-500">
                        ₹{med.price?.toFixed(2)} / {med.unit} • In Stock: {med.stockQuantity} • Provider: {med.medicalProvider?.name}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowCatalogSearch(false);
                        openRequestModal(med);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shrink-0"
                    >
                      Request
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCatalogSearch(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Medicine Request Modal (Reusing Existing Medicine Request System) */}
      {selectedMedicine && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 my-auto max-h-[90vh] overflow-y-auto modal-animate">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{t('farmer:medicines.requestMedicineModalTitle', 'Request Medicine')}</h3>
                <p className="text-xs text-slate-400">{t('farmer:medicines.requestMedicineModalSubtitle', 'Submit a purchase request to provider')}</p>
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
              <p className="text-slate-500">{t('farmer:medicines.provider', 'Provider')}: <span className="font-semibold text-slate-700">{selectedMedicine.medicalProvider?.name}</span></p>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-700 font-medium">
                <span>{t('common:fields.price', 'Unit Price')}: ₹{selectedMedicine.price?.toFixed(2)} / {selectedMedicine.unit}</span>
                <span>{t('farmer:medicines.inStock', { stock: selectedMedicine.stockQuantity, defaultValue: 'Stock' })}</span>
              </div>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('common:fields.quantity', 'Requested Quantity')} ({selectedMedicine.unit}s)</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('farmer:medicines.notesInstructions', 'Notes / Instructions (Optional)')}</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('farmer:medicines.notesPlaceholder', 'e.g. Need urgent pickup by morning...')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-emerald-900">
                <span className="text-xs font-semibold">{t('farmer:medicines.totalCalculatedAmount', 'Total Calculated Amount:')}</span>
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
                  {t('common:actions.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('farmer:medicines.submittingRequest', 'Submitting...')}</span>
                    </>
                  ) : (
                    <span>{t('farmer:medicines.submitRequestBtn', 'Submit Request')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Phase 24 Prescription Procurement Modal */}
      {selectedProcurementReq && (
        <PrescriptionProcurementModal
          vetRequestItem={selectedProcurementReq}
          onClose={() => setSelectedProcurementReq(null)}
          onOrderSubmitted={() => {
            fetchRecentRequests();
          }}
        />
      )}
    </div>
  );
};
