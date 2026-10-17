import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { dairyFarmerService } from '../../services/dairyFarmerService';
import { milkCollectionService } from '../../services/milkCollectionService';
import { getSessionLabel, getStatusLabel } from '../../i18n/statusMap';
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
  Filter,
  Users,
  Wallet,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';

export const MilkCollection = () => {
  const { t } = useTranslation(['dairyOwner', 'common']);
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State: 'entry', 'summary', or 'history'
  const initialTab = searchParams.get('tab') === 'summary'
    ? 'summary'
    : searchParams.get('tab') === 'history'
    ? 'history'
    : 'entry';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Active Farmers
  const [activeFarmers, setActiveFarmers] = useState([]);
  const [loadingFarmers, setLoadingFarmers] = useState(true);

  // Collections History
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(true);

  // Form State
  const initialFarmerId = searchParams.get('farmerId') || '';
  const [selectedFarmerId, setSelectedFarmerId] = useState(initialFarmerId);
  const [collectionDate, setCollectionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [session, setSession] = useState('morning');
  const [quantityLiters, setQuantityLiters] = useState('');
  const [fatPercentage, setFatPercentage] = useState('');
  const [ratePerLiter, setRatePerLiter] = useState('');

  // UI Feedback State
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // History Filter State
  const [filterFarmerId, setFilterFarmerId] = useState('all');
  const [filterSession, setFilterSession] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDatePreset, setFilterDatePreset] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // 10-Day Summary State
  const [summaryFarmerId, setSummaryFarmerId] = useState('');
  const [summaryCycle, setSummaryCycle] = useState('current');
  const [summaryCustomStart, setSummaryCustomStart] = useState('');
  const [summaryCustomEnd, setSummaryCustomEnd] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  // Load Active Connected Farmers
  const fetchFarmers = useCallback(async () => {
    try {
      setLoadingFarmers(true);
      const connections = await dairyFarmerService.getDairyFarmers(token);
      const active = connections
        .filter((c) => c.status === 'active' && c.farmer)
        .map((c) => c.farmer);
      setActiveFarmers(active);

      if (active.length > 0) {
        if (!selectedFarmerId) {
          setSelectedFarmerId(active[0]._id);
        }
        if (!summaryFarmerId) {
          setSummaryFarmerId(active[0]._id);
        }
      }
    } catch (err) {
      setFormError(err.message || 'Failed to load connected farmers');
    } finally {
      setLoadingFarmers(false);
    }
  }, [token, selectedFarmerId, summaryFarmerId]);

  // Load Dairy Owner Collection History
  const fetchCollections = useCallback(async () => {
    try {
      setLoadingCollections(true);
      const res = await milkCollectionService.getDairyOwnerCollections(token);
      setCollections(res.collections || []);
    } catch (err) {
      console.error('Fetch collections error:', err);
    } finally {
      setLoadingCollections(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFarmers();
    fetchCollections();
  }, [fetchFarmers, fetchCollections]);

  // Sync tab with URL search params if changed externally
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['entry', 'summary', 'history'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  // Live calculation of Total Amount
  const liveTotalAmount = useMemo(() => {
    const q = parseFloat(quantityLiters);
    const r = parseFloat(ratePerLiter);
    if (isNaN(q) || isNaN(r) || q <= 0 || r < 0) return 0;
    return Math.round(q * r * 100) / 100;
  }, [quantityLiters, ratePerLiter]);

  // Selected Farmer Profile
  const selectedFarmerProfile = useMemo(() => {
    return activeFarmers.find((f) => f._id === selectedFarmerId);
  }, [activeFarmers, selectedFarmerId]);

  // Handle Milk Collection Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedFarmerId) {
      setFormError('Please select an active connected farmer.');
      return;
    }

    if (!collectionDate) {
      setFormError('Please select a collection date.');
      return;
    }

    const qty = parseFloat(quantityLiters);
    if (isNaN(qty) || qty <= 0 || qty > 1000) {
      setFormError('Quantity must be a valid positive number between 0.1 and 1000 liters.');
      return;
    }

    const fat = parseFloat(fatPercentage);
    if (isNaN(fat) || fat < 0 || fat > 20) {
      setFormError('Fat percentage must be a number between 0 and 20%.');
      return;
    }

    const rate = parseFloat(ratePerLiter);
    if (isNaN(rate) || rate < 0 || rate > 500) {
      setFormError('Rate per liter must be a valid number between ₹0 and ₹500.');
      return;
    }

    // Client-side duplicate pre-check
    const isDuplicate = collections.some((c) => {
      if (!c.collectionDate) return false;
      const cDateStr = new Date(c.collectionDate).toISOString().split('T')[0];
      const matchFarmer = (c.farmer?._id || c.farmer) === selectedFarmerId;
      const matchDate = cDateStr === collectionDate;
      const matchSession = c.session === session;
      return matchFarmer && matchDate && matchSession;
    });

    if (isDuplicate) {
      setFormError(
        `A milk collection record already exists for ${
          selectedFarmerProfile?.name || 'this farmer'
        } on ${collectionDate} (${session} shift). Please verify your entry.`
      );
      return;
    }

    try {
      setSubmitLoading(true);
      const res = await milkCollectionService.createCollection(
        {
          farmerId: selectedFarmerId,
          collectionDate,
          session,
          quantityLiters: qty,
          fatPercentage: fat,
          ratePerLiter: rate
        },
        token
      );

      setFormSuccess(
        `Milk collection recorded successfully! (Amount: ₹${res.collection?.totalAmount?.toFixed(
          2
        ) || liveTotalAmount.toFixed(2)})`
      );

      // Reset numeric inputs
      setQuantityLiters('');
      setFatPercentage('');
      setRatePerLiter('');

      // Refresh collections in background
      await fetchCollections();
    } catch (err) {
      setFormError(err.message || 'Failed to record milk collection.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filtered Collections for History View
  const filteredCollections = useMemo(() => {
    return collections.filter((item) => {
      // Farmer filter
      if (filterFarmerId !== 'all') {
        const itemFarmerId = item.farmer?._id || item.farmer;
        if (itemFarmerId !== filterFarmerId) return false;
      }

      // Shift Session filter
      if (filterSession !== 'all' && item.session !== filterSession) {
        return false;
      }

      // Payment Status filter
      if (filterStatus !== 'all' && item.paymentStatus !== filterStatus) {
        return false;
      }

      // Date Range Presets
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
    filterFarmerId,
    filterSession,
    filterStatus,
    filterDatePreset,
    filterStartDate,
    filterEndDate
  ]);

  // Aggregated Stats for Filtered Collections
  const historyStats = useMemo(() => {
    const totalQty = filteredCollections.reduce((sum, c) => sum + (c.quantityLiters || 0), 0);
    const totalVal = filteredCollections.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    const settledVal = filteredCollections
      .filter((c) => c.paymentStatus === 'settled')
      .reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    const unpaidVal = filteredCollections
      .filter((c) => c.paymentStatus !== 'settled')
      .reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    const avgFat =
      filteredCollections.length > 0
        ? filteredCollections.reduce((sum, c) => sum + (c.fatPercentage || 0), 0) /
          filteredCollections.length
        : 0;

    return {
      totalQty: Math.round(totalQty * 10) / 10,
      totalVal: Math.round(totalVal * 100) / 100,
      settledVal: Math.round(settledVal * 100) / 100,
      unpaidVal: Math.round(unpaidVal * 100) / 100,
      avgFat: Math.round(avgFat * 10) / 10,
      count: filteredCollections.length
    };
  }, [filteredCollections]);

  // Fetch 10-Day Summary
  const fetchTenDaySummary = useCallback(async () => {
    if (!summaryFarmerId) return;

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

      const params = { farmerId: summaryFarmerId };
      if (start && end) {
        params.startDate = start;
        params.endDate = end;
      }

      const res = await milkCollectionService.getTenDaySummary(token, params);
      setSummaryData(res);
    } catch (err) {
      console.error('Ten day summary error:', err);
      setSummaryError(err.message || 'Failed to generate 10-day summary.');
    } finally {
      setLoadingSummary(false);
    }
  }, [token, summaryFarmerId, summaryCycle, summaryCustomStart, summaryCustomEnd]);

  useEffect(() => {
    if (activeTab === 'summary' && summaryFarmerId) {
      fetchTenDaySummary();
    }
  }, [activeTab, summaryFarmerId, summaryCycle, fetchTenDaySummary]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('dairyOwner:collection.title', 'Milk Management & Collection Console')}
        description={t('dairyOwner:collection.subtitle', 'Record morning/evening milk intakes, inspect past logs, and review authoritative 10-day billing summaries.')}
        breadcrumbs={[t('common:nav.home', 'Home'), t('common:roles.dairyOwner', 'Dairy Console'), t('dairyOwner:collection.title', 'Milk Management')]}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                fetchFarmers();
                fetchCollections();
                if (activeTab === 'summary') fetchTenDaySummary();
              }}
              disabled={loadingCollections || loadingFarmers}
              className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg shadow-xs transition"
              title={t('common:actions.refresh', 'Refresh Data')}
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  loadingCollections || loadingFarmers ? 'animate-spin' : ''
                }`}
              />
            </button>
            <Link
              to="/dairy-owner/payments"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <Wallet className="w-4 h-4" />
              <span>{t('dairyOwner:payments.title', 'Payment Ledger')}</span>
            </Link>
          </div>
        }
      />

      {/* Tabs Navigation Header */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => handleTabChange('entry')}
          className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'entry'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('dairyOwner:collection.newEntry', 'Record Shift Milk')}</span>
        </button>

        <button
          onClick={() => handleTabChange('summary')}
          className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'summary'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{t('farmer:milk.tenDaySummary', '10-Day Billing Summary')}</span>
        </button>

        <button
          onClick={() => handleTabChange('history')}
          className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{t('common:nav.milkCollections', 'Collection History Log')}</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: NEW MILK ENTRY FORM */}
      {/* ============================================================ */}
      {activeTab === 'entry' && (
        <div className="space-y-6">
          {formError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{formError}</span>
              </div>
              <button
                onClick={() => setFormError('')}
                className="text-red-500 hover:text-red-800 font-bold text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {formSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs sm:text-sm rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span>{formSuccess}</span>
              </div>
              <button
                onClick={() => setFormSuccess('')}
                className="text-green-600 hover:text-green-900 font-bold text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          <SectionCard
            title={t('dairyOwner:collection.recordDailyTitle', 'Record Daily Milk Collection')}
            subtitle={t('dairyOwner:collection.recordDailySubtitle', 'Authoritative recording of milk intake from actively connected farmers')}
          >
            {loadingFarmers ? (
              <div className="py-12 text-center text-slate-500 text-xs sm:text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                <span>{t('dairyOwner:collection.loadingActiveFarmers', 'Loading active connected farmers...')}</span>
              </div>
            ) : activeFarmers.length === 0 ? (
              <EmptyState
                title={t('dairyOwner:collection.noActiveFarmersTitle', 'No Active Farmers Available')}
                description={t('dairyOwner:collection.noActiveFarmersDesc', 'You must have actively connected farmers to record milk collections. Connect with farmers using their registered mobile number first.')}
                icon={Users}
                action={
                  <Link
                    to="/dairy-owner/farmers"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition"
                  >
                    {t('dairyOwner:collection.goToConnectedFarmers', 'Go to Connected Farmers')}
                  </Link>
                }
              />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Connected Farmer Selection */}
                  <div className="space-y-1.5 lg:col-span-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t('dairyOwner:collection.connectedFarmerRequired', 'Connected Farmer *')}</span>
                    </label>
                    <select
                      value={selectedFarmerId}
                      onChange={(e) => setSelectedFarmerId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm font-medium"
                      required
                    >
                      {activeFarmers.map((f) => (
                        <option key={f._id} value={f._id}>
                          {f.name} ({f.phone})
                        </option>
                      ))}
                    </select>
                    {selectedFarmerProfile && (
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-center justify-between">
                        <span>{t('dairyOwner:collection.connectedSince', 'Connected:')} <strong className="text-slate-800">{selectedFarmerProfile.name}</strong></span>
                        <span className="font-mono text-slate-500">{selectedFarmerProfile.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Collection Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t('dairyOwner:collection.collectionDateRequired', 'Collection Date *')}</span>
                    </label>
                    <input
                      type="date"
                      value={collectionDate}
                      onChange={(e) => setCollectionDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm font-mono"
                      required
                    />
                  </div>

                  {/* Shift Session Toggle */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t('dairyOwner:collection.shiftSessionRequired', 'Shift Session *')}</span>
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
                        <span>{t('dairyOwner:collection.morningShift', 'Morning Shift')}</span>
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
                        <span>{t('dairyOwner:collection.eveningShift', 'Evening Shift')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Milk Quantity (Liters) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                      <Droplets className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t('dairyOwner:collection.milkQuantityLiters', 'Milk Quantity (Liters) *')}</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="1000"
                      placeholder={t('dairyOwner:collection.quantityPlaceholder', 'e.g. 12.5')}
                      value={quantityLiters}
                      onChange={(e) => setQuantityLiters(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm font-mono font-medium"
                      required
                    />
                  </div>

                  {/* Fat Percentage */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">
                        %
                      </span>
                      <span>{t('dairyOwner:collection.fatPercentage', 'Fat Percentage (%) *')}</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      placeholder={t('dairyOwner:collection.fatPlaceholder', 'e.g. 4.5')}
                      value={fatPercentage}
                      onChange={(e) => setFatPercentage(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm font-mono font-medium"
                      required
                    />
                  </div>

                  {/* Rate per Liter (₹) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t('dairyOwner:collection.ratePerLiterRequired', 'Rate per Liter (₹/L) *')}</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="500"
                      placeholder={t('dairyOwner:collection.ratePlaceholder', 'e.g. 45.00')}
                      value={ratePerLiter}
                      onChange={(e) => setRatePerLiter(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm font-mono font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Instant Calculation Preview Banner */}
                <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 text-slate-700">
                    <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                      <Droplets className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        Automatic Amount Calculation
                      </div>
                      <div className="text-slate-600 text-xs font-mono mt-0.5">
                        {quantityLiters || '0'} L × ₹{ratePerLiter || '0'}/L (Fat: {fatPercentage || '0'}%)
                      </div>
                    </div>
                  </div>

                  <div className="text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">
                      Total Calculated Amount
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-emerald-700 font-mono">
                      ₹ {liveTotalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{submitLoading ? 'Saving Milk Record...' : 'Save Milk Record'}</span>
                  </button>
                </div>
              </form>
            )}
          </SectionCard>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: TEN-DAY BILLING SUMMARY */}
      {/* ============================================================ */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <SectionCard
            title={t('dairyOwner:collection.tenDayBillingTitle', '10-Day Billing & Payout Summary')}
            subtitle={t('dairyOwner:collection.tenDayBillingSubtitle', 'Authoritative milk collection and settlement summary for standard 10-day payment cycles')}
          >
            {/* Filter Toolbar for 10-Day Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-200">
              {/* Farmer Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('dairyOwner:collection.selectFarmerLabel', 'Select Farmer:')}</span>
                </label>
                <select
                  value={summaryFarmerId}
                  onChange={(e) => setSummaryFarmerId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {activeFarmers.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name} ({f.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cycle Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{t('dairyOwner:collection.tenDayBillingCycle', '10-Day Billing Cycle:')}</span>
                </label>
                <select
                  value={summaryCycle}
                  onChange={(e) => setSummaryCycle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="current">{t('dairyOwner:collection.current10DayPeriod', 'Current 10-Day Period')}</option>
                  <option value="cycle1">{t('dairyOwner:collection.cycle1', 'Cycle 1 (1st - 10th of Month)')}</option>
                  <option value="cycle2">{t('dairyOwner:collection.cycle2', 'Cycle 2 (11th - 20th of Month)')}</option>
                  <option value="cycle3">{t('dairyOwner:collection.cycle3', 'Cycle 3 (21st - End of Month)')}</option>
                  <option value="last10">{t('dairyOwner:collection.rollingLast10', 'Rolling Last 10 Days')}</option>
                  <option value="custom">{t('dairyOwner:collection.customDateRange', 'Custom Date Range')}</option>
                </select>
              </div>

              {/* Custom Date Inputs if 'custom' */}
              {summaryCycle === 'custom' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">{t('dairyOwner:collection.startDate', 'Start Date')}</label>
                    <input
                      type="date"
                      value={summaryCustomStart}
                      onChange={(e) => setSummaryCustomStart(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">{t('dairyOwner:collection.endDate', 'End Date')}</label>
                    <input
                      type="date"
                      value={summaryCustomEnd}
                      onChange={(e) => setSummaryCustomEnd(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-end">
                  <button
                    onClick={fetchTenDaySummary}
                    disabled={loadingSummary}
                    className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center space-x-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingSummary ? 'animate-spin' : ''}`} />
                    <span>{t('dairyOwner:collection.generateSummary', 'Generate Summary')}</span>
                  </button>
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
                <span>{t('dairyOwner:collection.calculatingMetrics', 'Calculating 10-day summary metrics...')}</span>
              </div>
            ) : !summaryData ? (
              <EmptyState
                title={t('dairyOwner:collection.selectFarmerToViewSummary', 'Select Farmer to View 10-Day Summary')}
                description={t('dairyOwner:collection.selectFarmerToViewSummaryDesc', 'Select a connected farmer and billing period above to generate the breakdown.')}
                icon={Calendar}
              />
            ) : (
              <div className="space-y-6 mt-4">
                {/* Period & Farmer Details */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">{t('dairyOwner:collection.summaryFor', 'Summary For:')} </span>
                    <strong className="text-slate-900 font-bold">{summaryData.farmer?.name}</strong>{' '}
                    <span className="text-slate-500 font-mono">({summaryData.farmer?.phone})</span>
                  </div>
                  <div className="font-mono text-slate-600">
                    Period: <span className="font-bold text-slate-800">{summaryData.period?.startDate}</span> to{' '}
                    <span className="font-bold text-slate-800">{summaryData.period?.endDate}</span>{' '}
                    <span className="text-indigo-600 font-semibold">({summaryData.period?.cycleName})</span>
                  </div>
                </div>

                {/* KPI Metrics distinguishing Recorded vs Paid vs Outstanding */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      {t('dairyOwner:collection.totalMilkSupplied', 'Total Milk Supplied')}
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
                      {t('dairyOwner:collection.milkAmountRecorded', 'Milk Amount Recorded')}
                    </span>
                    <span className="text-2xl font-bold text-blue-700 font-mono block mt-1">
                      ₹ {summaryData.summary?.totalRecordedAmount?.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Gross value of {summaryData.summary?.collectionCount} recorded shifts
                    </span>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      {t('dairyOwner:collection.amountAlreadyPaid', 'Amount Already Paid')}
                    </span>
                    <span className="text-2xl font-bold text-emerald-700 font-mono block mt-1">
                      ₹ {summaryData.summary?.amountPaid?.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                      {summaryData.summary?.settledCount} shifts settled in ledger
                    </span>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      {t('dairyOwner:collection.outstandingBalance', 'Outstanding Balance')}
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
                      {summaryData.summary?.unpaidCount} unpaid shifts pending settlement
                    </span>
                  </div>
                </div>

                {/* Day-by-Day Detailed Log */}
                {summaryData.dailyRecords?.length === 0 ? (
                  <EmptyState
                    title={t('dairyOwner:collection.noCollectionsFoundInPeriod', 'No Collections Found in Selected Period')}
                    description={t('dairyOwner:collection.noCollectionsFoundInPeriodDesc', 'No morning or evening milk records exist for this farmer in the selected 10-day period.')}
                    icon={Droplets}
                  />
                ) : (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                      Day-by-Day Shift Breakdown ({summaryData.dailyRecords?.length} Days)
                    </h4>

                    {/* Desktop View */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            <th className="py-2.5 px-3">{t('common:labels.date', 'Date')}</th>
                            <th className="py-2.5 px-3">{t('dairyOwner:collection.morningShift', 'Morning Shift')}</th>
                            <th className="py-2.5 px-3">{t('dairyOwner:collection.eveningShift', 'Evening Shift')}</th>
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
                                  {d.isFullySettled ? 'Settled' : 'Unpaid'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
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
                              {d.isFullySettled ? 'Settled' : 'Unpaid'}
                            </span>
                          </div>

                          <div className="space-y-1 font-mono text-[11px]">
                            {d.morning && (
                              <div className="flex justify-between text-amber-900">
                                <span>☀️ Morning: {d.morning.quantityLiters} L (Fat {d.morning.fatPercentage}%)</span>
                                <span className="font-semibold">₹{d.morning.totalAmount?.toFixed(2)}</span>
                              </div>
                            )}
                            {d.evening && (
                              <div className="flex justify-between text-indigo-900">
                                <span>🌙 Evening: {d.evening.quantityLiters} L (Fat {d.evening.fatPercentage}%)</span>
                                <span className="font-semibold">₹{d.evening.totalAmount?.toFixed(2)}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                            <span className="text-slate-700">Total: {d.dailyTotalQuantity} L</span>
                            <span className="text-emerald-700 font-mono">₹{d.dailyTotalAmount?.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {summaryData.summary?.outstandingAmount > 0 && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-amber-900">
                          There is an outstanding unpaid balance of{' '}
                          <strong>₹{summaryData.summary?.outstandingAmount?.toFixed(2)}</strong> for this farmer.
                        </span>
                        <Link
                          to={`/dairy-owner/payments?farmerId=${summaryFarmerId}`}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition shrink-0 ml-2"
                        >
                          Settle in Ledger →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: COLLECTION HISTORY LOG */}
      {/* ============================================================ */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <SectionCard
            title={t('dairyOwner:collection.historyLogTitle', 'Milk Collection History Log')}
            subtitle={t('dairyOwner:collection.historyLogSubtitle', 'Search, filter, and review all recorded shift collection entries')}
            action={
              <button
                onClick={fetchCollections}
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                title={t('common:actions.refresh', 'Refresh History')}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            }
          >
            {/* Filter Toolbar */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 mb-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('dairyOwner:collection.filterRecords', 'Filter Records:')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Farmer filter */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t('common:roles.farmer', 'Farmer')}</label>
                  <select
                    value={filterFarmerId}
                    onChange={(e) => setFilterFarmerId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="all">{t('dairyOwner:collection.allConnectedFarmers', 'All Connected Farmers')}</option>
                    {activeFarmers.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Shift Session filter */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t('dairyOwner:collection.shift', 'Shift')}</label>
                  <select
                    value={filterSession}
                    onChange={(e) => setFilterSession(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="all">{t('dairyOwner:collection.allShifts', 'All Shifts (Morning & Evening)')}</option>
                    <option value="morning">{t('dairyOwner:collection.morningShiftOnly', 'Morning Shift Only')}</option>
                    <option value="evening">{t('dairyOwner:collection.eveningShiftOnly', 'Evening Shift Only')}</option>
                  </select>
                </div>

                {/* Status filter */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t('dairyOwner:collection.paymentStatus', 'Payment Status')}</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="all">{t('dairyOwner:collection.allStatuses', 'All Statuses')}</option>
                    <option value="unpaid">{t('dairyOwner:collection.unpaidOnly', 'Unpaid Only')}</option>
                    <option value="settled">{t('dairyOwner:collection.settledOnly', 'Settled Only')}</option>
                  </select>
                </div>

                {/* Date preset filter */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t('dairyOwner:collection.dateRange', 'Date Range')}</label>
                  <select
                    value={filterDatePreset}
                    onChange={(e) => setFilterDatePreset(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="all">{t('dairyOwner:collection.allRecordedDates', 'All Recorded Dates')}</option>
                    <option value="today">{t('dairyOwner:collection.today', 'Today')}</option>
                    <option value="last7days">{t('dairyOwner:collection.last7Days', 'Last 7 Days')}</option>
                    <option value="last10days">{t('dairyOwner:collection.last10Days', 'Last 10 Days')}</option>
                    <option value="thisMonth">{t('dairyOwner:collection.thisMonth', 'This Month')}</option>
                    <option value="custom">{t('dairyOwner:collection.customDateRange', 'Custom Date Range')}</option>
                  </select>
                </div>
              </div>

              {filterDatePreset === 'custom' && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t('dairyOwner:collection.startDate', 'Start Date')}</label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t('dairyOwner:collection.endDate', 'End Date')}</label>
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

            {/* Filter Summary Strip */}
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-semibold">{t('dairyOwner:collection.recordsCount', 'Records')}</span>
                <span className="font-bold text-slate-900 font-mono">{historyStats.count} entries</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-semibold">{t('dairyOwner:collection.totalQuantity', 'Total Quantity')}</span>
                <span className="font-bold text-slate-900 font-mono">{historyStats.totalQty} L</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-semibold">{t('dairyOwner:collection.totalValue', 'Total Value')}</span>
                <span className="font-bold text-emerald-700 font-mono">₹{historyStats.totalVal.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-semibold">{t('dairyOwner:collection.unsettledValue', 'Unsettled Value')}</span>
                <span className="font-bold text-amber-700 font-mono">₹{historyStats.unpaidVal.toFixed(2)}</span>
              </div>
            </div>

            {loadingCollections ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                <span>{t('dairyOwner:collection.loadingHistory', 'Loading collection history...')}</span>
              </div>
            ) : filteredCollections.length === 0 ? (
              <EmptyState
                title={t('dairyOwner:collection.noCollectionRecordsFound', 'No Collection Records Found')}
                description={t('dairyOwner:collection.noCollectionRecordsFoundDesc', 'No milk collection records match the selected filter parameters.')}
                icon={History}
              />
            ) : (
              <div>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">{t('common:labels.date', 'Date')}</th>
                        <th className="py-3 px-4">{t('common:roles.farmer', 'Farmer')}</th>
                        <th className="py-3 px-4">{t('common:labels.session', 'Session')}</th>
                        <th className="py-3 px-4 text-right">{t('common:labels.quantity', 'Quantity (L)')}</th>
                        <th className="py-3 px-4 text-right">{t('common:labels.fat', 'Fat (%)')}</th>
                        <th className="py-3 px-4 text-right">{t('common:labels.rate', 'Rate (₹/L)')}</th>
                        <th className="py-3 px-4 text-right">{t('common:labels.totalAmount', 'Total Amount')}</th>
                        <th className="py-3 px-4 text-center">{t('farmer:milk.settlementStatus', 'Settlement Status')}</th>
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
                              {getSessionLabel(item.session, t)}
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
                              {item.paymentStatus === 'settled' ? 'Settled' : 'Unpaid'}
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
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{item.farmer?.name}</h4>
                          <p className="text-xs text-slate-500 font-mono">{item.farmer?.phone}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.session === 'morning'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {getSessionLabel(item.session, t)}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              item.paymentStatus === 'settled'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {getStatusLabel(item.paymentStatus === 'settled' ? 'paid' : 'unpaid', t)}
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
        </div>
      )}
    </div>
  );
};
