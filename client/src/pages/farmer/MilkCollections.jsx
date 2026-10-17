import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getStatusLabel } from '../../i18n/statusMap';
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
  AlertCircle,
  Calendar,
  History,
  Filter,
  Wallet,
  Clock,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const MilkCollections = () => {
  const { t } = useTranslation(['farmer', 'common']);
  const { token } = useAuth();

  // Active Tab: 'history' or 'summary'
  const [activeTab, setActiveTab] = useState('history');

  // Collection History State
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // History Filter State
  const [filterSession, setFilterSession] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDatePreset, setFilterDatePreset] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // 10-Day Summary State
  const [summaryCycle, setSummaryCycle] = useState('current');
  const [summaryCustomStart, setSummaryCustomStart] = useState('');
  const [summaryCustomEnd, setSummaryCustomEnd] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState('');

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

  // Fetch 10-Day Summary for Authenticated Farmer
  const fetchTenDaySummary = useCallback(async () => {
    try {
      setLoadingSummary(true);
      setSummaryError('');

      let start = null;
      let end = null;
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();

      if (summaryCycle === 'cycle1') {
        start = new Date(Date.UTC(year, month, 1)).toISOString().split('T')[0];
        end = new Date(Date.UTC(year, month, 10)).toISOString().split('T')[0];
      } else if (summaryCycle === 'cycle2') {
        start = new Date(Date.UTC(year, month, 11)).toISOString().split('T')[0];
        end = new Date(Date.UTC(year, month, 20)).toISOString().split('T')[0];
      } else if (summaryCycle === 'cycle3') {
        const lastDay = new Date(year, month + 1, 0).getDate();
        start = new Date(Date.UTC(year, month, 21)).toISOString().split('T')[0];
        end = new Date(Date.UTC(year, month, lastDay)).toISOString().split('T')[0];
      } else if (summaryCycle === 'last10') {
        const d10 = new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000);
        start = d10.toISOString().split('T')[0];
        end = now.toISOString().split('T')[0];
      } else if (summaryCycle === 'custom') {
        if (!summaryCustomStart || !summaryCustomEnd) {
          setSummaryError('Please provide both start date and end date for custom range.');
          setLoadingSummary(false);
          return;
        }
        start = summaryCustomStart;
        end = summaryCustomEnd;
      }

      const params = {};
      if (start && end) {
        params.startDate = start;
        params.endDate = end;
      }

      const res = await milkCollectionService.getTenDaySummary(token, params);
      setSummaryData(res);
    } catch (err) {
      console.error('Farmer 10-day summary error:', err);
      setSummaryError(err.message || 'Failed to generate 10-day milk summary.');
    } finally {
      setLoadingSummary(false);
    }
  }, [token, summaryCycle, summaryCustomStart, summaryCustomEnd]);

  useEffect(() => {
    if (activeTab === 'summary') {
      fetchTenDaySummary();
    }
  }, [activeTab, summaryCycle, fetchTenDaySummary]);

  // Filtered Collections
  const filteredCollections = useMemo(() => {
    return collections.filter((item) => {
      if (filterSession !== 'all' && item.session !== filterSession) return false;
      if (filterStatus !== 'all' && item.paymentStatus !== filterStatus) return false;

      if (!item.collectionDate) return true;
      const itemDateStr = new Date(item.collectionDate).toISOString().split('T')[0];
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      if (filterDatePreset === 'today') {
        if (itemDateStr !== todayStr) return false;
      } else if (filterDatePreset === 'last7days') {
        const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        if (itemDateStr < d7 || itemDateStr > todayStr) return false;
      } else if (filterDatePreset === 'last10days') {
        const d10 = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        if (itemDateStr < d10 || itemDateStr > todayStr) return false;
      } else if (filterDatePreset === 'thisMonth') {
        const mStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString().split('T')[0];
        if (itemDateStr < mStart || itemDateStr > todayStr) return false;
      } else if (filterDatePreset === 'custom') {
        if (filterStartDate && itemDateStr < filterStartDate) return false;
        if (filterEndDate && itemDateStr > filterEndDate) return false;
      }

      return true;
    });
  }, [
    collections,
    filterSession,
    filterStatus,
    filterDatePreset,
    filterStartDate,
    filterEndDate
  ]);

  // Aggregate stats across all collections
  const overallStats = useMemo(() => {
    const totalQty = collections.reduce((sum, item) => sum + (item.quantityLiters || 0), 0);
    const totalAmt = collections.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const settledAmt = collections
      .filter((c) => c.paymentStatus === 'settled')
      .reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    const unpaidAmt = collections
      .filter((c) => c.paymentStatus !== 'settled')
      .reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    const avgFat =
      collections.length > 0
        ? collections.reduce((sum, item) => sum + (item.fatPercentage || 0), 0) /
          collections.length
        : 0;

    return {
      totalQty: Math.round(totalQty * 10) / 10,
      totalAmt: Math.round(totalAmt * 100) / 100,
      settledAmt: Math.round(settledAmt * 100) / 100,
      unpaidAmt: Math.round(unpaidAmt * 100) / 100,
      avgFat: Math.round(avgFat * 10) / 10,
      count: collections.length
    };
  }, [collections]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('farmer:milkCollections.title', 'My Milk Collections')}
        description={t('farmer:milk.subtitle', 'Inspect daily milk collections, fat percentages, rate payouts, and 10-day billing summaries recorded by your dairy.')}
        breadcrumbs={[t('common:nav.home', 'Home'), t('common:roles.farmer', 'Farmer'), t('farmer:milkCollections.title', 'My Milk Collections')]}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                fetchCollections();
                if (activeTab === 'summary') fetchTenDaySummary();
              }}
              disabled={loading}
              className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg shadow-xs transition"
              title={t('farmer:milkCollections.refreshTooltip', 'Refresh Collections')}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/farmer/payments"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <Wallet className="w-4 h-4" />
              <span>{t('farmer:milkCollections.paymentsLedger', 'Payments Ledger')}</span>
            </Link>
          </div>
        }
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              {t('farmer:milkCollections.totalQuantity', 'Total Quantity Supplied')}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              {overallStats.totalQty} L
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
              {t('farmer:milk.avgFat', 'Average Fat')}: {overallStats.avgFat}%
            </span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              {t('farmer:milkCollections.totalValue', 'Total Milk Value Recorded')}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-blue-700 font-mono">
              ₹ {overallStats.totalAmt.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {t('farmer:milkCollections.recordsCount', { count: overallStats.count, defaultValue: '{{count}} Shift Records' })}
            </span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              {t('farmer:milkCollections.settledFunds', 'Settled Milk Funds')}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-700 font-mono">
              ₹ {overallStats.settledAmt.toFixed(2)}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
              {t('common:status.settled', 'Settled')}
            </span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center space-x-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              {t('farmer:milkCollections.pendingBalance', 'Outstanding Unpaid Balance')}
            </span>
            <span
              className={`text-xl sm:text-2xl font-bold font-mono ${
                overallStats.unpaidAmt > 0 ? 'text-amber-600' : 'text-slate-900'
              }`}
            >
              ₹ {overallStats.unpaidAmt.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {t('common:status.pending', 'Awaiting Settlement')}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{t('farmer:milkCollections.historyTab', 'Recorded Collection Log')}</span>
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'summary'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{t('farmer:milkCollections.summaryTab', '10-Day Billing Summary')}</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: RECORDED COLLECTION LOG */}
      {/* ============================================================ */}
      {activeTab === 'history' && (
        <SectionCard
          title={t('farmer:milkCollections.historyTab', 'Recorded Collection Log')}
          subtitle={t('farmer:milk.subtitle', 'Read-only history of milk entries created by your connected dairy owners')}
        >
          {/* Filter Toolbar */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 mb-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('common:actions.filter', 'Filter')}:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t('farmer:milkCollections.filterSession', 'Shift')}</label>
                <select
                  value={filterSession}
                  onChange={(e) => setFilterSession(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="all">{t('farmer:milkCollections.allSessions', 'All Shifts')}</option>
                  <option value="morning">{t('farmer:dashboard.morningSession', 'Morning')}</option>
                  <option value="evening">{t('farmer:dashboard.eveningSession', 'Evening')}</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t('farmer:milkCollections.filterStatus', 'Payment Status')}</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="all">{t('farmer:milkCollections.allStatuses', 'All Statuses')}</option>
                  <option value="unpaid">{t('common:status.unpaid', 'Unpaid')}</option>
                  <option value="settled">{t('common:status.settled', 'Settled')}</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t('farmer:milkCollections.filterDatePreset', 'Date Range')}</label>
                <select
                  value={filterDatePreset}
                  onChange={(e) => setFilterDatePreset(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="all">{t('farmer:milkCollections.allDates', 'All Recorded Dates')}</option>
                  <option value="today">{t('common:datePresets.today', 'Today')}</option>
                  <option value="last7days">{t('common:datePresets.last7days', 'Last 7 Days')}</option>
                  <option value="last10days">{t('farmer:milkCollections.last10Days', 'Last 10 Days')}</option>
                  <option value="thisMonth">{t('common:datePresets.thisMonth', 'This Month')}</option>
                  <option value="custom">{t('farmer:milkCollections.customRange', 'Custom Date Range')}</option>
                </select>
              </div>
            </div>

            {filterDatePreset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t('farmer:milk.startDate', 'Start Date')}</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t('farmer:milk.endDate', 'End Date')}</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
              <span>{t('farmer:milkCollections.loadingCollections', 'Loading collection records...')}</span>
            </div>
          ) : filteredCollections.length === 0 ? (
            <EmptyState
              title={t('farmer:milkCollections.noCollectionsFound', 'No Milk Collections Recorded Yet')}
              description={t('farmer:milkCollections.noCollectionsDesc', 'When your connected Dairy Owner records your milk collections, they will appear here in real-time.')}
              icon={Droplets}
            />
          ) : (
            <div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">{t('farmer:milkCollections.date', 'Date')}</th>
                      <th className="py-3 px-4">{t('farmer:milkCollections.dairyCenter', 'Dairy Unit')}</th>
                      <th className="py-3 px-4">{t('farmer:milkCollections.filterSession', 'Shift')}</th>
                      <th className="py-3 px-4 text-right">{t('farmer:milkCollections.totalQuantity', 'Quantity (L)')}</th>
                      <th className="py-3 px-4 text-right">{t('farmer:milk.avgFat', 'Fat (%)')}</th>
                      <th className="py-3 px-4 text-right">{t('dairyOwner:reportsPage.averageRate', 'Rate (₹/L)')}</th>
                      <th className="py-3 px-4 text-right">{t('farmer:milk.totalEarnings', 'Total Amount')}</th>
                      <th className="py-3 px-4 text-center">{t('farmer:milkCollections.filterStatus', 'Payment Status')}</th>
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
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              item.paymentStatus === 'settled'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {getStatusLabel(item.paymentStatus, t)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredCollections.map((item) => (
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
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.session === 'morning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {item.session}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            item.paymentStatus === 'settled'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {getStatusLabel(item.paymentStatus, t)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-200 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">{t('farmer:milk.qty', 'Qty')}</span>
                        <span className="font-mono font-bold text-slate-800">{item.quantityLiters} L</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">{t('farmer:milk.fat', 'Fat')}</span>
                        <span className="font-mono font-semibold text-slate-800">{item.fatPercentage}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">{t('farmer:milk.rate', 'Rate')}</span>
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
      )}

      {/* ============================================================ */}
      {/* TAB 2: TEN-DAY BILLING SUMMARY */}
      {/* ============================================================ */}
      {activeTab === 'summary' && (
        <SectionCard
          title={t('farmer:milkCollections.summaryCycleTitle', 'My 10-Day Billing Summary')}
          subtitle={t('farmer:milk.subtitle', 'Detailed breakdown of milk intake and payout settlement for the selected billing period')}
        >
          {/* Cycle Selector Toolbar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t('farmer:milkCollections.summaryTab', 'Select 10-Day Billing Cycle')}:</span>
              </label>
              <select
                value={summaryCycle}
                onChange={(e) => setSummaryCycle(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="current">{t('farmer:milkCollections.currentCycle', 'Current 10-Day Period')}</option>
                <option value="cycle1">{t('farmer:milkCollections.cycle1', 'Cycle 1 (1st - 10th)')}</option>
                <option value="cycle2">{t('farmer:milkCollections.cycle2', 'Cycle 2 (11th - 20th)')}</option>
                <option value="cycle3">{t('farmer:milkCollections.cycle3', 'Cycle 3 (21st - End)')}</option>
                <option value="last10">{t('farmer:milkCollections.last10Days', 'Rolling Last 10 Days')}</option>
                <option value="custom">{t('farmer:milk.customDateRange', 'Custom Date Range')}</option>
              </select>
            </div>

            {summaryCycle === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t('farmer:milk.startDate', 'Start Date')}</label>
                  <input
                    type="date"
                    value={summaryCustomStart}
                    onChange={(e) => setSummaryCustomStart(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t('farmer:milk.endDate', 'End Date')}</label>
                  <input
                    type="date"
                    value={summaryCustomEnd}
                    onChange={(e) => setSummaryCustomEnd(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {summaryError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{summaryError}</span>
            </div>
          )}

          {loadingSummary ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
              <span>{t('farmer:milkCollections.loadingSummary', 'Generating your 10-day billing summary...')}</span>
            </div>
          ) : !summaryData ? (
            <EmptyState
              title={t('farmer:milkCollections.noSummaryAvailable', 'No Summary Available')}
              description={t('farmer:milkCollections.noSummaryDesc', 'Could not generate 10-day summary for the selected period.')}
              icon={Calendar}
            />
          ) : (
            <div className="space-y-6 mt-4">
              {/* Period Header */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-slate-600">
                  Billing Period: <strong className="text-slate-800">{summaryData.period?.startDate}</strong> to{' '}
                  <strong className="text-slate-800">{summaryData.period?.endDate}</strong>{' '}
                  <span className="text-indigo-600 font-semibold">({summaryData.period?.cycleName})</span>
                </span>
                <span className="text-slate-500 font-mono">
                  Total Records: {summaryData.summary?.collectionCount} shifts
                </span>
              </div>

              {/* KPI Cards distinguishing Recorded vs Paid vs Outstanding */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Total Milk Supplied
                  </span>
                  <span className="text-2xl font-bold text-slate-900 font-mono block mt-1">
                    {summaryData.summary?.totalMilkQuantity} L
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Avg Fat: {summaryData.summary?.averageFat}% • Avg Rate: ₹{summaryData.summary?.averageRate}/L
                  </span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Milk Amount Recorded
                  </span>
                  <span className="text-2xl font-bold text-blue-700 font-mono block mt-1">
                    ₹ {summaryData.summary?.totalRecordedAmount?.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Gross recorded earnings
                  </span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Amount Already Paid
                  </span>
                  <span className="text-2xl font-bold text-emerald-700 font-mono block mt-1">
                    ₹ {summaryData.summary?.amountPaid?.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                    {summaryData.summary?.settledCount} shifts disbursed
                  </span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Outstanding Balance
                  </span>
                  <span
                    className={`text-2xl font-bold font-mono block mt-1 ${
                      summaryData.summary?.outstandingAmount > 0
                        ? 'text-amber-600'
                        : 'text-green-600'
                    }`}
                  >
                    ₹ {summaryData.summary?.outstandingAmount?.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    {summaryData.summary?.unpaidCount} shifts pending payout
                  </span>
                </div>
              </div>

              {/* Day-by-day table */}
              {summaryData.dailyRecords?.length === 0 ? (
                <EmptyState
                  title={t('farmer:milkCollections.noCollectionsInPeriod', 'No Collections Recorded in Period')}
                  description={t('farmer:milkCollections.noCollectionsInPeriodDesc', 'No morning or evening milk records exist in the selected 10-day period.')}
                  icon={Droplets}
                />
              ) : (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    {t('farmer:milkCollections.dailyShiftEntries', { count: summaryData.dailyRecords?.length, defaultValue: `Daily Shift Entries (${summaryData.dailyRecords?.length} Days)` })}
                  </h4>

                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="py-2.5 px-3">{t('farmer:milk.date', 'Date')}</th>
                          <th className="py-2.5 px-3">{t('farmer:milk.morningShift', 'Morning Shift')}</th>
                          <th className="py-2.5 px-3">{t('farmer:milk.eveningShift', 'Evening Shift')}</th>
                          <th className="py-2.5 px-3 text-right">{t('farmer:milk.dailyTotalQty', 'Daily Total Qty')}</th>
                          <th className="py-2.5 px-3 text-right">{t('farmer:milk.dailyTotalAmount', 'Daily Total Amount')}</th>
                          <th className="py-2.5 px-3 text-center">{t('farmer:milk.settlementStatus', 'Settlement Status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {summaryData.dailyRecords.map((d) => (
                          <tr key={d.date} className="hover:bg-slate-50/70 transition">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {new Date(d.date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                weekday: 'short'
                              })}
                            </td>
                            <td className="py-2.5 px-3">
                              {d.morning ? (
                                <div className="font-mono text-[11px]">
                                  <span className="font-bold text-amber-900">☀️ {d.morning.quantityLiters} L</span>{' '}
                                  <span className="text-slate-500">
                                    (Fat: {d.morning.fatPercentage}% • ₹{d.morning.ratePerLiter}/L) = ₹{d.morning.totalAmount?.toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {d.evening ? (
                                <div className="font-mono text-[11px]">
                                  <span className="font-bold text-indigo-900">🌙 {d.evening.quantityLiters} L</span>{' '}
                                  <span className="text-slate-500">
                                    (Fat: {d.evening.fatPercentage}% • ₹{d.evening.ratePerLiter}/L) = ₹{d.evening.totalAmount?.toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              {d.dailyTotalQuantity} L
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                              ₹{d.dailyTotalAmount?.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  d.isFullySettled
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {getStatusLabel(d.isFullySettled ? 'settled' : 'unpaid', t)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card List */}
                  <div className="lg:hidden space-y-3">
                    {summaryData.dailyRecords.map((d) => (
                      <div key={d.date} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <span className="font-mono font-bold text-slate-900">
                            {new Date(d.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              weekday: 'short'
                            })}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              d.isFullySettled
                                ? 'bg-green-100 text-green-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {getStatusLabel(d.isFullySettled ? 'settled' : 'unpaid', t)}
                          </span>
                        </div>

                        <div className="space-y-1 font-mono text-[11px]">
                          {d.morning && (
                            <div className="flex justify-between text-amber-900">
                              <span>☀️ Morning: {d.morning.quantityLiters} L</span>
                              <span className="font-semibold">₹{d.morning.totalAmount?.toFixed(2)}</span>
                            </div>
                          )}
                          {d.evening && (
                            <div className="flex justify-between text-indigo-900">
                              <span>🌙 Evening: {d.evening.quantityLiters} L</span>
                              <span className="font-semibold">₹{d.evening.totalAmount?.toFixed(2)}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                          <span className="text-slate-700">Daily Total: {d.dailyTotalQuantity} L</span>
                          <span className="text-emerald-700 font-mono">₹{d.dailyTotalAmount?.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
};
