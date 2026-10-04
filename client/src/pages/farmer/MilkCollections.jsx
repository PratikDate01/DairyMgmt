import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { milkCollectionService } from '../../services/milkCollectionService';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Droplets,
  Sun,
  Moon,
  Building2,
  RefreshCw,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export const MilkCollections = () => {
  const { token } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await milkCollectionService.getFarmerCollections(token);
      setCollections(res.collections || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch your milk collection history');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalQty = collections.reduce((sum, item) => sum + (item.quantityLiters || 0), 0);
    const totalAmt = collections.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const avgFat = collections.length > 0
      ? collections.reduce((sum, item) => sum + (item.fatPercentage || 0), 0) / collections.length
      : 0;

    return {
      totalQty: Math.round(totalQty * 10) / 10,
      totalAmt: Math.round(totalAmt * 100) / 100,
      avgFat: Math.round(avgFat * 10) / 10,
      count: collections.length
    };
  }, [collections]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Milk Collections"
        description="View your recorded daily milk collections, fat percentages, and total earnings."
        breadcrumbs={['Home', 'Farmer Portal', 'Milk Collections']}
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

      {/* Overview Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Quantity Supplied
            </span>
            <span className="text-xl font-bold text-slate-900 font-mono">
              {stats.totalQty} L
            </span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Amount Earned
            </span>
            <span className="text-xl font-bold text-emerald-700 font-mono">
              ₹{stats.totalAmt.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center space-x-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Avg Fat Content
            </span>
            <span className="text-xl font-bold text-slate-900 font-mono">
              {stats.avgFat}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Collection History */}
      <SectionCard
        title="Recorded Collection Log"
        subtitle="Historical records recorded by your connected dairy owners"
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
        {loading ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            Loading collection records...
          </div>
        ) : collections.length === 0 ? (
          <EmptyState
            title="No Milk Collections Recorded Yet"
            description="When your connected Dairy Owner records your milk collections, they will appear here."
            icon={Droplets}
          />
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Dairy Owner</th>
                    <th className="py-3 px-4">Shift</th>
                    <th className="py-3 px-4 text-right">Quantity (L)</th>
                    <th className="py-3 px-4 text-right">Fat (%)</th>
                    <th className="py-3 px-4 text-right">Rate (₹/L)</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {collections.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {new Date(item.collectionDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                          <div>
                            <div className="font-semibold text-slate-900">
                              {item.dairyOwner?.name || 'Dairy Owner'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {item.dairyOwner?.phone}
                            </div>
                          </div>
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
              {collections.map((item) => (
                <div
                  key={item._id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {item.dairyOwner?.name || 'Dairy Owner'}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono">
                          {item.dairyOwner?.phone}
                        </p>
                      </div>
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
