import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { medicineService } from '../../services/medicineService';
import { createMedicineRequest } from '../../services/medicineRequestService';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Pill,
  Search,
  RefreshCw,
  AlertCircle,
  Building2,
  CheckCircle,
  ShoppingBag,
  X
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  'Antibiotic',
  'Supplement',
  'Dewormer',
  'Antiseptic',
  'Vaccine',
  'Pain Relief',
  'Vitamin',
  'Other'
];

export const FarmerMedicines = () => {
  const { token } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Request Modal State
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchCatalog = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        search,
        category: selectedCategory,
        page,
        limit: 12
      };
      const res = await medicineService.getAvailableMedicines(token, params);
      setMedicines(res.medicines || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch available medicine catalog');
    } finally {
      setLoading(false);
    }
  }, [token, search, selectedCategory, page]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const openRequestModal = (med) => {
    setSelectedMedicine(med);
    setQuantity(1);
    setNotes('');
    setModalError('');
  };

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
        setSuccessMsg(`Medicine request submitted for ${selectedMedicine.name}. Provider will process your request.`);
        setSelectedMedicine(null);
        fetchCatalog();
      }
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Available Medical Directory & Catalog"
        description="View veterinary medicines and request products directly from registered medical providers."
        breadcrumbs={['Home', 'Farmer Portal', 'Medicines Catalog']}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchCatalog}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Directory</span>
            </button>
          </div>
        }
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-800 font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900 font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search medicine name, generic name, or category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Medicine Grid */}
      <SectionCard
        title="Available Medicines & Supplies Catalog"
        subtitle={`Showing ${medicines.length} in-stock available medicines`}
      >
        {loading ? (
          <div className="py-8 text-center text-slate-500 text-xs">Loading available catalog...</div>
        ) : medicines.length === 0 ? (
          <EmptyState
            title="No Available Medicines Found"
            description="No in-stock medicines match your search criteria at this time."
            icon={Pill}
          />
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {medicines.map((m) => (
                <div key={m._id} className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3 text-xs flex flex-col justify-between">
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
                        <span className="text-[10px] text-slate-400 uppercase block font-sans">Price</span>
                        <span className="font-bold text-emerald-700 text-sm">₹{m.price?.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-500 font-sans"> / {m.unit}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase block font-sans">Available Stock</span>
                        <span className="font-bold text-slate-800">{m.stockQuantity} {m.unit}s</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                      <div className="flex items-center space-x-1.5 text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="font-semibold truncate">{m.medicalProvider?.name || 'Medical Provider'}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{m.medicalProvider?.phone}</span>
                    </div>

                    <button
                      onClick={() => openRequestModal(m)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-xs transition flex items-center justify-center space-x-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Request Medicine</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Page {page} of {totalPages}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-slate-100 text-slate-700 font-semibold rounded hover:bg-slate-200 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 bg-slate-100 text-slate-700 font-semibold rounded hover:bg-slate-200 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* Medicine Request Modal */}
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
