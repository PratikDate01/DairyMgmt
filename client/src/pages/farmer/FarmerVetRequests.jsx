import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { vetRequestService } from '../../services/vetRequestService';
import { getStatusLabel, getRiskLabel } from '../../i18n/statusMap';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/EmptyState';
import { FarmerCaseDetailModal } from '../../components/farmer/FarmerCaseDetailModal';
import {
  Stethoscope,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Scan,
  ChevronRight,
  Info,
  X,
  RefreshCw,
  Building2,
  AlertCircle,
  ArrowRight,
  ArrowDown,
  CornerDownRight,
  RotateCw
} from 'lucide-react';

export const FarmerVetRequests = () => {
  const { t } = useTranslation(['farmer', 'common']);
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [escalatingId, setEscalatingId] = useState(null);
  const [escalateSuccess, setEscalateSuccess] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await vetRequestService.getFarmerRequests(token);
      setRequests(data);
      if (selectedRequest) {
        const updatedSelected = data.find((r) => r._id === selectedRequest._id);
        if (updatedSelected) setSelectedRequest(updatedSelected);
      }
    } catch (err) {
      console.error('Error loading vet requests:', err);
      setError(err.message || t('common:error.loadFailed', 'Failed to load your veterinarian consultation requests.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const handleEscalate = async (requestId, force = false) => {
    setEscalatingId(requestId);
    setError('');
    setEscalateSuccess('');
    try {
      const res = await vetRequestService.escalateVetRequest(requestId, force, token);
      setEscalateSuccess(res.message || t('farmer:vetRequests.escalationBadge', 'Request successfully escalated to next veterinarian.'));
      fetchRequests();
      setTimeout(() => setEscalateSuccess(''), 5000);
    } catch (err) {
      setError(err.message || t('common:error.actionFailed', 'Failed to escalate request.'));
    } finally {
      setEscalatingId(null);
    }
  };

  const renderStatusBadge = (reqItem) => {
    const status = reqItem.status;
    const isEscalated = reqItem.escalationHistory && reqItem.escalationHistory.length > 0;

    switch (status) {
      case 'accepted':
        return (
          <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 text-xs font-bold rounded-lg flex items-center space-x-1">
            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
            <span>{getStatusLabel('accepted', t)}</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-lg flex items-center space-x-1">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>{isEscalated ? t('farmer:recommendations.noVetsFound', 'No Vet Available') : getStatusLabel('rejected', t)}</span>
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg flex items-center space-x-1">
            <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>{getStatusLabel('completed', t)}</span>
          </span>
        );
      default:
        if (isEscalated) {
          return (
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg flex items-center space-x-1">
              <RotateCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              <span>{t('farmer:vetRequests.escalationBadge', 'Forwarded (Pending)')}</span>
            </span>
          );
        }
        return (
          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-lg flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{getStatusLabel('pending', t)}</span>
          </span>
        );
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (statusFilter === 'all') return true;
    return req.status === statusFilter;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const acceptedCount = requests.filter((r) => r.status === 'accepted').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title={t('farmer:vetRequests.title', 'My Veterinary Requests')}
        description={t('farmer:vetRequests.subtitle', 'Track consultation requests submitted to veterinarians for your cattle AI screenings.')}
        breadcrumbs={[t('common:nav.home', 'Home'), t('common:roles.farmer', 'Farmer'), t('farmer:vetRequests.title', 'Vet Requests')]}
        actions={
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition flex items-center space-x-1.5 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('common:actions.refresh', 'Refresh')}</span>
          </button>
        }
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {escalateSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2 font-bold">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{escalateSuccess}</span>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('common:actions.all', 'Total Requests')}
          value={loading ? '...' : requests.length}
          icon={Stethoscope}
          badgeText={t('common:status.all', 'All Submitted')}
          badgeType="neutral"
        />
        <StatCard
          title={t('common:status.pending', 'Pending Requests')}
          value={loading ? '...' : pendingCount}
          icon={Clock}
          badgeText={pendingCount > 0 ? t('common:status.pending_review', 'Awaiting Doctor') : t('common:status.healthy', 'None')}
          badgeType={pendingCount > 0 ? 'amber' : 'neutral'}
        />
        <StatCard
          title={t('common:status.accepted', 'Accepted Consultations')}
          value={loading ? '...' : acceptedCount}
          icon={CheckCircle}
          badgeText={acceptedCount > 0 ? t('common:status.accepted', 'Doctor Accepted') : t('common:status.healthy', 'None')}
          badgeType="success"
        />
        <StatCard
          title={t('common:status.rejected', 'Declined Requests')}
          value={loading ? '...' : rejectedCount}
          icon={XCircle}
          badgeText={rejectedCount > 0 ? t('common:status.rejected', 'Declined') : t('common:status.healthy', 'None')}
          badgeType={rejectedCount > 0 ? 'amber' : 'neutral'}
        />
      </div>

      {/* Main Section */}
      <SectionCard
        title={t('farmer:vetRequests.title', 'Consultation Requests')}
        subtitle={t('farmer:vetRequests.subtitle', 'Manage and track status updates from veterinarians with automatic escalation')}
        action={
          <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            {[
              { id: 'all', label: t('common:actions.all', 'All') },
              { id: 'pending', label: t('common:status.pending', 'Pending') },
              { id: 'accepted', label: t('common:status.accepted', 'Accepted') },
              { id: 'rejected', label: t('common:status.rejected', 'Rejected') }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === tab.id
                    ? 'bg-white text-blue-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs font-medium space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600" />
            <p>{t('common:actions.loading', 'Loading consultation requests...')}</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            title={t('farmer:vetRequests.noRequests', 'No Requests Found')}
            description={
              statusFilter !== 'all'
                ? t('common:empty.noRecordsFound', 'No records found matching your criteria')
                : t('farmer:vetRequests.noRequests', 'You have not submitted any veterinarian consultation requests yet. Run an AI Health Scan to request a veterinarian.')
            }
            icon={Stethoscope}
            actionLabel={t('farmer:cattle.scanNow', 'Run AI Health Scan')}
            onAction={() => window.location.href = '/farmer/ai-scanner'}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.map((reqItem) => {
              const hasHistory = reqItem.escalationHistory && reqItem.escalationHistory.length > 0;

              return (
                <div
                  key={reqItem._id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">👨‍⚕️</span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Dr. {reqItem.veterinarian?.name || t('common:roles.veterinarian', 'Veterinarian')}</h4>
                          <span className="text-[11px] text-slate-500">{reqItem.veterinarian?.specialization || 'Veterinary Specialist'}</span>
                        </div>
                      </div>
                      {renderStatusBadge(reqItem)}
                    </div>

                    {hasHistory && (
                      <div className="p-2 bg-indigo-50/80 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 flex items-center space-x-1.5">
                        <RotateCw className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{t('farmer:vetRequests.escalationBadge', 'Forwarded to next veterinarian after previous doctor unavailable.')}</span>
                      </div>
                    )}

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-800 font-semibold">
                        <span>{t('common:labels.cattle', 'Cattle')}: {reqItem.cattle?.nameTag || 'Cattle'}</span>
                        <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-extrabold text-[10px]">
                          {getRiskLabel(reqItem.riskLevel, t)}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        {t('farmer:aiScanner.detectedCondition', 'Condition')}: <strong className="text-slate-900">{reqItem.aiCondition}</strong>
                      </div>
                      {reqItem.farmerMessage && (
                        <p className="text-slate-500 italic pt-1 border-t border-slate-200/60 line-clamp-2">
                          "{reqItem.farmerMessage}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 flex items-center space-x-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(reqItem.createdAt).toLocaleDateString()}</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      {reqItem.status === 'pending' && (
                        <button
                          onClick={() => handleEscalate(reqItem._id, true)}
                          disabled={escalatingId === reqItem._id}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold rounded-lg border border-amber-200 transition flex items-center space-x-1 disabled:opacity-50"
                          title={t('farmer:vetRequests.manualEscalateTooltip', 'Trigger manual escalation to next available veterinarian')}
                        >
                          <RotateCw className={`w-3 h-3 ${escalatingId === reqItem._id ? 'animate-spin' : ''}`} />
                          <span>{t('status.escalated', 'Escalate')}</span>
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedRequest(reqItem)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-slate-200 hover:border-blue-200 transition flex items-center space-x-1"
                      >
                        <span>{t('farmer:vetRequests.viewCase', 'Details')}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Request Detail & Clinical Case Record Modal (Phase 23) */}
      {selectedRequest && (
        <FarmerCaseDetailModal
          requestItem={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
};
