import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import { complaintService } from '../../services/complaintService';
import { getRoleLabel, getStatusLabel } from '../../i18n/statusMap';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Users,
  Building2,
  Stethoscope,
  Store,
  ShieldCheck,
  ShieldAlert,
  HeartPulse,
  Pill,
  ShoppingBag,
  Activity,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Check,
  X,
  Send,
  MessageSquare,
  BarChart3,
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

export const AdminDashboard = () => {
  const { t } = useTranslation(['admin', 'common', 'complaints']);
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  // Overview Stats & Recent Feeds
  const [stats, setStats] = useState(null);
  const [recentFeeds, setRecentFeeds] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Tab Data States
  const [usersList, setUsersList] = useState([]);
  const [verificationsList, setVerificationsList] = useState([]);
  const [cattleList, setCattleList] = useState([]);
  const [vetRequestsList, setVetRequestsList] = useState([]);
  const [medicinesList, setMedicinesList] = useState([]);
  const [fodderList, setFodderList] = useState([]);
  const [complaintsList, setComplaintsList] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // UI / Feedback States
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Filters
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');

  const [verificationRoleFilter, setVerificationRoleFilter] = useState('veterinarian');
  const [verificationStatusFilter, setVerificationStatusFilter] = useState('all');

  const [cattleHealthFilter, setCattleHealthFilter] = useState('all');
  const [cattleSearch, setCattleSearch] = useState('');

  const [vetRequestStatusFilter, setVetRequestStatusFilter] = useState('all');
  const [vetRequestRiskFilter, setVetRequestRiskFilter] = useState('all');

  const [medicineCategoryFilter, setMedicineCategoryFilter] = useState('all');
  const [medicineSearch, setMedicineSearch] = useState('');

  const [fodderStatusFilter, setFodderStatusFilter] = useState('all');
  const [fodderSearch, setFodderSearch] = useState('');

  const [complaintStatusFilter, setComplaintStatusFilter] = useState('all');
  const [complaintCategoryFilter, setComplaintCategoryFilter] = useState('all');

  // Modals & Details Drawers
  const [selectedVetRequest, setSelectedVetRequest] = useState(null);
  const [verificationModal, setVerificationModal] = useState({
    isOpen: false,
    user: null,
    status: 'approved',
    licenseNumber: '',
    notes: ''
  });
  const [complaintModal, setComplaintModal] = useState({
    isOpen: false,
    complaint: null,
    status: 'in_progress',
    adminNotes: ''
  });
  const [newComplaintModal, setNewComplaintModal] = useState({
    isOpen: false,
    title: '',
    category: 'general',
    description: ''
  });

  const clearFeedback = () => setFeedback({ type: '', message: '' });

  // Set URL search param tab
  const setTab = (tabName) => {
    setSearchParams({ tab: tabName });
    clearFeedback();
  };

  // 1. Fetch Overview Stats
  const fetchOverviewStats = useCallback(async () => {
    if (!token) return;
    try {
      setStatsLoading(true);
      const res = await adminService.getOverviewStats(token);
      if (res.success) {
        setStats(res.stats);
        setRecentFeeds(res.recent);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load overview metrics' });
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  // 2. Fetch Tab Specific Data
  const fetchTabData = useCallback(async () => {
    if (!token) return;
    setDataLoading(true);
    clearFeedback();
    try {
      if (activeTab === 'users') {
        const res = await adminService.getUsers(token, {
          role: userRoleFilter,
          status: userStatusFilter,
          search: userSearch
        });
        setUsersList(res.users || []);
      } else if (activeTab === 'verifications') {
        const res = await adminService.getUsers(token, {
          role: verificationRoleFilter,
          verificationStatus: verificationStatusFilter
        });
        setVerificationsList(res.users || []);
      } else if (activeTab === 'cattle') {
        const res = await adminService.getCattle(token, {
          healthStatus: cattleHealthFilter,
          search: cattleSearch
        });
        setCattleList(res.cattle || []);
      } else if (activeTab === 'vet-requests') {
        const res = await adminService.getVetRequests(token, {
          status: vetRequestStatusFilter,
          riskLevel: vetRequestRiskFilter
        });
        setVetRequestsList(res.requests || []);
      } else if (activeTab === 'medicines') {
        const res = await adminService.getMedicines(token, {
          category: medicineCategoryFilter,
          search: medicineSearch
        });
        setMedicinesList(res.medicines || []);
      } else if (activeTab === 'fodder') {
        const res = await adminService.getFodderListings(token, {
          status: fodderStatusFilter,
          search: fodderSearch
        });
        setFodderList(res.listings || []);
      } else if (activeTab === 'complaints') {
        const res = await adminService.getComplaints(token, {
          status: complaintStatusFilter,
          category: complaintCategoryFilter
        });
        setComplaintsList(res.complaints || []);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load records' });
    } finally {
      setDataLoading(false);
    }
  }, [
    token,
    activeTab,
    userRoleFilter,
    userStatusFilter,
    userSearch,
    verificationRoleFilter,
    verificationStatusFilter,
    cattleHealthFilter,
    cattleSearch,
    vetRequestStatusFilter,
    vetRequestRiskFilter,
    medicineCategoryFilter,
    medicineSearch,
    fodderStatusFilter,
    fodderSearch,
    complaintStatusFilter,
    complaintCategoryFilter
  ]);

  useEffect(() => {
    fetchOverviewStats();
  }, [fetchOverviewStats]);

  useEffect(() => {
    if (activeTab !== 'overview' && activeTab !== 'reports') {
      fetchTabData();
    }
  }, [activeTab, fetchTabData]);

  // Actions
  const handleToggleUserStatus = async (targetUser) => {
    if (!window.confirm(`Are you sure you want to ${targetUser.isActive ? 'suspend' : 'activate'} ${targetUser.name}'s account?`)) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await adminService.toggleUserStatus(token, targetUser._id);
      setFeedback({ type: 'success', message: res.message });
      fetchTabData();
      fetchOverviewStats();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenVerificationModal = (targetUser, initialStatus = 'approved') => {
    setVerificationModal({
      isOpen: true,
      user: targetUser,
      status: initialStatus,
      licenseNumber: targetUser.licenseNumber || '',
      notes: targetUser.verificationNotes || ''
    });
  };

  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    if (!verificationModal.user) return;
    try {
      setActionLoading(true);
      const res = await adminService.updateUserVerification(token, verificationModal.user._id, {
        status: verificationModal.status,
        notes: verificationModal.notes,
        licenseNumber: verificationModal.licenseNumber
      });
      setFeedback({ type: 'success', message: res.message });
      setVerificationModal({ isOpen: false, user: null, status: 'approved', licenseNumber: '', notes: '' });
      fetchTabData();
      fetchOverviewStats();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleModerateFodder = async (listingId, newStatus) => {
    try {
      setActionLoading(true);
      const res = await adminService.moderateFodderListing(token, listingId, newStatus);
      setFeedback({ type: 'success', message: res.message });
      fetchTabData();
      fetchOverviewStats();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenComplaintModal = (complaint) => {
    setComplaintModal({
      isOpen: true,
      complaint,
      status: complaint.status || 'in_progress',
      adminNotes: complaint.adminNotes || ''
    });
  };

  const handleSubmitComplaintResolution = async (e) => {
    e.preventDefault();
    if (!complaintModal.complaint) return;
    try {
      setActionLoading(true);
      const res = await adminService.updateComplaintStatus(token, complaintModal.complaint._id, {
        status: complaintModal.status,
        adminNotes: complaintModal.adminNotes
      });
      setFeedback({ type: 'success', message: res.message });
      setComplaintModal({ isOpen: false, complaint: null, status: 'in_progress', adminNotes: '' });
      fetchTabData();
      fetchOverviewStats();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateNewComplaint = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await complaintService.submitComplaint(token, {
        title: newComplaintModal.title,
        category: newComplaintModal.category,
        description: newComplaintModal.description
      });
      setFeedback({ type: 'success', message: res.message });
      setNewComplaintModal({ isOpen: false, title: '', category: 'general', description: '' });
      if (activeTab === 'complaints') {
        fetchTabData();
      }
      fetchOverviewStats();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const navigationTabs = [
    { id: 'overview', label: t('admin:dashboard.tabs.overview', 'Overview & KPIs'), icon: BarChart3 },
    { id: 'users', label: t('admin:dashboard.tabs.users', 'User Directory'), icon: Users, badge: stats?.users?.totalUsers },
    { id: 'verifications', label: t('admin:dashboard.tabs.verifications', 'Verifications'), icon: ShieldCheck, badge: (stats?.users?.pendingVetVerifications || 0) + (stats?.users?.pendingStoreVerifications || 0) },
    { id: 'cattle', label: t('admin:dashboard.tabs.cattle', 'Cattle Records'), icon: HeartPulse, badge: stats?.operations?.totalCattle },
    { id: 'vet-requests', label: t('admin:dashboard.tabs.vetRequests', 'Vet Requests'), icon: Activity, badge: stats?.operations?.activeVetRequests },
    { id: 'medicines', label: t('admin:dashboard.tabs.medicines', 'Medicines'), icon: Pill, badge: stats?.operations?.totalMedicines },
    { id: 'fodder', label: t('admin:dashboard.tabs.fodder', 'Fodder Listings'), icon: Store, badge: stats?.operations?.activeFodderListings },
    { id: 'complaints', label: t('admin:dashboard.tabs.complaints', 'Complaints'), icon: MessageSquare, badge: stats?.operations?.openComplaints },
    { id: 'reports', label: t('admin:reports.title', 'System Reports'), icon: FileText }
  ];

  const roleLabelMap = {
    farmer: getRoleLabel('farmer', t),
    dairyOwner: getRoleLabel('dairyOwner', t),
    veterinarian: getRoleLabel('veterinarian', t),
    medicalProvider: getRoleLabel('medicalProvider', t),
    admin: getRoleLabel('admin', t)
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t('admin:dashboard.title', 'Admin Control Center')}
        description={t('admin:dashboard.subtitle', { name: user?.name || 'Administrator', phone: user?.phone, defaultValue: `Logged in as ${user?.name || 'Administrator'} (${user?.phone}). Complete platform administration, role authorization, and record verification.` })}
        breadcrumbs={[t('common:nav.home', 'Home'), t('admin:dashboard.title', 'Admin Dashboard'), navigationTabs.find(t => t.id === activeTab)?.label || 'Overview']}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setNewComplaintModal({ isOpen: true, title: '', category: 'general', description: '' })}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{t('complaints:newComplaintBtn', 'Log Complaint')}</span>
            </button>
            <button
              onClick={() => {
                fetchOverviewStats();
                if (activeTab !== 'overview' && activeTab !== 'reports') fetchTabData();
              }}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${statsLoading || dataLoading ? 'animate-spin' : ''}`} />
              <span>{t('common:actions.refresh', 'Refresh')}</span>
            </button>
          </div>
        }
      />

      {/* Global Alerts / Feedback */}
      {feedback.message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button onClick={clearFeedback} className="text-slate-500 hover:text-slate-800 text-xs font-bold px-2 py-1">
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* User Metrics Row */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t('admin:dashboard.userAccountMetrics', 'User & Account Metrics')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard
                title={t('admin:dashboard.totalUsersStat', 'Total Users')}
                value={statsLoading ? '...' : `${stats?.users?.totalUsers || 0}`}
                icon={Users}
                badgeText="System Total"
                badgeType="neutral"
              />
              <StatCard
                title={t('admin:dashboard.farmersStat', 'Farmers')}
                value={statsLoading ? '...' : `${stats?.users?.totalFarmers || 0}`}
                icon={Users}
                badgeText="Milk Producers"
                badgeType="success"
              />
              <StatCard
                title={t('admin:dashboard.dairyOwnersStat', 'Dairy Owners')}
                value={statsLoading ? '...' : `${stats?.users?.totalDairyOwners || 0}`}
                icon={Building2}
                badgeText="Dairies"
                badgeType="blue"
              />
              <StatCard
                title={t('admin:dashboard.veterinariansStat', 'Veterinarians')}
                value={statsLoading ? '...' : `${stats?.users?.totalVeterinarians || 0}`}
                icon={Stethoscope}
                badgeText={`${stats?.users?.pendingVetVerifications || 0} Pending`}
                badgeType={stats?.users?.pendingVetVerifications ? 'amber' : 'neutral'}
              />
              <StatCard
                title={t('admin:dashboard.medicalStoresStat', 'Medical Stores')}
                value={statsLoading ? '...' : `${stats?.users?.totalMedicalStores || 0}`}
                icon={Store}
                badgeText={`${stats?.users?.pendingStoreVerifications || 0} Pending`}
                badgeType={stats?.users?.pendingStoreVerifications ? 'amber' : 'neutral'}
              />
              <StatCard
                title={t('admin:dashboard.administratorsStat', 'Administrators')}
                value={statsLoading ? '...' : `${stats?.users?.totalAdmins || 0}`}
                icon={ShieldAlert}
                badgeText="Super Users"
                badgeType="neutral"
              />
            </div>
          </div>

          {/* Operational & Financial Metrics */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t('admin:dashboard.operationalOversight', 'Operational Oversight')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard
                title={t('admin:dashboard.registeredCattleStat', 'Registered Cattle')}
                value={statsLoading ? '...' : `${stats?.operations?.totalCattle || 0}`}
                icon={HeartPulse}
                badgeText="Across All Herds"
                badgeType="neutral"
              />
              <StatCard
                title={t('admin:dashboard.activeVetRequestsStat', 'Active Vet Requests')}
                value={statsLoading ? '...' : `${stats?.operations?.activeVetRequests || 0}`}
                icon={Activity}
                badgeText={`${stats?.operations?.totalVetRequests || 0} Total`}
                badgeType={stats?.operations?.activeVetRequests ? 'amber' : 'neutral'}
              />
              <StatCard
                title={t('admin:dashboard.activeMedicinesStat', 'Active Medicines')}
                value={statsLoading ? '...' : `${stats?.operations?.totalMedicines || 0}`}
                icon={Pill}
                badgeText={`${stats?.operations?.totalMedicineRequests || 0} Orders`}
                badgeType="neutral"
              />
              <StatCard
                title={t('admin:dashboard.activeFodderListingsStat', 'Active Fodder Listings')}
                value={statsLoading ? '...' : `${stats?.operations?.activeFodderListings || 0}`}
                icon={Store}
                badgeText={`${stats?.operations?.totalFodderListings || 0} Total`}
                badgeType="neutral"
              />
              <StatCard
                title={t('admin:dashboard.openComplaintsStat', 'Open Complaints')}
                value={statsLoading ? '...' : `${stats?.operations?.openComplaints || 0}`}
                icon={MessageSquare}
                badgeText={`${stats?.operations?.totalComplaints || 0} Total`}
                badgeType={stats?.operations?.openComplaints ? 'amber' : 'success'}
              />
            </div>
          </div>

          {/* Financial Totals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">{t('admin:dashboard.cumulativeMilkVolume', 'Cumulative Milk Volume')}</span>
              <span className="font-mono font-bold text-slate-900 text-xl mt-1 block">
                {stats?.financials?.totalMilkQuantity?.toLocaleString('en-IN') || 0} Liters
              </span>
              <span className="text-xs text-slate-500 mt-1 block">
                Valuation: ₹ {stats?.financials?.totalMilkValue?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
              </span>
            </div>
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">{t('admin:dashboard.disbursedPayments', 'Disbursed Payments')}</span>
              <span className="font-mono font-bold text-emerald-900 text-xl mt-1 block">
                ₹ {stats?.financials?.totalDisbursedFunds?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
              </span>
              <span className="text-xs text-emerald-700 mt-1 block">
                Gross: ₹ {stats?.financials?.totalGrossPayments?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
              </span>
            </div>
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">{t('admin:dashboard.outstandingBalances', 'Outstanding Balances')}</span>
              <span className="font-mono font-bold text-amber-900 text-xl mt-1 block">
                ₹ {stats?.financials?.totalOutstandingBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
              </span>
              <span className="text-xs text-amber-700 mt-1 block">
                Pending settlement between Dairies & Farmers
              </span>
            </div>
          </div>

          {/* Verification Tasks Alert Box */}
          {((stats?.users?.pendingVetVerifications || 0) > 0 || (stats?.users?.pendingStoreVerifications || 0) > 0) && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">{t('admin:dashboard.pendingProfessionalVerifications', 'Pending Professional Verifications')}</h4>
                  <p className="text-xs text-amber-800">
                    There are {stats?.users?.pendingVetVerifications || 0} veterinarians and {stats?.users?.pendingStoreVerifications || 0} medical stores awaiting license review.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTab('verifications')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
              >
                Review Now
              </button>
            </div>
          )}

          {/* Recent Feeds Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Registrations */}
            <SectionCard
              title={t('admin:dashboard.recentUsersTitle', 'Recent User Registrations')}
              subtitle={t('admin:dashboard.recentUsersSubtitle', 'Latest 5 registered accounts')}
              action={
                <button onClick={() => setTab('users')} className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center">
                  {t('common:actions.viewAll', 'View All')} <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              }
            >
              <div className="divide-y divide-slate-100">
                {recentFeeds?.users?.length ? (
                  recentFeeds.users.map((u) => (
                    <div key={u._id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">{u.name || 'Unnamed User'}</div>
                        <div className="text-slate-500 text-[11px]">{u.phone} • {u.email || 'No email'}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {u.roles?.map(r => roleLabelMap[r] || r).join(', ') || u.role}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">{t('admin:dashboard.noRecentUsers', 'No recent users found')}</p>
                )}
              </div>
            </SectionCard>

            {/* Recent Vet Requests */}
            <SectionCard
              title={t('admin:dashboard.recentVetsTitle', 'Recent Veterinary Requests')}
              subtitle={t('admin:dashboard.recentVetsSubtitle', 'Latest clinical escalations & diagnosis requests')}
              action={
                <button onClick={() => setTab('vet-requests')} className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center">
                  View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              }
            >
              <div className="divide-y divide-slate-100">
                {recentFeeds?.vetRequests?.length ? (
                  recentFeeds.vetRequests.map((vr) => (
                    <div key={vr._id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">
                          {vr.cattle?.nameTag || 'Cattle'} ({vr.cattle?.breed || 'Unknown breed'})
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Farmer: {vr.farmer?.name || 'Unknown'} • Vet: {vr.veterinarian?.name || 'Unassigned'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          vr.riskLevel === 'high' || vr.riskLevel === 'critical'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {vr.riskLevel || 'Normal'}
                        </span>
                        <div className="text-[10px] text-slate-500 capitalize mt-0.5">{vr.status?.replace('_', ' ')}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">{t('admin:dashboard.noRecentVetRequests', 'No recent veterinary requests found')}</p>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* TAB 2: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <SectionCard
          title={t('admin:users.title', 'System User Directory')}
          subtitle={t('admin:users.subtitle', 'Inspect user accounts, normalized multi-role profiles, and toggle account activation status')}
        >
          {/* Filters Bar */}
          <div className="mb-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Role Filter */}
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value="all">{t('admin:dashboard.allRoles', 'All Roles')}</option>
                <option value="farmer">{t('common:roles.farmer', 'Farmer')}</option>
                <option value="dairyOwner">{t('common:roles.dairyOwner', 'Dairy Owner')}</option>
                <option value="veterinarian">{t('common:roles.veterinarian', 'Veterinarian')}</option>
                <option value="medicalProvider">{t('common:roles.medicalProvider', 'Medical Store')}</option>
                <option value="admin">{t('admin:dashboard.administrator', 'Administrator')}</option>
              </select>

              {/* Status Filter */}
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value="all">{t('admin:dashboard.allStatuses', 'All Statuses')}</option>
                <option value="active">{t('admin:dashboard.activeOnly', 'Active Only')}</option>
                <option value="suspended">{t('admin:dashboard.suspendedOnly', 'Suspended Only')}</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={t('admin:dashboard.searchUserPlaceholder', 'Search name, phone, email...')}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
          </div>

          {/* Users Table */}
          {dataLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
              {t('admin:dashboard.loadingDirectory', 'Loading users directory...')}
            </div>
          ) : usersList.length === 0 ? (
            <EmptyState
              title={t('admin:dashboard.noUsersTitle', 'No Users Found')}
              description={t('admin:dashboard.noUsersDesc', 'No user records matched your current role, status, or search query.')}
              icon={Users}
            />
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="px-4 py-3">{t('admin:dashboard.userCol', 'User')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.contactCol', 'Contact')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.rolesCol', 'Roles')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.accountStatusCol', 'Account Status')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.verificationCol', 'Verification')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.registeredCol', 'Registered')}</th>
                    <th className="px-4 py-3 text-right">{t('admin:dashboard.actionsCol', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {usersList.map((u) => {
                    const isSelf = u._id === user?.id || u._id === user?._id;
                    const rolesArray = u.roles?.length ? u.roles : [u.role];
                    return (
                      <tr key={u._id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{u.name || 'Unnamed User'}</div>
                          {u.clinicName && (
                            <div className="text-[11px] text-slate-500">Clinic: {u.clinicName}</div>
                          )}
                          {isSelf && (
                            <span className="text-[10px] text-blue-600 font-bold">({t('admin:dashboard.yourAccount', 'Your Account')})</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-1 text-slate-700">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.phone}</span>
                          </div>
                          {u.email && (
                            <div className="flex items-center space-x-1 text-slate-500 text-[11px] mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{u.email}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {rolesArray.map((r) => (
                              <span
                                key={r}
                                className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {roleLabelMap[r] || r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                              u.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {u.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {rolesArray.some(r => r === 'veterinarian' || r === 'medicalProvider') ? (
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                u.verificationStatus === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : u.verificationStatus === 'rejected'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {u.verificationStatus ? u.verificationStatus.toUpperCase() : 'PENDING'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            disabled={actionLoading || isSelf}
                            className={`px-2.5 py-1 text-xs font-semibold rounded transition ${
                              isSelf
                                ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                                : u.isActive
                                ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {u.isActive ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* TAB 3: PROFESSIONAL VERIFICATIONS */}
      {activeTab === 'verifications' && (
        <SectionCard
          title={t('admin:verifications.title', 'Professional Verification Management')}
          subtitle={t('admin:verifications.subtitle', 'Review, approve, or reject veterinarians and medical stores with persistent credentials')}
        >
          {/* Subtabs & Filters */}
          <div className="mb-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setVerificationRoleFilter('veterinarian')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  verificationRoleFilter === 'veterinarian'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Veterinarians
              </button>
              <button
                onClick={() => setVerificationRoleFilter('medicalProvider')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  verificationRoleFilter === 'medicalProvider'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t('admin:dashboard.medicalStores', 'Medical Stores')}
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">{t('admin:dashboard.statusLabel', 'Status:')}</span>
              <select
                value={verificationStatusFilter}
                onChange={(e) => setVerificationStatusFilter(e.target.value)}
                className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
              >
                <option value="all">{t('admin:dashboard.allVerificationStatuses', 'All Verification Statuses')}</option>
                <option value="pending">{t('admin:dashboard.pendingReviewOnly', 'Pending Review Only')}</option>
                <option value="approved">{t('admin:dashboard.approved', 'Approved')}</option>
                <option value="rejected">{t('admin:dashboard.rejected', 'Rejected')}</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {dataLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
              Loading verification applications...
            </div>
          ) : verificationsList.length === 0 ? (
            <EmptyState
              title={t('admin:dashboard.noVerificationsFound', 'No Verifications Matching Criteria')}
              description={`No ${verificationRoleFilter === 'veterinarian' ? 'veterinarian' : 'medical store'} records found for the selected verification status.`}
              icon={ShieldCheck}
            />
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="px-4 py-3">{t('admin:dashboard.professionalEntity', 'Professional / Entity')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.contactCol', 'Contact')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.specializationClinic', 'Specialization / Clinic')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.licenseNumber', 'License Number')}</th>
                    <th className="px-4 py-3">{t('common:labels.status', 'Status')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.adminNotes', 'Admin Notes')}</th>
                    <th className="px-4 py-3 text-right">{t('admin:dashboard.actionsCol', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {verificationsList.map((v) => (
                    <tr key={v._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900">{v.name || 'Unnamed'}</td>
                      <td className="px-4 py-3">
                        <div>{v.phone}</div>
                        <div className="text-[11px] text-slate-500">{v.email || 'No email'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{v.specialization || v.clinicName || 'Not specified'}</div>
                        {v.expertise && <div className="text-[11px] text-slate-500">Exp: {v.expertise}</div>}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        {v.licenseNumber || <span className="text-slate-400 italic">{t('admin:dashboard.notRecorded', 'Not recorded')}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            v.verificationStatus === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : v.verificationStatus === 'rejected'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {v.verificationStatus ? v.verificationStatus.toUpperCase() : 'PENDING'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px] max-w-xs truncate">
                        {v.verificationNotes || <span className="text-slate-300 italic">{t('admin:dashboard.none', 'None')}</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenVerificationModal(v, 'approved')}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-xs font-semibold"
                          >
                            {t('common:actions.approve', 'Approve')}
                          </button>
                          <button
                            onClick={() => handleOpenVerificationModal(v, 'rejected')}
                            className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded text-xs font-semibold"
                          >
                            {t('common:actions.reject', 'Reject')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* TAB 4: CATTLE RECORDS */}
      {activeTab === 'cattle' && (
        <SectionCard
          title={t('admin:cattle.title', 'Platform Cattle Herd Directory')}
          subtitle={t('admin:cattle.subtitle', 'System-wide cattle records registered by all connected farmers')}
        >
          {/* Filters Bar */}
          <div className="mb-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">{t('admin:dashboard.healthStatusLabel', 'Health Status:')}</span>
              <select
                value={cattleHealthFilter}
                onChange={(e) => setCattleHealthFilter(e.target.value)}
                className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
              >
                <option value="all">{t('admin:dashboard.allHealthConditions', 'All Health Conditions')}</option>
                <option value="healthy">{t('admin:dashboard.healthy', 'Healthy')}</option>
                <option value="sick">{t('admin:dashboard.sick', 'Sick')}</option>
                <option value="under_observation">{t('admin:dashboard.underObservation', 'Under Observation')}</option>
                <option value="vaccinated">{t('admin:dashboard.vaccinated', 'Vaccinated')}</option>
                <option value="critical">{t('admin:dashboard.critical', 'Critical')}</option>
              </select>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={t('admin:dashboard.searchCattlePlaceholder', 'Search tag, breed, notes...')}
                value={cattleSearch}
                onChange={(e) => setCattleSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          {/* Cattle Table */}
          {dataLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
              Loading cattle records...
            </div>
          ) : cattleList.length === 0 ? (
            <EmptyState
              title={t('admin:cattle.noCattle', 'No Cattle Records Found')}
              description="No cattle profiles match the chosen health conditions or search query."
              icon={HeartPulse}
            />
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="px-4 py-3">{t('admin:dashboard.tagIdentifier', 'Tag / Identifier')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.ownerFarmer', 'Owner (Farmer)')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.breedGender', 'Breed & Gender')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.age', 'Age')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.healthStatusLabel', 'Health Status')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.registeredDate', 'Registered Date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {cattleList.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900">{c.nameTag}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{c.farmer?.name || 'Unknown'}</div>
                        <div className="text-[11px] text-slate-500">{c.farmer?.phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{c.breed}</div>
                        <div className="text-[11px] text-slate-500 capitalize">{c.gender}</div>
                      </td>
                      <td className="px-4 py-3">{c.ageYears ? `${c.ageYears} yrs` : 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            c.healthStatus === 'healthy'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : c.healthStatus === 'critical' || c.healthStatus === 'sick'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {c.healthStatus?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* TAB 5: VETERINARY REQUESTS & CLINICAL OVERSIGHT */}
      {activeTab === 'vet-requests' && (
        <SectionCard
          title={t('admin:vetRequests.title', 'Veterinary Requests & Escalations')}
          subtitle={t('admin:vetRequests.subtitle', 'Oversight of disease scans, clinical triage, veterinarian assignments, and escalation history')}
        >
          {/* Filters Bar */}
          <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={vetRequestStatusFilter}
                onChange={(e) => setVetRequestStatusFilter(e.target.value)}
                className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
              >
                <option value="all">{t('admin:dashboard.allClinicalStages', 'All Clinical Stages')}</option>
                <option value="pending">{t('status.pending', 'Pending')}</option>
                <option value="accepted">{t('status.accepted', 'Accepted')}</option>
                <option value="examination">{t('status.examination', 'Examination')}</option>
                <option value="diagnosed">{t('status.diagnosed', 'Diagnosed')}</option>
                <option value="prescription_created">{t('status.prescription_created', 'Prescription Created')}</option>
                <option value="completed">{t('status.completed', 'Completed')}</option>
                <option value="cancelled">{t('status.cancelled', 'Cancelled')}</option>
              </select>

              <select
                value={vetRequestRiskFilter}
                onChange={(e) => setVetRequestRiskFilter(e.target.value)}
                className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
              >
                <option value="all">{t('admin:dashboard.allRiskLevels', 'All Risk Levels')}</option>
                <option value="low">{t('status.low', 'Low')}</option>
                <option value="medium">{t('status.medium', 'Medium')}</option>
                <option value="high">{t('status.high', 'High')}</option>
                <option value="critical">{t('admin:dashboard.critical', 'Critical')}</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {dataLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
              Loading clinical cases...
            </div>
          ) : vetRequestsList.length === 0 ? (
            <EmptyState
              title={t('admin:vetRequests.noRequests', 'No Veterinary Requests Found')}
              description="No cases match the selected status and risk parameters."
              icon={Activity}
            />
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="px-4 py-3">{t('admin:dashboard.cattleFarmer', 'Cattle & Farmer')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.assignedVeterinarian', 'Assigned Veterinarian')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.riskLevel', 'Risk Level')}</th>
                    <th className="px-4 py-3">{t('common:labels.status', 'Status')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.escalations', 'Escalations')}</th>
                    <th className="px-4 py-3">{t('common:labels.date', 'Date')}</th>
                    <th className="px-4 py-3 text-right">{t('admin:dashboard.inspection', 'Inspection')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {vetRequestsList.map((vr) => (
                    <tr key={vr._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {vr.cattle?.nameTag || 'Cattle'} ({vr.cattle?.breed || 'Unknown'})
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Farmer: {vr.farmer?.name || 'Unknown'} ({vr.farmer?.phone})
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {vr.veterinarian ? (
                          <div>
                            <div className="font-medium text-slate-800">{vr.veterinarian.name}</div>
                            <div className="text-[11px] text-slate-500">{vr.veterinarian.specialization || 'General'}</div>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-semibold italic text-[11px]">{t('admin:dashboard.unassigned', 'Unassigned')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            vr.riskLevel === 'critical' || vr.riskLevel === 'high'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : vr.riskLevel === 'medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {vr.riskLevel?.toUpperCase() || 'LOW'}
                        </span>
                      </td>
                      <td className="px-4 py-3 capitalize font-medium text-slate-700">
                        {vr.status?.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3">
                        {vr.escalationHistory?.length ? (
                          <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-semibold">
                            {vr.escalationHistory.length} Referrals
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">{t('admin:dashboard.direct', 'Direct')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {new Date(vr.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedVetRequest(vr)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center space-x-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t('admin:dashboard.viewHistory', 'View History')}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* TAB 6: MEDICINES CATALOG */}
      {activeTab === 'medicines' && (
        <SectionCard
          title={t('admin:dashboard.medicinesCatalogOversight', 'Medicine Inventory & Catalog Oversight')}
          subtitle={t('admin:dashboard.medicinesSubtitle', 'System-wide pharmaceutical catalog registered by verified Medical Stores')}
        >
          {/* Filters Bar */}
          <div className="mb-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">{t('admin:dashboard.categoryLabel', 'Category:')}</span>
              <select
                value={medicineCategoryFilter}
                onChange={(e) => setMedicineCategoryFilter(e.target.value)}
                className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
              >
                <option value="all">{t('admin:dashboard.allCategories', 'All Categories')}</option>
                <option value="antibiotic">{t('admin:dashboard.catAntibiotic', 'Antibiotic')}</option>
                <option value="anti_inflammatory">{t('admin:dashboard.catAntiInflammatory', 'Anti-Inflammatory')}</option>
                <option value="vaccine">{t('admin:dashboard.catVaccine', 'Vaccine')}</option>
                <option value="nutritional_supplement">{t('admin:dashboard.catNutritionalSupplement', 'Nutritional Supplement')}</option>
                <option value="antiseptic">{t('admin:dashboard.catAntiseptic', 'Antiseptic')}</option>
                <option value="anthelmintic">{t('admin:dashboard.catAnthelmintic', 'Anthelmintic')}</option>
                <option value="hormone">{t('admin:dashboard.catHormone', 'Hormone')}</option>
                <option value="general">{t('complaints:categories.general', 'General')}</option>
              </select>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={t('admin:dashboard.searchMedicinePlaceholder', 'Search medicine name...')}
                value={medicineSearch}
                onChange={(e) => setMedicineSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          {/* Table */}
          {dataLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
              Loading medicines...
            </div>
          ) : medicinesList.length === 0 ? (
            <EmptyState
              title={t('admin:dashboard.noMedicinesFound', 'No Medicines Found')}
              description="No medicines match the selected category or search filter."
              icon={Pill}
            />
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="px-4 py-3">{t('admin:dashboard.medicine', 'Medicine')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.categoryLabel', 'Category')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.medicalStoreCol', 'Medical Store')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.unitPrice', 'Unit Price')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.stockAvailable', 'Stock Available')}</th>
                    <th className="px-4 py-3">{t('common:labels.status', 'Status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {medicinesList.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{m.name}</div>
                        {m.genericName && <div className="text-[11px] text-slate-500">{m.genericName}</div>}
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-600">{m.category?.replace('_', ' ')}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{m.medicalProvider?.name || 'Store'}</div>
                        <div className="text-[11px] text-slate-500">{m.medicalProvider?.phone}</div>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold">₹ {m.price}</td>
                      <td className="px-4 py-3 font-mono">{m.stockQuantity ?? 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            m.availability === 'in_stock'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : m.availability === 'low_stock'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {m.availability?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* TAB 7: FODDER LISTINGS & MARKETPLACE MODERATION */}
      {activeTab === 'fodder' && (
        <SectionCard
          title={t('admin:dashboard.fodderMarketplaceOversight', 'Fodder Marketplace Oversight')}
          subtitle={t('admin:dashboard.fodderSubtitle', 'Farmer-to-farmer fodder listings with administrative moderation control')}
        >
          {/* Filters Bar */}
          <div className="mb-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">{t('admin:dashboard.statusLabel', 'Status:')}</span>
              <select
                value={fodderStatusFilter}
                onChange={(e) => setFodderStatusFilter(e.target.value)}
                className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
              >
                <option value="all">{t('admin:dashboard.allStatuses', 'All Statuses')}</option>
                <option value="active">{t('admin:dashboard.activeOnly', 'Active Only')}</option>
                <option value="sold">{t('admin:dashboard.soldListing', 'Sold')}</option>
                <option value="inactive">{t('admin:dashboard.inactiveModerated', 'Inactive / Moderated')}</option>
                <option value="expired">{t('admin:dashboard.expiredListing', 'Expired')}</option>
              </select>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={t('admin:dashboard.searchFodderPlaceholder', 'Search fodder title, location...')}
                value={fodderSearch}
                onChange={(e) => setFodderSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          {/* Table */}
          {dataLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
              Loading fodder listings...
            </div>
          ) : fodderList.length === 0 ? (
            <EmptyState
              title={t('admin:dashboard.noFodderFound', 'No Fodder Listings Found')}
              description="No marketplace listings match the selected status or query."
              icon={Store}
            />
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="px-4 py-3">{t('admin:dashboard.listingTitle', 'Listing Title')}</th>
                    <th className="px-4 py-3">{t('common:roles.farmer', 'Farmer')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.fodderType', 'Fodder Type')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.quantityPrice', 'Quantity & Price')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.location', 'Location')}</th>
                    <th className="px-4 py-3">{t('common:labels.status', 'Status')}</th>
                    <th className="px-4 py-3 text-right">{t('admin:dashboard.moderation', 'Moderation')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {fodderList.map((f) => (
                    <tr key={f._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900">{f.title}</td>
                      <td className="px-4 py-3">
                        <div>{f.farmer?.name || 'Farmer'}</div>
                        <div className="text-[11px] text-slate-500">{f.farmer?.phone}</div>
                      </td>
                      <td className="px-4 py-3 capitalize">{f.fodderType?.replace('_', ' ')}</td>
                      <td className="px-4 py-3">
                        <div>{f.quantity} {f.unit}</div>
                        <div className="text-[11px] font-mono text-emerald-700 font-bold">₹ {f.pricePerUnit} / {f.unit}</div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-600">
                        {f.location?.city || f.location?.address || 'Local'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            f.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : f.status === 'sold'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {f.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {f.status === 'active' ? (
                          <button
                            onClick={() => handleModerateFodder(f._id, 'inactive')}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-xs font-semibold"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleModerateFodder(f._id, 'active')}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-xs font-semibold"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* TAB 8: COMPLAINTS & GRIEVANCE MANAGEMENT */}
      {activeTab === 'complaints' && (
        <SectionCard
          title={t('admin:dashboard.complaintsResolution', 'Complaints & Grievance Resolution')}
          subtitle={t('admin:dashboard.complaintsSubtitle', 'User-submitted dispute and support complaints with administrative status resolution')}
        >
          {/* Filters Bar */}
          <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={complaintStatusFilter}
                onChange={(e) => setComplaintStatusFilter(e.target.value)}
                className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
              >
                <option value="all">{t('admin:dashboard.allComplaintStatuses', 'All Complaint Statuses')}</option>
                <option value="open">{t('status.open', 'Open')}</option>
                <option value="in_progress">{t('status.in_progress', 'In Progress')}</option>
                <option value="resolved">{t('status.resolved', 'Resolved')}</option>
                <option value="closed">{t('status.closed', 'Closed')}</option>
              </select>

              <select
                value={complaintCategoryFilter}
                onChange={(e) => setComplaintCategoryFilter(e.target.value)}
                className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
              >
                <option value="all">{t('admin:dashboard.allCategories', 'All Categories')}</option>
                <option value="general">{t('complaints:categories.general', 'General')}</option>
                <option value="milk_collection">{t('complaints:categories.milk_collection', 'Milk Collection')}</option>
                <option value="payments">{t('complaints:categories.payments', 'Payments')}</option>
                <option value="veterinary">{t('complaints:categories.veterinary', 'Veterinary')}</option>
                <option value="medicines">{t('complaints:categories.medicines', 'Medicines')}</option>
                <option value="fodder">{t('complaints:categories.fodder', 'Fodder')}</option>
                <option value="account">{t('complaints:categories.account', 'Account')}</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {dataLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
              Loading complaints...
            </div>
          ) : complaintsList.length === 0 ? (
            <EmptyState
              title={t('admin:dashboard.noComplaintsFound', 'No Complaints Found')}
              description="No grievances match the selected status or category."
              icon={MessageSquare}
            />
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="px-4 py-3">{t('admin:dashboard.titleCategory', 'Title & Category')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.submittedBy', 'Submitted By')}</th>
                    <th className="px-4 py-3">{t('common:labels.status', 'Status')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.adminResolutionNotes', 'Admin Resolution Notes')}</th>
                    <th className="px-4 py-3">{t('admin:dashboard.submittedAt', 'Submitted At')}</th>
                    <th className="px-4 py-3 text-right">{t('admin:dashboard.actionsCol', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {complaintsList.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{c.title}</div>
                        <div className="text-[11px] text-slate-500 capitalize">{c.category?.replace('_', ' ')}</div>
                        <div className="text-[11px] text-slate-600 mt-1 max-w-sm line-clamp-2">{c.description}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{c.submittedBy?.name || 'User'}</div>
                        <div className="text-[11px] text-slate-500">{c.submittedBy?.phone}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{c.submittedBy?.role}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            c.status === 'resolved' || c.status === 'closed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : c.status === 'in_progress'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {c.status?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px] max-w-xs">
                        {c.adminNotes || <span className="text-slate-300 italic">{t('admin:dashboard.noNotesAdded', 'No notes added')}</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenComplaintModal(c)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* TAB 9: REPORTS EMBED / SUMMARY */}
      {activeTab === 'reports' && (
        <SectionCard
          title={t('admin:reportsPage.title', 'System Administration & Global Reports')}
          subtitle={t('admin:reportsPage.subtitle', 'Real-time financial and operational aggregates across all registered modules')}
          action={
            <Link
              to="/admin/reports"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg flex items-center space-x-1"
            >
              <span>{t('admin:dashboard.fullAnalyticsView', 'Full Analytics View')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-xs font-bold text-slate-500 uppercase">{t('admin:dashboard.milkVolumeIntake', 'Milk Volume Intake')}</span>
                <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
                  {stats?.financials?.totalMilkQuantity?.toLocaleString('en-IN') || 0} Liters
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Valuation: ₹ {stats?.financials?.totalMilkValue?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                </div>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <span className="text-xs font-bold text-emerald-700 uppercase">{t('admin:dashboard.disbursedFunds', 'Disbursed Funds')}</span>
                <div className="mt-2 text-2xl font-bold font-mono text-emerald-900">
                  ₹ {stats?.financials?.totalDisbursedFunds?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                </div>
                <div className="text-xs text-emerald-700 mt-1">
                  Gross: ₹ {stats?.financials?.totalGrossPayments?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                </div>
              </div>

              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
                <span className="text-xs font-bold text-amber-700 uppercase">{t('admin:dashboard.outstandingBalance', 'Outstanding Balance')}</span>
                <div className="mt-2 text-2xl font-bold font-mono text-amber-900">
                  ₹ {stats?.financials?.totalOutstandingBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                </div>
                <div className="text-xs text-amber-700 mt-1">
                  Unsettled payments in dairy ledger
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-slate-800">{t('admin:dashboard.ecosystemIntegrityNotice', 'Ecosystem Integrity Notice')}</div>
              <p>
                {t('admin:dashboard.ecosystemNotice1', 'All reporting aggregations displayed in this dashboard and the dedicated reports page are computed dynamically from active MongoDB collections')} (<span className="font-mono">{'users'}</span>, <span className="font-mono">{'cattle'}</span>, <span className="font-mono">{'vetrequests'}</span>, <span className="font-mono">{'milkcollections'}</span>, <span className="font-mono">{'payments'}</span>, <span className="font-mono">{'complaints'}</span>).
              </p>
              <p>
                {t('admin:dashboard.ecosystemNotice2', 'Admin oversight does not duplicate financial ledgers or alter clinical examination findings without authorized doctor progression.')}
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* MODAL 1: VERIFICATION MODAL */}
      {verificationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden my-auto max-h-[90vh] flex flex-col modal-animate">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Update Professional Verification
              </h3>
              <button
                onClick={() => setVerificationModal({ isOpen: false, user: null, status: 'approved', licenseNumber: '', notes: '' })}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitVerification} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">{t('admin:dashboard.targetAccount', 'Target Account')}</label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">
                  {verificationModal.user?.name} ({verificationModal.user?.phone})
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">{t('admin:dashboard.verificationDecision', 'Verification Decision')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVerificationModal(prev => ({ ...prev, status: 'approved' }))}
                    className={`py-2 text-center rounded-lg font-semibold border transition ${
                      verificationModal.status === 'approved'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t('admin:dashboard.approveAccount', 'Approve Account')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerificationModal(prev => ({ ...prev, status: 'rejected' }))}
                    className={`py-2 text-center rounded-lg font-semibold border transition ${
                      verificationModal.status === 'rejected'
                        ? 'bg-red-50 border-red-500 text-red-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t('admin:dashboard.rejectAccount', 'Reject Account')}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">{t('admin:dashboard.medVetLicenseNumber', 'Medical / Veterinary License Number')}</label>
                <input
                  type="text"
                  placeholder={t('admin:dashboard.licensePlaceholder', 'e.g. VET-MH-2024-8841')}
                  value={verificationModal.licenseNumber}
                  onChange={(e) => setVerificationModal(prev => ({ ...prev, licenseNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">{t('admin:dashboard.verificationNotesJustification', 'Verification Notes / Justification')}</label>
                <textarea
                  rows={3}
                  placeholder={t('admin:verifications.reviewerNotes', 'Notes regarding credentials or rejection reason...')}
                  value={verificationModal.notes}
                  onChange={(e) => setVerificationModal(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setVerificationModal({ isOpen: false, user: null, status: 'approved', licenseNumber: '', notes: '' })}
                  className="px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold"
                >
                  {actionLoading ? 'Saving...' : 'Save Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COMPLAINT RESOLUTION MODAL */}
      {complaintModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Update Complaint Resolution
              </h3>
              <button
                onClick={() => setComplaintModal({ isOpen: false, complaint: null, status: 'in_progress', adminNotes: '' })}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitComplaintResolution} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">{t('admin:dashboard.complaintDetails', 'Complaint Details')}</label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 space-y-1">
                  <div className="font-bold">{complaintModal.complaint?.title}</div>
                  <div className="text-[11px] text-slate-600">{complaintModal.complaint?.description}</div>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">{t('common:labels.status', 'Status')}</label>
                <select
                  value={complaintModal.status}
                  onChange={(e) => setComplaintModal(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
                >
                  <option value="open">{t('status.open', 'Open')}</option>
                  <option value="in_progress">{t('status.in_progress', 'In Progress')}</option>
                  <option value="resolved">{t('status.resolved', 'Resolved')}</option>
                  <option value="closed">{t('status.closed', 'Closed')}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">{t('admin:dashboard.adminResolutionNotes', 'Admin Resolution Notes')}</label>
                <textarea
                  rows={3}
                  placeholder={t('admin:dashboard.adminResolutionNotes', 'Explain actions taken or resolution...')}
                  value={complaintModal.adminNotes}
                  onChange={(e) => setComplaintModal(prev => ({ ...prev, adminNotes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setComplaintModal({ isOpen: false, complaint: null, status: 'in_progress', adminNotes: '' })}
                  className="px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold"
                >
                  {actionLoading ? 'Updating...' : 'Update Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LOG NEW COMPLAINT MODAL */}
      {newComplaintModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Log Platform Grievance / Complaint
              </h3>
              <button
                onClick={() => setNewComplaintModal({ isOpen: false, title: '', category: 'general', description: '' })}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewComplaint} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">{t('admin:dashboard.complaintTitle', 'Complaint Title')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('admin:dashboard.complaintTitlePlaceholder', 'e.g. Discrepancy in milk collection fat rate')}
                  value={newComplaintModal.title}
                  onChange={(e) => setNewComplaintModal(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">{t('common:labels.category', 'Category')}</label>
                <select
                  value={newComplaintModal.category}
                  onChange={(e) => setNewComplaintModal(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
                >
                  <option value="general">{t('complaints:categories.general', 'General')}</option>
                  <option value="milk_collection">{t('complaints:categories.milk_collection', 'Milk Collection')}</option>
                  <option value="payments">{t('complaints:categories.payments', 'Payments')}</option>
                  <option value="veterinary">{t('complaints:categories.veterinary', 'Veterinary')}</option>
                  <option value="medicines">{t('complaints:categories.medicines', 'Medicines')}</option>
                  <option value="fodder">{t('complaints:categories.fodder', 'Fodder')}</option>
                  <option value="account">{t('complaints:categories.account', 'Account')}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">{t('admin:dashboard.description', 'Description')}</label>
                <textarea
                  rows={4}
                  required
                  placeholder={t('admin:dashboard.description', 'Detailed description of the issue...')}
                  value={newComplaintModal.description}
                  onChange={(e) => setNewComplaintModal(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setNewComplaintModal({ isOpen: false, title: '', category: 'general', description: '' })}
                  className="px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER / MODAL 4: VET REQUEST DETAILS & ESCALATION HISTORY */}
      {selectedVetRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-sm font-bold text-slate-900">
                Clinical Case & Referral History
              </h3>
              <button
                onClick={() => setSelectedVetRequest(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">{t('admin:dashboard.cattleProfile', 'Cattle Profile')}</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {selectedVetRequest.cattle?.nameTag} ({selectedVetRequest.cattle?.breed})
                  </div>
                  <div className="text-[11px] text-slate-500 capitalize">
                    {selectedVetRequest.cattle?.gender}, {selectedVetRequest.cattle?.ageYears} yrs
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">{t('admin:dashboard.farmerOwner', 'Farmer Owner')}</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedVetRequest.farmer?.name}</div>
                  <div className="text-[11px] text-slate-500">{selectedVetRequest.farmer?.phone}</div>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block mb-1">{t('admin:dashboard.clinicalStatusRisk', 'Clinical Status & Risk')}</span>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded font-bold uppercase text-[10px] bg-slate-100 text-slate-700 border">
                    {selectedVetRequest.status?.replace('_', ' ')}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded font-bold uppercase text-[10px] border ${
                    selectedVetRequest.riskLevel === 'high' || selectedVetRequest.riskLevel === 'critical'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    Risk: {selectedVetRequest.riskLevel}
                  </span>
                </div>
              </div>

              {selectedVetRequest.notes && (
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">{t('admin:dashboard.caseNotes', 'Case Notes')}</span>
                  <div className="p-3 bg-slate-50 rounded-lg text-slate-700 border border-slate-200">
                    {selectedVetRequest.notes}
                  </div>
                </div>
              )}

              <div>
                <span className="text-slate-500 font-semibold block mb-2">{t('admin:dashboard.escalationReferralTimeline', 'Escalation & Referral Timeline')}</span>
                {selectedVetRequest.escalationHistory?.length ? (
                  <div className="space-y-2 border-l-2 border-slate-200 pl-3 ml-2">
                    {selectedVetRequest.escalationHistory.map((esc, i) => (
                      <div key={i} className="relative text-[11px] text-slate-600 space-y-0.5">
                        <div className="font-semibold text-slate-800">
                          {esc.veterinarian?.name || 'Veterinarian'} ({esc.status})
                        </div>
                        {esc.reason && <div className="text-slate-500 italic">Reason: {esc.reason}</div>}
                        <div className="text-[10px] text-slate-400">
                          Assigned: {esc.assignedAt ? new Date(esc.assignedAt).toLocaleString() : 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center bg-slate-50 text-slate-400 rounded-lg italic">
                    No escalations or referrals logged for this case.
                  </div>
                )}
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setSelectedVetRequest(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
