import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dairyFarmerService } from '../../services/dairyFarmerService';
import { milkCollectionService } from '../../services/milkCollectionService';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Droplets,
  PlusCircle,
  Calendar,
  Sun,
  Moon,
  DollarSign,
  User,
  History,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Filter
} from 'lucide-react';

export const MilkCollection = () => {
  const { token } = useAuth();

  // Data states
  const [activeFarmers, setActiveFarmers] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loadingFarmers, setLoadingFarmers] = useState(true);
  const [loadingCollections, setLoadingCollections] = useState(true);

  // Form states
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [collectionDate, setCollectionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [session, setSession] = useState('morning');
  const [quantityLiters, setQuantityLiters] = useState('');
  const [fatPercentage, setFatPercentage] = useState('');
  const [ratePerLiter, setRatePerLiter] = useState('');

  // UI feedback states
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filterFarmerId, setFilterFarmerId] = useState('all');

  // Load Active Farmers
  const fetchFarmers = useCallback(async () => {
    try {
      setLoadingFarmers(true);
      const connections = await dairyFarmerService.getDairyFarmers(token);
      // Filter only active connections
      const active = connections
        .filter((c) => c.status === 'active' && c.farmer)
        .map((c) => c.farmer);
      setActiveFarmers(active);

      if (active.length > 0 && !selectedFarmerId) {
        setSelectedFarmerId(active[0]._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load connected farmers');
    } finally {
      setLoadingFarmers(false);
    }
  }, [token, selectedFarmerId]);

  // Load Dairy Owner Collection History
  const fetchCollections = useCallback(async () => {
    try {
      setLoadingCollections(true);
      const res = await milkCollectionService.getDairyOwnerCollections(token);
      setCollections(res.collections || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCollections(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFarmers();
    fetchCollections();
  }, [fetchFarmers, fetchCollections]);

  // Live calculation of Total Amount
  const liveTotalAmount = useMemo(() => {
    const q = parseFloat(quantityLiters);
    const r = parseFloat(ratePerLiter);
    if (isNaN(q) || isNaN(r) || q <= 0 || r < 0) return 0;
    return Math.round(q * r * 100) / 100;
  }, [quantityLiters, ratePerLiter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!selectedFarmerId) {
      setError('Please select an active connected farmer.');
      return;
    }

    if (!quantityLiters || parseFloat(quantityLiters) <= 0) {
      setError('Please enter a valid milk quantity in liters.');
      return;
    }

    if (fatPercentage === '' || parseFloat(fatPercentage) < 0 || parseFloat(fatPercentage) > 20) {
      setError('Please enter a valid Fat percentage (0 - 20%).');
      return;
    }

    if (ratePerLiter === '' || parseFloat(ratePerLiter) < 0) {
      setError('Please enter a valid rate per liter.');
      return;
    }

    try {
      setSubmitLoading(true);
      const res = await milkCollectionService.createCollection(
        {
          farmerId: selectedFarmerId,
          collectionDate,
          session,
          quantityLiters: parseFloat(quantityLiters),
          fatPercentage: parseFloat(fatPercentage),
          ratePerLiter: parseFloat(ratePerLiter)
        },
        token
      );

      setSuccessMsg(res.message || 'Milk collection recorded successfully!');
      // Reset numeric fields
      setQuantityLiters('');
      setFatPercentage('');
      setRatePerLiter('');

      // Refresh collections
      await fetchCollections();
    } catch (err) {
      setError(err.message || 'Failed to record milk collection.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredCollections = useMemo(() => {
    if (filterFarmerId === 'all') return collections;
    return collections.filter(c => c.farmer?._id === filterFarmerId);
  }, [collections, filterFarmerId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Milk Collection Entry"
        description="Record daily milk collections from your actively connected farmers."
        breadcrumbs={['Home', 'Dairy Console', 'Milk Collection']}
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-800 font-bold text-xs"
          >
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
          <button
            onClick={() => setSuccessMsg('')}
            className="text-green-600 hover:text-green-800 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Entry Form */}
      <SectionCard
        title="Record Daily Milk Collection"
        subtitle="Select farmer and enter collection details"
      >
        {loadingFarmers ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            Loading active farmers...
          </div>
        ) : activeFarmers.length === 0 ? (
          <EmptyState
            title="No Active Farmers Available"
            description="You must have actively connected farmers to record milk collections. Connect with farmers in Connected Farmers first."
            icon={User}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Farmer Selection */}
              <div className="space-y-1.5 lg:col-span-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Select Active Farmer *</span>
                </label>
                <select
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  required
                >
                  {activeFarmers.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name} ({f.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Collection Date *</span>
                </label>
                <input
                  type="date"
                  value={collectionDate}
                  onChange={(e) => setCollectionDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  required
                />
              </div>

              {/* Session / Shift Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Shift Session *</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSession('morning')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center space-x-1.5 transition ${
                      session === 'morning'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Morning</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSession('evening')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center space-x-1.5 transition ${
                      session === 'evening'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Evening</span>
                  </button>
                </div>
              </div>

              {/* Milk Quantity (Liters) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-600" />
                  <span>Quantity (Liters) *</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1000"
                  placeholder="e.g. 12.5"
                  value={quantityLiters}
                  onChange={(e) => setQuantityLiters(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                  required
                />
              </div>

              {/* Fat Percentage */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">
                    %
                  </span>
                  <span>Fat Percentage (%) *</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  placeholder="e.g. 4.2"
                  value={fatPercentage}
                  onChange={(e) => setFatPercentage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                  required
                />
              </div>

              {/* Rate per Liter (₹) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Rate per Liter (₹/L) *</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="500"
                  placeholder="e.g. 45.00"
                  value={ratePerLiter}
                  onChange={(e) => setRatePerLiter(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                  required
                />
              </div>
            </div>

            {/* Live Summary Calculation Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3 text-slate-700 text-xs sm:text-sm">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">
                    Live Calculation Preview
                  </div>
                  <div className="text-slate-500 text-xs">
                    {quantityLiters || '0'} L × ₹{ratePerLiter || '0'}/L (Fat: {fatPercentage || '0'}%)
                  </div>
                </div>
              </div>

              <div className="text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
                <span className="text-xs text-slate-500 block uppercase tracking-wider font-semibold">
                  Total Calculated Amount
                </span>
                <span className="text-xl sm:text-2xl font-bold text-emerald-700 font-mono">
                  ₹{liveTotalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitLoading}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{submitLoading ? 'Saving Record...' : 'Save Milk Collection'}</span>
              </button>
            </div>
          </form>
        )}
      </SectionCard>

      {/* Collection History Log */}
      <SectionCard
        title="Milk Collection History"
        subtitle="View past recorded collections"
        action={
          <button
            onClick={fetchCollections}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
            title="Refresh History"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        }
      >
        {/* Filter Toolbar */}
        {activeFarmers.length > 0 && collections.length > 0 && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Filter by Farmer:</span>
            </div>
            <select
              value={filterFarmerId}
              onChange={(e) => setFilterFarmerId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Connected Farmers</option>
              {activeFarmers.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {loadingCollections ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            Loading collection history...
          </div>
        ) : filteredCollections.length === 0 ? (
          <EmptyState
            title="No Collection Records Found"
            description="No milk collection records exist for the selected filter."
            icon={History}
          />
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Farmer</th>
                    <th className="py-3 px-4">Session</th>
                    <th className="py-3 px-4 text-right">Quantity (L)</th>
                    <th className="py-3 px-4 text-right">Fat (%)</th>
                    <th className="py-3 px-4 text-right">Rate (₹/L)</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredCollections.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {new Date(item.collectionDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {item.farmer?.name || 'Unknown'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.farmer?.phone}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.session === 'morning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {item.session === 'morning' ? (
                            <Sun className="w-3 h-3 mr-1 text-amber-600" />
                          ) : (
                            <Moon className="w-3 h-3 mr-1 text-indigo-600" />
                          )}
                          {item.session}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {item.quantityLiters} L
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {item.fatPercentage}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        ₹{item.ratePerLiter}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                        ₹{item.totalAmount?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden space-y-3">
              {filteredCollections.map((item) => (
                <div
                  key={item._id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {item.farmer?.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">
                        {item.farmer?.phone}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.session === 'morning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {item.session}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-200 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Qty</span>
                      <span className="font-mono font-bold text-slate-800">{item.quantityLiters} L</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Fat</span>
                      <span className="font-mono font-semibold text-slate-800">{item.fatPercentage}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Rate</span>
                      <span className="font-mono text-slate-800">₹{item.ratePerLiter}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(item.collectionDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="text-base font-bold text-emerald-700 font-mono">
                      ₹{item.totalAmount?.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
};
