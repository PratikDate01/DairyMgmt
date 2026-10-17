import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { dairyFarmerService } from '../../services/dairyFarmerService';
import { milkCollectionService } from '../../services/milkCollectionService';
import { paymentService } from '../../services/paymentService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/EmptyState';
import { getStatusLabel, getPaymentMethodLabel } from '../../i18n/statusMap';
import {
  Milk,
  Users,
  Wallet,
  Clock,
  UserPlus,
  PlusCircle,
  Sun,
  Moon,
  TrendingUp,
  CreditCard,
  Calendar,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DairyOwnerDashboard = () => {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [connections, setConnections] = useState([]);
  const [collections, setCollections] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentMetrics, setPaymentMetrics] = useState({ totalGross: 0, totalPaid: 0, totalPending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      if (token) {
        const [connData, collRes, payRes] = await Promise.all([
          dairyFarmerService.getDairyFarmers(token),
          milkCollectionService.getDairyOwnerCollections(token),
          paymentService.getDairyOwnerPayments(token)
        ]);
        setConnections(connData || []);
        setCollections(collRes.collections || []);
        setPayments(payRes.payments || []);
        if (payRes.metrics) {
          setPaymentMetrics(payRes.metrics);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch dairy owner data:', err.message);
      setError(err.message || t('empty.noData'));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeFarmers = connections.filter((c) => c.status === 'active' && c.farmer);
  const pendingRequests = connections.filter((c) => c.status === 'pending');

  // Robust date comparison helper
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    const matchUtc =
      d.getUTCFullYear() === now.getFullYear() &&
      d.getUTCMonth() === now.getMonth() &&
      d.getUTCDate() === now.getDate();
    const matchLocal =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    return matchUtc || matchLocal;
  };

  const todayCollections = collections.filter((c) => isToday(c.collectionDate));

  const todayMorningLiters = Math.round(
    todayCollections
      .filter((c) => c.session === 'morning')
      .reduce((sum, c) => sum + (c.quantityLiters || 0), 0) * 10
  ) / 10;

  const todayEveningLiters = Math.round(
    todayCollections
      .filter((c) => c.session === 'evening')
      .reduce((sum, c) => sum + (c.quantityLiters || 0), 0) * 10
  ) / 10;

  const todayTotalLiters = Math.round((todayMorningLiters + todayEveningLiters) * 10) / 10;
  const todayTotalValue = Math.round(
    todayCollections.reduce((sum, c) => sum + (c.totalAmount || 0), 0) * 100
  ) / 100;

  // Today's disbursed payment amount
  const todayPayments = payments.filter(
    (p) => p.paymentDate && p.paymentStatus !== 'cancelled' && isToday(p.paymentDate)
  );
  const todayPaidAmount = Math.round(
    todayPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0) * 100
  ) / 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('dairyOwner:dashboard.title')}
        description={t('dairyOwner:dashboard.welcome', { name: user?.name || t('roles.dairyOwner') })}
        breadcrumbs={[t('home'), t('dairyOwner:dashboard.title')]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg shadow-xs transition"
              title={t('actions.refresh')}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/dairy-owner/milk-collection"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('dairyOwner:dashboard.recordMilk')}</span>
            </Link>
            <Link
              to="/dairy-owner/milk-collection?tab=summary"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>{t('dairyOwner:reports.billingCycle')}</span>
            </Link>
            <Link
              to="/dairy-owner/payments"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <Wallet className="w-4 h-4" />
              <span>{t('dairyOwner:dashboard.processPayment')}</span>
            </Link>
            <Link
              to="/dairy-owner/farmers"
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <UserPlus className="w-4 h-4 text-slate-500" />
              <span>{t('dairyOwner:dashboard.viewFarmers')}</span>
            </Link>
          </div>
        }
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-600 hover:text-red-800 font-semibold text-xs ml-4"
          >
            {t('actions.close')}
          </button>
        </div>
      )}

      {/* KPI Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dairyOwner:dashboard.activeFarmers')}
          value={loading ? t('actions.loading') : `${activeFarmers.length} ${t('roles.farmer')}`}
          icon={Users}
          badgeText={activeFarmers.length > 0 ? `${activeFarmers.length} ${t('status.active')}` : t('dairyOwner:farmers.noActive')}
          badgeType={activeFarmers.length > 0 ? 'success' : 'neutral'}
        />
        <StatCard
          title={t('dairyOwner:dashboard.todayIntake')}
          value={loading ? t('actions.loading') : `${todayTotalLiters} ${t('labels.litersShort')}`}
          icon={Milk}
          badgeText={
            todayCollections.length > 0
              ? `₹${todayTotalValue.toFixed(2)} (${todayCollections.length})`
              : t('empty.noData')
          }
          badgeType={todayCollections.length > 0 ? 'success' : 'neutral'}
        />
        <StatCard
          title={t('dairyOwner:reports.totalDisbursed')}
          value={loading ? t('actions.loading') : `₹ ${todayPaidAmount.toFixed(2)}`}
          icon={CreditCard}
          badgeText={
            todayPayments.length > 0
              ? `${todayPayments.length} ${t('status.paid')}`
              : t('empty.noData')
          }
          badgeType={todayPaidAmount > 0 ? 'success' : 'neutral'}
        />
        <StatCard
          title={t('dairyOwner:dashboard.pendingPayouts')}
          value={loading ? t('actions.loading') : `₹ ${paymentMetrics.totalPending.toFixed(2)}`}
          icon={Wallet}
          badgeText={paymentMetrics.totalPending > 0 ? t('status.unpaid') : t('status.paid')}
          badgeType={paymentMetrics.totalPending > 0 ? 'amber' : 'success'}
        />
      </div>

      {/* Shift Breakdown Strip */}
      <div className="p-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-100 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-100 text-amber-800 rounded-lg shrink-0">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {t('dairyOwner:dashboard.morningShift')}
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-800 font-mono">
              {todayMorningLiters} {t('labels.liters')}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 border-t sm:border-t-0 sm:border-l border-blue-100 pt-2 sm:pt-0 sm:pl-4">
          <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-lg shrink-0">
            <Moon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {t('dairyOwner:dashboard.eveningShift')}
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-800 font-mono">
              {todayEveningLiters} {t('labels.liters')}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 border-t sm:border-t-0 sm:border-l border-blue-100 pt-2 sm:pt-0 sm:pl-4">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {t('dairyOwner:dashboard.todayValue')}
            </div>
            <div className="text-sm sm:text-base font-bold text-emerald-700 font-mono">
              ₹ {todayTotalValue.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Collections Register & Connected Farmers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Milk Collections (2 cols wide on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard
            title={t('dairyOwner:collection.recentLogs')}
            subtitle={t('dairyOwner:collection.subtitle')}
            action={
              <Link
                to="/dairy-owner/milk-collection"
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
              >
                <span>{t('actions.view')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {loading ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                <span>{t('actions.loading')}</span>
              </div>
            ) : collections.length === 0 ? (
              <EmptyState
                title={t('dairyOwner:collection.noEntriesToday')}
                description={t('empty.noRecordsFound')}
                icon={Milk}
              />
            ) : (
              <div className="space-y-2.5">
                {collections.slice(0, 6).map((item) => (
                  <div
                    key={item._id}
                    className="p-3 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          item.session === 'morning'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        }`}
                        title={item.session === 'morning' ? t('status.morning') : t('status.evening')}
                      >
                        {item.session === 'morning' ? (
                          <Sun className="w-4 h-4" />
                        ) : (
                          <Moon className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-slate-900">
                            {item.farmer?.name || t('roles.farmer')}
                          </h4>
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
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {new Date(item.collectionDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}{' '}
                          • {t('labels.fat')}: {item.fatPercentage}% • {t('labels.rate')}: ₹{item.ratePerLiter}/L
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end sm:space-x-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {item.quantityLiters} {t('labels.litersShort')}
                        </div>
                        <div className="font-mono text-emerald-700 font-bold text-xs">
                          ₹{item.totalAmount?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Recent Settlement Activity */}
          <SectionCard
            title={t('dairyOwner:payments.pastSettlements')}
            subtitle={t('dairyOwner:payments.subtitle')}
            action={
              <Link
                to="/dairy-owner/payments"
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
              >
                <span>{t('dairyOwner:dashboard.processPayment')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {loading ? (
              <div className="py-8 text-center text-slate-500 text-xs">{t('actions.loading')}</div>
            ) : payments.length === 0 ? (
              <EmptyState
                title={t('dairyOwner:payments.noUnsettled')}
                description={t('empty.noRecordsFound')}
                icon={Wallet}
              />
            ) : (
              <div className="space-y-2.5">
                {payments.slice(0, 4).map((p) => (
                  <div
                    key={p._id}
                    className="p-3 bg-slate-50/80 border border-slate-200/90 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                        ₹
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{p.farmer?.name || t('roles.farmer')}</h4>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short'
                          })}{' '}
                          • {t('dairyOwner:payments.paymentMode')}: <span className="uppercase font-semibold">{getPaymentMethodLabel(p.paymentMethod, t)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-700">
                        ₹{p.paidAmount?.toFixed(2)}
                      </div>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize ${
                          p.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : p.paymentStatus === 'partiallyPaid'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {getStatusLabel(p.paymentStatus, t)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right Column: Connected Farmers & Quick Actions */}
        <div className="space-y-6">
          <SectionCard
            title={t('dairyOwner:dashboard.activeFarmers')}
            subtitle={t('dairyOwner:farmers.subtitle')}
            action={
              <Link
                to="/dairy-owner/farmers"
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                {t('actions.view')} ({activeFarmers.length}) →
              </Link>
            }
          >
            {loading ? (
              <div className="py-8 text-center text-slate-500 text-xs">{t('actions.loading')}</div>
            ) : activeFarmers.length === 0 ? (
              <EmptyState
                title={t('dairyOwner:farmers.noActive')}
                description={t('empty.noRecordsFound')}
                icon={Users}
              />
            ) : (
              <div className="space-y-2.5">
                {activeFarmers.slice(0, 6).map((item) => (
                  <div
                    key={item._id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                        {item.farmer?.name?.slice(0, 2).toUpperCase() || 'FA'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 leading-tight">
                          {item.farmer?.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {item.farmer?.phone}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/dairy-owner/milk-collection?farmerId=${item.farmer?._id}`}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold rounded-lg transition"
                      title={t('dairyOwner:collection.newEntry')}
                    >
                      {t('actions.add')}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Quick Shortcuts Card */}
          <SectionCard
            title={t('farmer:dashboard.quickActions')}
            subtitle={t('dairyOwner:dashboard.subtitle')}
          >
            <div className="space-y-2">
              <Link
                to="/dairy-owner/milk-collection"
                className="w-full p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-blue-700 transition"
              >
                <div className="flex items-center space-x-2">
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                  <span>{t('dairyOwner:dashboard.recordMilk')}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/dairy-owner/milk-collection?tab=summary"
                className="w-full p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-indigo-700 transition"
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>{t('dairyOwner:reports.billingCycle')}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/dairy-owner/payments"
                className="w-full p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-lg flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-emerald-700 transition"
              >
                <div className="flex items-center space-x-2">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span>{t('dairyOwner:dashboard.processPayment')}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/dairy-owner/reports"
                className="w-full p-2.5 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 rounded-lg flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-purple-700 transition"
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span>{t('dairyOwner:dashboard.viewReports')}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
