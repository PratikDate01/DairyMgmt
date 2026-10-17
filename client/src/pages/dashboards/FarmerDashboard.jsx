import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { dairyFarmerService } from '../../services/dairyFarmerService';
import { milkCollectionService } from '../../services/milkCollectionService';
import { paymentService } from '../../services/paymentService';
import { cattleService } from '../../services/cattleService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/EmptyState';
import { getStatusLabel, getRoleLabel, getGenderLabel } from '../../i18n/statusMap';
import {
  Milk,
  Stethoscope,
  Wallet,
  UserCheck,
  CheckCircle2,
  Sun,
  Moon,
  HeartPulse,
  Plus,
  Store,
  Scan,
  FileText,
  Pill,
  MessageSquare,
  ShoppingBag
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FarmerDashboard = () => {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [connections, setConnections] = useState([]);
  const [collections, setCollections] = useState([]);
  const [paymentMetrics, setPaymentMetrics] = useState({ totalPaid: 0, totalPending: 0 });
  const [cattleList, setCattleList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (token) {
          const [connData, collRes, payRes, cattleRes] = await Promise.all([
            dairyFarmerService.getFarmerDairies(token),
            milkCollectionService.getFarmerCollections(token),
            paymentService.getFarmerPayments(token),
            cattleService.getFarmerCattle(token).catch(() => ({ cattle: [] }))
          ]);
          setConnections(connData);
          setCollections(collRes.collections || []);
          if (payRes.metrics) {
            setPaymentMetrics(payRes.metrics);
          }
          setCattleList(cattleRes.cattle || []);
        }
      } catch (err) {
        console.warn('Failed to fetch farmer dashboard data:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token]);

  const activeConnection = connections.find((c) => c.status === 'active');
  const pendingRequests = connections.filter((c) => c.status === 'pending');

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

  const todayQty = Math.round(
    todayCollections.reduce((sum, item) => sum + (item.quantityLiters || 0), 0) * 10
  ) / 10;

  const todayValue = Math.round(
    todayCollections.reduce((sum, item) => sum + (item.totalAmount || 0), 0) * 100
  ) / 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('farmer:dashboard.title')}
        description={t('farmer:dashboard.welcome', { name: user?.name || t('roles.farmer') })}
        breadcrumbs={[t('home'), t('farmer:dashboard.title')]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/farmer/fodder-marketplace"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <Store className="w-4 h-4" />
              <span>{t('farmer:dashboard.fodderMarket')}</span>
            </Link>
            <Link
              to="/farmer/cattle"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <HeartPulse className="w-4 h-4" />
              <span>{t('farmer:cattle.title')}</span>
            </Link>
            <Link
              to="/farmer/milk-collections"
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <Milk className="w-4 h-4 text-slate-500" />
              <span>{t('farmer:milk.title')}</span>
            </Link>
            <Link
              to="/farmer/payments"
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <Wallet className="w-4 h-4 text-slate-500" />
              <span>{t('farmer:payments.title')}</span>
            </Link>
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('farmer:cattle.title')}
          value={loading ? t('actions.loading') : `${cattleList.length} ${t('farmer:dashboard.registeredCattle')}`}
          icon={HeartPulse}
          badgeText={cattleList.length > 0 ? `${cattleList.length} ${t('status.active')}` : t('farmer:cattle.noCattleFound')}
          badgeType={cattleList.length > 0 ? 'success' : 'neutral'}
        />
        <StatCard
          title={t('farmer:dashboard.activeDairyPartner')}
          value={loading ? t('actions.loading') : activeConnection ? activeConnection.dairyOwner?.name || t('status.active') : t('status.inactive')}
          icon={Milk}
          badgeText={activeConnection ? t('status.active') : pendingRequests.length > 0 ? `${pendingRequests.length} ${t('status.pending')}` : t('status.inactive')}
          badgeType={activeConnection ? 'success' : pendingRequests.length > 0 ? 'amber' : 'neutral'}
        />
        <StatCard
          title={t('farmer:dashboard.todaysCollections')}
          value={loading ? t('actions.loading') : `${todayQty} ${t('labels.liters')}`}
          icon={Milk}
          badgeText={
            todayCollections.length > 0
              ? `₹${todayValue.toFixed(2)} (${todayCollections.length})`
              : t('empty.noData')
          }
          badgeType={todayCollections.length > 0 ? 'success' : 'neutral'}
        />
        <StatCard
          title={t('farmer:payments.totalPending')}
          value={loading ? t('actions.loading') : `₹ ${paymentMetrics.totalPending.toFixed(2)}`}
          icon={Wallet}
          badgeText={paymentMetrics.totalPending > 0 ? t('status.unpaid') : t('status.paid')}
          badgeType={paymentMetrics.totalPending > 0 ? 'amber' : 'success'}
        />
      </div>

      {/* Livestock Healthcare & Veterinary Services Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-300 block mb-0.5">
            {t('nav.veterinaryRequests')}
          </span>
          <h3 className="text-sm font-extrabold tracking-tight">{t('farmer:aiScanner.title')}</h3>
          <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
            {t('farmer:aiScanner.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/farmer/ai-scanner"
            className="px-3.5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>{t('farmer:dashboard.scanDisease')}</span>
          </Link>
          <Link
            to="/farmer/vet-requests"
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition flex items-center space-x-1.5"
          >
            <Stethoscope className="w-3.5 h-3.5 text-blue-300" />
            <span>{t('farmer:vetRequests.title')}</span>
          </Link>
          <Link
            to="/farmer/medicines"
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition flex items-center space-x-1.5"
          >
            <Pill className="w-3.5 h-3.5 text-emerald-300" />
            <span>{t('farmer:medicines.title')}</span>
          </Link>
          <Link
            to="/complaints"
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition flex items-center space-x-1.5"
            title={t('nav.complaintsSupport')}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('farmer:dashboard.support')}</span>
          </Link>
        </div>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile & Cattle Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <SectionCard title={t('farmer:dashboard.welcome', { name: user?.name || '' })} subtitle={user?.phone}>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">{t('auth:fullName')}</span>
                <span className="font-semibold text-slate-800">{user?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">{t('auth:mobileNumber')}</span>
                <span className="font-mono text-slate-800">{user?.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">{t('activeRole')}</span>
                <span className="font-semibold text-blue-600 capitalize flex items-center">
                  <UserCheck className="w-3.5 h-3.5 mr-1" />
                  {getRoleLabel(user?.role, t)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">{t('labels.status')}</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-green-50 text-green-700 rounded border border-green-200">
                  {t('status.active')}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* My Cattle Summary Section */}
          <SectionCard
            title={t('farmer:dashboard.myLivestock')}
            subtitle={t('farmer:cattle.subtitle')}
            action={
              <Link to="/farmer/cattle" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                {t('actions.view')} →
              </Link>
            }
          >
            {loading ? (
              <div className="py-6 text-center text-slate-500 text-xs">{t('actions.loading')}</div>
            ) : cattleList.length === 0 ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-slate-500">{t('farmer:cattle.noCattleFound')}</p>
                <Link
                  to="/farmer/cattle"
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('farmer:cattle.registerBtn')}</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {cattleList.slice(0, 3).map((item) => (
                  <div key={item._id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xl">🐄</span>
                      <div>
                        <h4 className="font-bold text-slate-800 leading-tight">{item.nameTag}</h4>
                        <p className="text-[10px] text-slate-500">{item.breed} • {getGenderLabel(item.gender, t)}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                      item.healthStatus === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {getStatusLabel(item.healthStatus, t)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right Column: Active Connections & Collections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Connection */}
          <SectionCard
            title={t('farmer:connections.connectedDairy')}
            subtitle={t('farmer:connections.subtitle')}
            action={
              <Link to="/farmer/connections" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                {t('actions.view')} →
              </Link>
            }
          >
            {activeConnection ? (
              <div className="p-4 bg-green-50/60 border border-green-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-800 font-bold text-sm flex items-center justify-center">
                    🥛
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{activeConnection.dairyOwner?.name}</h4>
                    <p className="text-xs text-slate-600 font-mono">{t('labels.phone')}: {activeConnection.dairyOwner?.phone}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-800 rounded border border-green-200 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-green-600" /> {t('status.active')}
                </span>
              </div>
            ) : (
              <EmptyState
                title={t('farmer:dashboard.noDairyConnected')}
                description={t('farmer:connections.noConnections')}
                icon={Milk}
              />
            )}
          </SectionCard>

          {/* Recent Milk Collection Records */}
          <SectionCard
            title={t('farmer:milk.title')}
            subtitle={t('farmer:milk.subtitle')}
            action={
              <Link to="/farmer/milk-collections" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                {t('actions.view')} →
              </Link>
            }
          >
            {loading ? (
              <div className="py-8 text-center text-slate-500 text-xs">{t('actions.loading')}</div>
            ) : collections.length === 0 ? (
              <EmptyState
                title={t('farmer:milk.noCollections')}
                description={t('empty.noRecordsFound')}
                icon={Milk}
              />
            ) : (
              <div className="space-y-3">
                {collections.slice(0, 4).map((item) => (
                  <div key={item._id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-2 rounded-lg shrink-0 ${item.session === 'morning' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                        {item.session === 'morning' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-slate-800">{item.dairyOwner?.name || t('roles.dairyOwner')}</h4>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase ${
                            item.paymentStatus === 'settled' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {getStatusLabel(item.paymentStatus === 'settled' ? 'paid' : 'unpaid', t)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {new Date(item.collectionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {t('labels.fat')}: {item.fatPercentage}% • ₹{item.ratePerLiter}/L
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900">{item.quantityLiters} {t('labels.litersShort')}</div>
                      <div className="font-mono text-emerald-700 font-semibold text-[11px]">₹{item.totalAmount?.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
