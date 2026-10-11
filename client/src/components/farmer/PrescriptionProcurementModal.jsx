import { useState, useEffect } from 'react';
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
      setCatalogMedicines(data || []);
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
    if (!normTarget || normTarget.length < 2) {
      return catalogMedicines.filter(m => m.availability === 'available');
    }

    return catalogMedicines.filter(m => {
      const normCatName = normalizeName(m.name);
      const normGenName = normalizeName(m.genericName || '');
      return (
        normCatName.includes(normTarget) ||
        normTarget.includes(normCatName) ||
        (normGenName && (normGenName.includes(normTarget) || normTarget.includes(normGenName)))
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

      const res = await createMedicineRequest({
        medicineId: orderingMedicine._id,
        quantity,
        notes: notesWithRef,
        vetRequestId: vetRequestItem?._id || null
      });

      if (res.success) {
        setSuccessMsg(`Medicine request created for ${orderingMedicine.name}. Order sent to ${orderingMedicine.medicalProvider?.name || 'Medical Provider'}.`);
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
                <h2 className="text-base font-extrabold text-slate-900">Prescription Medicine Procurement & Comparison</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                  Phase 24 Integration
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Doctor: <strong>Dr. {vetRequestItem?.veterinarian?.name || 'Veterinarian'}</strong> • Patient: <strong>{vetRequestItem?.cattle?.nameTag || 'Cattle'}</strong>
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
            <span className="font-bold text-amber-900 block">Medical Safety Disclaimer</span>
            <p className="leading-relaxed">
              This procurement system identifies matching catalog listings from registered medical providers based on your veterinarian's prescription. Always verify medicine names, dosages, and instructions against the original prescription before use.
            </p>
          </div>
        </div>

        {/* Scrollable Main Area */}
        <div className="overflow-y-auto space-y-6 pr-1 flex-1 text-xs">
          {/* Section 1: Prescription Reference Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Prescription Reference Details</span>
              <span className="text-xs font-mono text-slate-500">
                Issued: {vetRequestItem?.prescription?.prescribedAt ? new Date(vetRequestItem.prescription.prescribedAt).toLocaleDateString() : new Date().toLocaleDateString()}
              </span>
            </div>
            <p className="font-extrabold text-slate-900 text-sm">
              Diagnosis: <span className="text-emerald-700">{vetRequestItem?.finalDiagnosis?.diagnosis || vetRequestItem?.aiCondition || 'General Health Concern'}</span>
            </p>
            {vetRequestItem?.prescription?.generalInstructions && (
              <p className="text-slate-600 italic">
                <strong>Doctor Instructions:</strong> "{vetRequestItem.prescription.generalInstructions}"
              </p>
            )}
          </div>

          {/* Section 2: Prescribed Medicines Breakdown & Catalog Comparison */}
          <div className="space-y-5">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
              <span>Prescribed Medicines ({prescribedList.length})</span>
              <span className="text-xs font-normal text-slate-500">(Matching with Live Registered Medical Providers)</span>
            </h3>

            {loadingCatalog ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                <p>Loading live medicine catalog and store listings...</p>
              </div>
            ) : prescribedList.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No prescribed medicines listed.</div>
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
                          Prescribed Item #{idx + 1}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1">
                        <p>Dosage: <strong className="text-slate-800">{prescribedMed.dosage || 'As prescribed'}</strong></p>
                        <p>Frequency: <strong className="text-slate-800">{prescribedMed.frequency || 'As directed'}</strong></p>
                        <p>Duration: <strong className="text-slate-800">{prescribedMed.duration || 'Full course'}</strong></p>
                      </div>
                      {prescribedMed.instructions && (
                        <p className="text-[11px] text-slate-600 italic">Instructions: "{prescribedMed.instructions}"</p>
                      )}
                    </div>

                    {/* Catalog Comparison List */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        Matching Medical Store Listings ({matches.length})
                      </span>

                      {matches.length === 0 ? (
                        <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500 text-xs">
                          🔴 No matching in-stock medicine listings found for "{prescribedMed.medicineName}" from registered medical providers.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {matches.map(m => (
                            <div
                              key={m._id}
                              className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between hover:border-purple-300 transition"
                            >
                              <div className="space-y-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h5 className="font-bold text-slate-900">{m.name}</h5>
                                    {m.genericName && (
                                      <p className="text-[10px] text-slate-400 italic">Generic: {m.genericName}</p>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-extrabold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                    ₹{m.price?.toFixed(2)}
                                  </span>
                                </div>

                                <div className="flex items-center space-x-1.5 text-[11px] text-slate-600 pt-1">
                                  <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                  <span className="font-bold truncate">{m.medicalProvider?.name || 'Medical Provider Store'}</span>
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                                  <span className="flex items-center space-x-1">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    <span>Distance unavailable</span>
                                  </span>
                                  <span className="font-semibold text-slate-700">Stock: {m.stockQuantity} {m.unit}s</span>
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  setOrderingMedicine(m);
                                  setQuantity(1);
                                  setNotes('');
                                  setModalError('');
                                }}
                                className="w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition flex items-center justify-center space-x-1.5 shadow-xs"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>Request from Store</span>
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
            Close Workspace
          </button>
        </div>

        {/* ORDER CONFIRMATION SUB-MODAL */}
        {orderingMedicine && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative">
              <button
                onClick={() => setOrderingMedicine(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
                  💊
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Confirm Medicine Request</h3>
                  <p className="text-xs text-slate-500">Provider: {orderingMedicine.medicalProvider?.name}</p>
                </div>
              </div>

              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <p className="font-extrabold text-slate-900">{orderingMedicine.name}</p>
                <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                  <span>Unit Price: <strong>₹{orderingMedicine.price?.toFixed(2)} / {orderingMedicine.unit}</strong></span>
                  <span>Available Stock: <strong>{orderingMedicine.stockQuantity} {orderingMedicine.unit}s</strong></span>
                </div>
              </div>

              <form onSubmit={handleConfirmOrder} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity ({orderingMedicine.unit}s)</label>
                  <input
                    type="number"
                    min="1"
                    max={orderingMedicine.stockQuantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Order Notes / Delivery Instructions</label>
                  <textarea
                    rows="2"
                    placeholder="e.g. Please keep ready for morning pickup..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between font-bold text-purple-950">
                  <span>Total Estimated Amount:</span>
                  <span className="text-base text-purple-700 font-mono">₹{(quantity * (orderingMedicine.price || 0)).toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setOrderingMedicine(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingOrder}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    {submittingOrder ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirm Medicine Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
