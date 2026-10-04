import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services/reportService';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { StatCard } from '../../components/common/StatCard';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Milk,
  Wallet,
  Calendar,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const FarmerReports = () => {
  const { token } = useAuth();

  // Date Filter State
  const [preset, setPreset] = useState('thisMonth');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Data States
  const [milkSummary, setMilkSummary] = useState({
    totalCollectionRecords: 0,
    totalMilkQuantity: 0,
    averageMilkQuantity: 0,
    totalMilkValue: 0,
    averageFat: 0,
    averageRate: 0
  });

  const [paymentSummary, setPaymentSummary] = useState({
    totalPaymentRecords: 0,
    totalGrossAmount: 0,
    totalPaidAmount: 0,
    totalOutstandingAmount: 0,
    paidCount: 0,
    partiallyPaidCount: 0,
    pendingCount: 0
  });

  const [dateWiseMilk, setDateWiseMilk] = useState([]);
  const [dateWisePayments, setDateWisePayments] = useState([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const queryParams = { preset };
      if (preset === 'custom') {
        if (!customStart || !customEnd) {
          setLoading(false);
          return;
        }
        queryParams.startDate = customStart;
        queryParams.endDate = customEnd;
      }

      const [milkRes, payRes, dateMilkRes, datePayRes] = await Promise.all([
        reportService.getMilkSummary(token, queryParams),
        reportService.getPaymentSummary(token, queryParams),
        reportService.getDateWiseMilk(token, queryParams),
        reportService.getDateWisePayments(token, queryParams)
      ]);

      if (milkRes.summary) setMilkSummary(milkRes.summary);
      if (payRes.summary) setPaymentSummary(payRes.summary);
      if (dateMilkRes.records) setDateWiseMilk(dateMilkRes.records);
      if (datePayRes.records) setDateWisePayments(datePayRes.records);
    } catch (err) {
      setError(err.message || 'Failed to generate personal report analytics');
    } finally {
      setLoading(false);
    }
  }, [token, preset, customStart, customEnd]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleApplyCustomFilter = (e) => {
    e.preventDefault();
    if (!customStart || !customEnd) {
      setError('Please select both start and end dates for custom date range');
      return;
    }
    if (new Date(customStart) > new Date(customEnd)) {
      setError('Start date cannot be later than end date');
      return;
    }
    fetchReports();
  };

  const maxDailyMilk = dateWiseMilk.length > 0
    ? Math.max(...dateWiseMilk.map((d) => d.totalLiters), 1)
    : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personal Supply & Payment Analytics"
        description="View your personal milk supply metrics, historical earnings, and settlement summary."
        breadcrumbs={['Home', 'Farmer Portal', 'Reports']}
        actions={
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold rounded-lg flex items-center">
              <Lock className="w-3.5 h-3.5 mr-1 text-amber-600" /> Read-Only View
            </span>
            <button
              onClick={fetchReports}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
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

      {/* Date Filter */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Report Time Period:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'today', label: 'Today' },
              { id: 'last7days', label: 'Last 7 Days' },
              { id: 'thisMonth', label: 'This Month' },
              { id: 'lastMonth', label: 'Last Month' },
              { id: 'custom', label: 'Custom Range' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setPreset(btn.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  preset === btn.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {preset === 'custom' && (
          <form onSubmit={handleApplyCustomFilter} className="flex flex-wrap items-end gap-3 pt-2 border-t border-slate-100">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="py-1.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition"
            >
              Apply Filter
            </button>
          </form>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Milk Supplied"
          value={loading ? '...' : `${milkSummary.totalMilkQuantity.toFixed(1)} L`}
          icon={Milk}
          badgeText={`${milkSummary.totalCollectionRecords} Entries Logged`}
          badgeType="success"
        />
        <StatCard
          title="Total Milk Earnings Value"
          value={loading ? '...' : `₹ ${milkSummary.totalMilkValue.toFixed(2)}`}
          icon={TrendingUp}
          badgeText={`Avg Rate ₹${milkSummary.averageRate}/L`}
          badgeType="neutral"
        />
        <StatCard
          title="Total Payments Received"
          value={loading ? '...' : `₹ ${paymentSummary.totalPaidAmount.toFixed(2)}`}
          icon={CheckCircle2}
          badgeText="Disbursed to Account"
          badgeType="success"
        />
        <StatCard
          title="Outstanding Unsettled Balance"
          value={loading ? '...' : `₹ ${paymentSummary.totalOutstandingAmount.toFixed(2)}`}
          icon={CreditCard}
          badgeText={paymentSummary.totalOutstandingAmount > 0 ? 'Pending Settlement' : 'Clear Balance'}
          badgeType={paymentSummary.totalOutstandingAmount > 0 ? 'amber' : 'success'}
        />
      </div>

      {/* Milk Supply Summary */}
      <SectionCard title="Personal Milk Supply Performance" subtitle="Quality and intake averages">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Supplied</span>
            <span className="font-mono font-bold text-slate-900 text-base">{milkSummary.totalMilkQuantity} L</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Average Shift Supply</span>
            <span className="font-mono font-bold text-slate-900 text-base">{milkSummary.averageMilkQuantity} L</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Average Fat %</span>
            <span className="font-mono font-bold text-blue-700 text-base">{milkSummary.averageFat}%</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Average Rate per Liter</span>
            <span className="font-mono font-bold text-emerald-700 text-base">₹{milkSummary.averageRate}</span>
          </div>
        </div>
      </SectionCard>

      {/* Date-Wise Collection History */}
      <SectionCard title="Daily Supply History" subtitle="Your recorded milk entries aggregated by date">
        {loading ? (
          <div className="py-6 text-center text-slate-500 text-xs">Loading daily history...</div>
        ) : dateWiseMilk.length === 0 ? (
          <EmptyState title="No Milk Supply Records" description="No milk collection entries recorded for selected date range." icon={Milk} />
        ) : (
          <div className="space-y-3">
            {dateWiseMilk.map((d) => {
              const barWidth = Math.min(100, Math.round((d.totalLiters / maxDailyMilk) * 100));
              return (
                <div key={d.date} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{d.date}</span>
                    <div className="flex items-center space-x-3 font-mono">
                      <span className="text-slate-500">Fat: {d.averageFat}%</span>
                      <span className="text-slate-500">₹{d.averageRate}/L</span>
                      <span className="font-bold text-slate-900">{d.totalLiters} L</span>
                      <span className="font-bold text-emerald-700">₹{d.totalValue.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full transition-all duration-300" style={{ width: `${barWidth}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Date-Wise Payment History */}
      <SectionCard title="Payment Statement History" subtitle="Disbursed settlement history aggregated by date">
        {loading ? (
          <div className="py-6 text-center text-slate-500 text-xs">Loading payment statements...</div>
        ) : dateWisePayments.length === 0 ? (
          <EmptyState title="No Payment Statements" description="No payment statements issued for selected date range." icon={Wallet} />
        ) : (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-center">Statements</th>
                  <th className="py-3 px-4 text-right">Gross Total</th>
                  <th className="py-3 px-4 text-right">Amount Received</th>
                  <th className="py-3 px-4 text-right">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-mono">
                {dateWisePayments.map((p) => (
                  <tr key={p.date} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.date}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 font-bold border border-blue-100">
                        {p.paymentCount} Statements
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">₹{p.grossAmount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">₹{p.paidAmount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-800">₹{p.outstandingAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
};
