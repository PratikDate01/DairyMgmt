import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { medicineService } from '../../services/medicineService';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { StatCard } from '../../components/common/StatCard';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Pill,
  PlusCircle,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Edit,
  Package,
  AlertTriangle,
  Power
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

const UNIT_OPTIONS = [
  'tablet',
  'capsule',
  'syrup',
  'injection',
  'cream',
  'ointment',
  'drops',
  'powder',
  'other'
];

export const Inventory = () => {
  const { token } = useAuth();

  // Summary Metrics
  const [summary, setSummary] = useState({
    totalMedicines: 0,
    activeMedicines: 0,
    availableMedicines: 0,
    unavailableMedicines: 0,
    outOfStockMedicines: 0,
    lowStockMedicines: 0,
    totalStockUnits: 0
  });

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState('');
  const [selectedActiveStatus, setSelectedActiveStatus] = useState('true');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // List State
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);

  const [showStockModal, setShowStockModal] = useState(false);
  const [stockTargetItem, setStockTargetItem] = useState(null);
  const [newStockVal, setNewStockVal] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formGeneric, setFormGeneric] = useState('');
  const [formCategory, setFormCategory] = useState('Antibiotic');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formUnit, setFormUnit] = useState('tablet');
  const [formAvailability, setFormAvailability] = useState('available');

  const fetchSummary = useCallback(async () => {
    try {
      const res = await medicineService.getInventorySummary(token);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.warn('Failed to fetch summary:', err.message);
    }
  }, [token]);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        search,
        category: selectedCategory,
        availability: selectedAvailability,
        isActive: selectedActiveStatus !== 'all' ? selectedActiveStatus : undefined,
        lowStock: onlyLowStock ? 'true' : undefined,
        page,
        limit: 15
      };

      const res = await medicineService.getMyMedicines(token, params);
      setMedicines(res.medicines || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  }, [token, search, selectedCategory, selectedAvailability, selectedActiveStatus, onlyLowStock, page]);

  useEffect(() => {
    fetchSummary();
    fetchInventory();
  }, [fetchSummary, fetchInventory]);

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedAvailability('');
    setSelectedActiveStatus('true');
    setOnlyLowStock(false);
    setPage(1);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingMedicine(null);
    setFormName('');
    setFormGeneric('');
    setFormCategory('Antibiotic');
    setFormDescription('');
    setFormPrice('');
    setFormStock('10');
    setFormUnit('tablet');
    setFormAvailability('available');
    setShowAddEditModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item) => {
    setEditingMedicine(item);
    setFormName(item.name || '');
    setFormGeneric(item.genericName || '');
    setFormCategory(item.category || 'Antibiotic');
    setFormDescription(item.description || '');
    setFormPrice(item.price ? item.price.toString() : '0');
    setFormStock(item.stockQuantity !== undefined ? item.stockQuantity.toString() : '0');
    setFormUnit(item.unit || 'tablet');
    setFormAvailability(item.availability || 'available');
    setShowAddEditModal(true);
  };

  // Save Add/Edit
  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    setError('');

    if (!formName || formName.trim().length < 2) {
      setError('Medicine name is required (at least 2 characters).');
      return;
    }

    if (!formCategory) {
      setError('Please select a category.');
      return;
    }

    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Price must be a valid non-negative number.');
      return;
    }

    const stockNum = parseInt(formStock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setError('Stock quantity must be a valid non-negative number.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formName,
        genericName: formGeneric,
        category: formCategory,
        description: formDescription,
        price: priceNum,
        stockQuantity: stockNum,
        unit: formUnit,
        availability: formAvailability
      };

      if (editingMedicine) {
        await medicineService.updateMedicine(editingMedicine._id, payload, token);
        setSuccessMsg('Medicine details updated successfully!');
      } else {
        await medicineService.createMedicine(payload, token);
        setSuccessMsg('New medicine added to inventory!');
      }

      setShowAddEditModal(false);
      await fetchSummary();
      await fetchInventory();
    } catch (err) {
      setError(err.message || 'Failed to save medicine entry.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Stock Modal
  const handleOpenStockModal = (item) => {
    setStockTargetItem(item);
    setNewStockVal(item.stockQuantity ? item.stockQuantity.toString() : '0');
    setShowStockModal(true);
  };

  // Save Stock Update
  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (!stockTargetItem) return;

    const val = parseInt(newStockVal, 10);
    if (isNaN(val) || val < 0) {
      setError('Stock quantity must be a non-negative number.');
      return;
    }

    try {
      setSubmitting(true);
      await medicineService.updateStock(stockTargetItem._id, val, token);
      setSuccessMsg(`Stock updated for ${stockTargetItem.name}!`);
      setShowStockModal(false);
      await fetchSummary();
      await fetchInventory();
    } catch (err) {
      setError(err.message || 'Failed to update stock quantity.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Availability
  const handleToggleAvailability = async (item) => {
    const nextVal = item.availability === 'available' ? 'unavailable' : 'available';

    if (nextVal === 'available' && item.stockQuantity === 0) {
      setError('Cannot mark an item with zero stock as available. Please update stock quantity first.');
      return;
    }

    try {
      await medicineService.updateAvailability(item._id, nextVal, token);
      setSuccessMsg(`Availability updated for ${item.name}!`);
      await fetchSummary();
      await fetchInventory();
    } catch (err) {
      setError(err.message || 'Failed to update availability status.');
    }
  };

  // Deactivate Medicine
  const handleDeactivate = async (item) => {
    if (!window.confirm(`Are you sure you want to deactivate ${item.name}? It will be hidden from active catalog views.`)) {
      return;
    }

    try {
      await medicineService.deactivateMedicine(item._id, token);
      setSuccessMsg(`${item.name} has been deactivated.`);
      await fetchSummary();
      await fetchInventory();
    } catch (err) {
      setError(err.message || 'Failed to deactivate medicine.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medical Inventory Management"
        description="Manage medicines, track stock levels, and set product availability for your medical store."
        breadcrumbs={['Home', 'Medical Console', 'Inventory']}
        actions={
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Medicine</span>
          </button>
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
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-green-600 hover:text-green-800 font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Medicines"
          value={`${summary.totalMedicines} Items`}
          icon={Pill}
          badgeText={`${summary.totalStockUnits} Total Units`}
          badgeType="neutral"
        />
        <StatCard
          title="Available in Catalog"
          value={`${summary.availableMedicines} Items`}
          icon={CheckCircle2}
          badgeText="Active & In-Stock"
          badgeType="success"
        />
        <StatCard
          title="Out of Stock"
          value={`${summary.outOfStockMedicines} Items`}
          icon={XCircle}
          badgeText={summary.outOfStockMedicines > 0 ? 'Action Required' : 'All In Stock'}
          badgeType={summary.outOfStockMedicines > 0 ? 'red' : 'success'}
        />
        <StatCard
          title="Low Stock Warning"
          value={`${summary.lowStockMedicines} Items`}
          icon={AlertTriangle}
          badgeText={`Stock ≤ ${summary.lowStockThreshold || 10}`}
          badgeType={summary.lowStockMedicines > 0 ? 'amber' : 'success'}
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-center">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, generic, category..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
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

          {/* Availability */}
          <div>
            <select
              value={selectedAvailability}
              onChange={(e) => {
                setSelectedAvailability(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Availability</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          {/* Active Status */}
          <div>
            <select
              value={selectedActiveStatus}
              onChange={(e) => {
                setSelectedActiveStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="true">Active Items Only</option>
              <option value="false">Deactivated Items Only</option>
              <option value="all">All Items</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <label className="flex items-center space-x-2 font-semibold text-amber-800 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(e) => {
                setOnlyLowStock(e.target.checked);
                setPage(1);
              }}
              className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
            />
            <span>Show Low Stock Items Only (Stock ≤ 10)</span>
          </label>

          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <SectionCard
        title="Medicine Inventory Register"
        subtitle={`Showing ${medicines.length} medicine entries`}
        action={
          <button
            onClick={fetchInventory}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        }
      >
        {loading ? (
          <div className="py-8 text-center text-slate-500 text-xs">Loading medicine inventory...</div>
        ) : medicines.length === 0 ? (
          <EmptyState
            title="No Medicine Records Found"
            description="No items match your filter criteria or no medicines have been added yet."
            icon={Pill}
          />
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Medicine Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Price (₹)</th>
                    <th className="py-3 px-4 text-right">Stock</th>
                    <th className="py-3 px-4 text-center">Unit</th>
                    <th className="py-3 px-4 text-center">Availability</th>
                    <th className="py-3 px-4 text-center">Active Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {medicines.map((m) => {
                    const isLowStock = m.stockQuantity > 0 && m.stockQuantity <= 10;
                    const isOutOfStock = m.stockQuantity === 0;

                    return (
                      <tr key={m._id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{m.name}</div>
                          {m.genericName && (
                            <div className="text-[10px] text-slate-400 italic">Generic: {m.genericName}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                            {m.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                          ₹{m.price?.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          <div className="inline-flex items-center space-x-1.5">
                            <span className="font-bold text-slate-900">{m.stockQuantity}</span>
                            {isOutOfStock && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800">
                                Out of Stock
                              </span>
                            )}
                            {isLowStock && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                                Low Stock
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center capitalize font-mono text-[11px] text-slate-500">
                          {m.unit}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleAvailability(m)}
                            disabled={!m.isActive}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                              m.availability === 'available'
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                            title="Click to toggle availability"
                          >
                            {m.availability}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              m.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {m.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleOpenEditModal(m)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Details"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenStockModal(m)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Update Stock"
                            >
                              <Package className="w-4 h-4" />
                            </button>
                            {m.isActive && (
                              <button
                                onClick={() => handleDeactivate(m)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                title="Deactivate Item"
                              >
                                <Power className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3">
              {medicines.map((m) => (
                <div key={m._id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{m.name}</h4>
                      {m.genericName && <p className="text-[11px] text-slate-400 italic">{m.genericName}</p>}
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded">
                        {m.category}
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-emerald-700 text-sm">₹{m.price?.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-500">per {m.unit}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2 border-y border-slate-200 font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-sans">Stock Quantity</span>
                      <span className="font-bold text-slate-900">{m.stockQuantity} {m.unit}s</span>
                    </div>
                    <div>
                      {m.stockQuantity === 0 && <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded">OUT OF STOCK</span>}
                      {m.stockQuantity > 0 && m.stockQuantity <= 10 && <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">LOW STOCK</span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleToggleAvailability(m)}
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        m.availability === 'available' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {m.availability}
                    </button>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleOpenEditModal(m)} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded hover:bg-blue-100">
                        Edit
                      </button>
                      <button onClick={() => handleOpenStockModal(m)} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded hover:bg-emerald-100">
                        Stock
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
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

      {/* ADD / EDIT MEDICINE MODAL */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Pill className="w-5 h-5 text-blue-600" />
                <span>{editingMedicine ? 'Edit Medicine Entry' : 'Add New Medicine Entry'}</span>
              </h3>
              <button onClick={() => setShowAddEditModal(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMedicine} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Medicine Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Amoxicillin 500mg"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Generic Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Amoxicillin Trihydrate"
                    value={formGeneric}
                    onChange={(e) => setFormGeneric(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="e.g. 45.00"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Unit Type *</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u} className="capitalize">{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 100"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Initial Availability *</label>
                  <select
                    value={formAvailability}
                    onChange={(e) => setFormAvailability(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Description / Usage Notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Broad-spectrum antibiotic for livestock treatment"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  <span>{submitting ? 'Saving...' : editingMedicine ? 'Update Medicine' : 'Add Medicine'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK UPDATE MODAL */}
      {showStockModal && stockTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <span>Update Stock Quantity</span>
              </h3>
              <button onClick={() => setShowStockModal(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">{stockTargetItem.name}</div>
                <div className="text-[11px] text-slate-500">Current Stock: <span className="font-mono font-bold text-slate-800">{stockTargetItem.stockQuantity} {stockTargetItem.unit}s</span></div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">New Stock Quantity *</label>
                <input
                  type="number"
                  min="0"
                  value={newStockVal}
                  onChange={(e) => setNewStockVal(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-base outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  <span>{submitting ? 'Updating...' : 'Save Stock'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
