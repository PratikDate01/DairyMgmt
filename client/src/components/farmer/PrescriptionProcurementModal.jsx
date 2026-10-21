import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { medicineService } from '../../services/medicineService';
import { createMedicineRequest } from '../../services/medicineRequestService';
import {
  Pill,
  X,
  Building2,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Info,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  MapPin,
  Check
} from 'lucide-react';

export const PrescriptionProcurementModal = ({ vetRequestItem, onClose, onOrderSubmitted }) => {
  const { t } = useTranslation(['farmer', 'common']);
  const { token } = useAuth();

  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogMedicines, setCatalogMedicines] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected item for request confirmation
  const [orderingMedicine, setOrderingMedicine] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [modalError, setModalError] = useState('');

  // Extract prescribed medicines list from VetRequest
  const prescribedList = vetRequestItem?.prescription?.medicines || [
    {
      medicineName: vetRequestItem?.aiCondition || 'General Medicine',
      dosage: 'As prescribed',
      frequency: 'As directed',
      duration: 'Course duration',
      instructions: 'Follow doctor advice'
    }
  ];

  // Fetch Live Available Medicines Catalog
  const fetchCatalog = async () => {
    setLoadingCatalog(true);
    setError('');
    try {
      const data = await medicineService.getAvailableMedicines(token);
      const list = Array.isArray(data) ? data : (data?.medicines || []);
      setCatalogMedicines(list);
    } catch (err) {
      console.error('Error fetching medicine catalog:', err);
      setError(err.message || 'Failed to load live medicine catalog.');
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [token]);

  // Helper: Normalize medicine name for matching
  const normalizeName = (str = '') => {
    return str
      .toLowerCase()
      .replace(/(\d+mg|\d+ml|\d+g|\d+IU|tablet|capsule|syrup|injection|cream|ointment|drops|powder)/gi, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };

  // Match Catalog Items for a Prescribed Medicine Name
  const findMatchesForPrescription = (targetName) => {
    if (!targetName) return [];
    const normTarget = normalizeName(targetName);
    const targetTokens = targetName.toLowerCase().split(/[\s,.-]+/).filter(t => t.length > 2);

    if (!normTarget || normTarget.length < 2) {
      return catalogMedicines.filter(m => (m.availability === 'available' || m.stockQuantity > 0) && m.isActive !== false);
    }

    return catalogMedicines.filter(m => {
      const normCatName = normalizeName(m.name);
      const normGenName = normalizeName(m.genericName || '');
      const catTokens = m.name.toLowerCase().split(/[\s,.-]+/).filter(t => t.length > 2);
      const hasTokenMatch = targetTokens.length > 0 && targetTokens.some(tt => catTokens.some(ct => ct.includes(tt) || tt.includes(ct)));

      return (
        normCatName.includes(normTarget) ||
        normTarget.includes(normCatName) ||
        (normGenName && (normGenName.includes(normTarget) || normTarget.includes(normGenName))) ||
        hasTokenMatch
      );
    });
  };

  // Submit Medicine Order Request
  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    if (!orderingMedicine) return;

    if (quantity <= 0) {
      setModalError('Quantity must be at least 1');
      return;
    }

    if (quantity > orderingMedicine.stockQuantity) {
      setModalError(`Quantity cannot exceed available stock (${orderingMedicine.stockQuantity})`);
      return;
    }

    setSubmittingOrder(true);
    setModalError('');
    try {
      const notesWithRef = `Prescription Order for Cattle Tag: ${vetRequestItem?.cattle?.nameTag || 'Animal'} (Diagnosis: ${vetRequestItem?.finalDiagnosis?.diagnosis || vetRequestItem?.aiCondition}). ${notes.trim()}`;

      const res = await createMedicineRequest(
        {
          medicineId: orderingMedicine._id,
          quantity,
          notes: notesWithRef,
          vetRequestId: vetRequestItem?._id || null
        },
        token
      );

      if (res.success) {
        setSuccessMsg(t('farmer:medicinesProcurement.orderConfirmation', `Medicine request created for ${orderingMedicine.name}. Order sent to ${orderingMedicine.medicalProvider?.name || 'Medical Provider'}.`));
        setOrderingMedicine(null);
        if (onOrderSubmitted) onOrderSubmitted(res.data);
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to submit request');
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 space-y-6 shadow-2xl relative my-6 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 shrink-0 pr-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-slate-900">
                  {t('farmer:medicinesPage.title', 'Prescription Medicine Procurement & Comparison')}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('farmer:medicinesPage.doctorLabel', 'Doctor:')} <strong>Dr. {vetRequestItem?.veterinarian?.name || t('common:roles.veterinarian', 'Veterinarian')}</strong> • {t('common:labels.cattle', 'Patient')}: <strong>{vetRequestItem?.cattle?.nameTag || 'Cattle'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Global Feedback */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center space-x-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Medical Safety Disclaimer */}
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start space-x-2.5 text-amber-950 text-xs shrink-0">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-900 block">
              {t('common:labels.warning', 'Medical Safety Disclaimer')}
            </span>
            <p className="leading-relaxed">
              {t('farmer:medicinesPage.safetyNotice', 'This procurement system identifies matching catalog listings from registered medical providers based on your veterinarian\'s prescription. Always verify medicine names, dosages, and instructions against the original prescription before use.')}
            </p>
          </div>
        </div>

        {/* Scrollable Main Area */}
        <div className="overflow-y-auto space-y-6 pr-1 flex-1 text-xs">
          {/* Section 1: Prescription Reference Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {t('farmer:caseDetailsModal.tabPrescription', 'Prescription Reference Details')}
              </span>
              <span className="text-xs font-mono text-slate-500">
                {t('farmer:medicinesPage.prescriptionDate', 'Prescribed On:')} {vetRequestItem?.prescription?.prescribedAt ? new Date(vetRequestItem.prescription.prescribedAt).toLocaleDateString() : new Date().toLocaleDateString()}
              </span>
            </div>
            <p className="font-extrabold text-slate-900 text-sm">
              {t('farmer:caseDetailsModal.verifiedDiagnosis', 'Diagnosis:')} <span className="text-emerald-700">{vetRequestItem?.finalDiagnosis?.diagnosis || vetRequestItem?.aiCondition || 'General Health Concern'}</span>
            </p>
            {vetRequestItem?.prescription?.generalInstructions && (
              <p className="text-slate-600 italic">
                <strong>{t('veterinarian:clinicalWorkspace.generalInstructions', 'Doctor Instructions:')}</strong> "{vetRequestItem.prescription.generalInstructions}"
              </p>
            )}
          </div>

          {/* Section 2: Prescribed Medicines Breakdown & Catalog Comparison */}
          <div className="space-y-5">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
              <span>{t('veterinarian:clinicalWorkspace.medicinesList', 'Prescribed Medicines')} ({prescribedList.length})</span>
            </h3>

            {loadingCatalog ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                <p>{t('common:actions.loading', 'Loading live medicine catalog and store listings...')}</p>
              </div>
            ) : prescribedList.length === 0 ? (
              <div className="p-8 text-center text-slate-500">{t('common:empty.noData', 'No prescribed medicines listed.')}</div>
            ) : (
              prescribedList.map((prescribedMed, idx) => {
                const matches = findMatchesForPrescription(prescribedMed.medicineName);

                return (
                  <div key={idx} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
                    {/* Prescribed Item Header */}
                    <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-slate-900 text-sm flex items-center space-x-1.5">
                          <Pill className="w-4 h-4 text-purple-600" />
                          <span>{prescribedMed.medicineName}</span>
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1">
                        <p>{t('veterinarian:workspace.dosage', 'Dosage:')} <strong className="text-slate-800">{prescribedMed.dosage || 'As prescribed'}</strong></p>
                        <p>{t('veterinarian:workspace.frequency', 'Frequency:')} <strong className="text-slate-800">{prescribedMed.frequency || 'As directed'}</strong></p>
                        <p>{t('veterinarian:workspace.durationDays', 'Duration:')} <strong className="text-slate-800">{prescribedMed.duration || 'Full course'}</strong></p>
                      </div>
                      {prescribedMed.instructions && (
                        <p className="text-[11px] text-slate-600 italic">{t('common:labels.notes', 'Instructions:')} "{prescribedMed.instructions}"</p>
                      )}
                    </div>

                    {/* Matching Store Items */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                        {t('farmer:medicinesPage.availableMedicines', 'Matching Store Listings')} ({matches.length})
                      </span>

                      {matches.length === 0 ? (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-xs">
                          {t('farmer:medicines.noMedicines', 'No matching medicine found in registered stores.')}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {matches.map((item) => (
                            <div key={item._id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2 flex flex-col justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-bold text-slate-900 text-xs">{item.name}</h5>
                                  <span className="font-extrabold text-blue-700 text-xs">₹{item.price}</span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium flex items-center space-x-1">
                                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{item.medicalProvider?.name || 'Medical Store'}</span>
                                </p>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                  item.stockQuantity > 5 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {t('farmer:medicines.inStock', { stock: item.stockQuantity, defaultValue: `In Stock: ${item.stockQuantity}` })}
                                </span>
                              </div>

                              <button
                                onClick={() => {
                                  setOrderingMedicine(item);
                                  setQuantity(1);
                                  setNotes('');
                                  setModalError('');
                                }}
                                className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs transition flex items-center justify-center space-x-1"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>{t('farmer:medicinesPage.requestDeliveryBtn', 'Order from this Store')}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            {t('common:actions.close', 'Close')}
          </button>
        </div>
      </div>

      {/* CONFIRM ORDER MODAL */}
      {orderingMedicine && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setOrderingMedicine(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-lg font-bold">
                💊
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{orderingMedicine.name}</h3>
                <span className="text-xs text-slate-500">{orderingMedicine.medicalProvider?.name}</span>
              </div>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {modalError}
              </div>
            )}

            <form onSubmit={handleConfirmOrder} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('common:labels.quantity', 'Quantity')}</label>
                <input
                  type="number"
                  min="1"
                  max={orderingMedicine.stockQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('common:labels.notes', 'Delivery / Pickup Notes')}</label>
                <textarea
                  rows="2"
                  placeholder={t('medicalProvider:requestsPage.remarksPlaceholder', 'Specify pickup date, farm address, or contact...')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between font-bold text-slate-800">
                <span>{t('common:labels.totalAmount', 'Total Estimated Amount')}:</span>
                <span className="text-blue-700 font-extrabold">₹{(quantity * orderingMedicine.price).toFixed(2)}</span>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOrderingMedicine(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                >
                  {t('common:actions.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>{submittingOrder ? t('common:actions.processing', 'Sending Order...') : t('common:actions.confirm', 'Confirm Order')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
