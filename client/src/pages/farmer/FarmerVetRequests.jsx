import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { vetRequestService } from '../../services/vetRequestService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/EmptyState';
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
      setError(err.message || 'Failed to load your veterinarian consultation requests.');
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
      setEscalateSuccess(res.message || 'Request successfully escalated to next veterinarian.');
      fetchRequests();
      setTimeout(() => setEscalateSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to escalate request.');
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
            <span>Accepted</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-lg flex items-center space-x-1">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>{isEscalated ? 'No Vet Available' : 'Rejected'}</span>
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg flex items-center space-x-1">
            <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Completed</span>
          </span>
        );
      default:
        if (isEscalated) {
          return (
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg flex items-center space-x-1">
              <RotateCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              <span>Forwarded (Pending)</span>
            </span>
          );
        }
        return (
          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-lg flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending</span>
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
        title="My Veterinarian Requests"
        description="Track consultation requests submitted to veterinarians for your cattle AI screenings."
        breadcrumbs={['Home', 'Farmer', 'Vet Requests']}
        actions={
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition flex items-center space-x-1.5 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
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
          title="Total Requests"
          value={loading ? '...' : requests.length}
          icon={Stethoscope}
          badgeText="All Submitted"
          badgeType="neutral"
        />
        <StatCard
          title="Pending Requests"
          value={loading ? '...' : pendingCount}
          icon={Clock}
          badgeText={pendingCount > 0 ? 'Awaiting Doctor' : 'None'}
          badgeType={pendingCount > 0 ? 'amber' : 'neutral'}
        />
        <StatCard
          title="Accepted Consultations"
          value={loading ? '...' : acceptedCount}
          icon={CheckCircle}
          badgeText={acceptedCount > 0 ? 'Doctor Accepted' : 'None'}
          badgeType="success"
        />
        <StatCard
          title="Declined Requests"
          value={loading ? '...' : rejectedCount}
          icon={XCircle}
          badgeText={rejectedCount > 0 ? 'Declined' : 'None'}
          badgeType={rejectedCount > 0 ? 'amber' : 'neutral'}
        />
      </div>

      {/* Main Section */}
      <SectionCard
        title="Consultation Requests"
        subtitle="Manage and track status updates from veterinarians with automatic escalation"
        action={
          <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'accepted', label: 'Accepted' },
              { id: 'rejected', label: 'Rejected' }
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
            <p>Loading consultation requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            title="No Requests Found"
            description={
              statusFilter !== 'all'
                ? `No consultation requests matching status "${statusFilter}".`
                : 'You have not submitted any veterinarian consultation requests yet. Run an AI Health Scan to request a veterinarian.'
            }
            icon={Stethoscope}
            actionLabel="Run AI Health Scan"
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
                          <h4 className="text-sm font-bold text-slate-900">Dr. {reqItem.veterinarian?.name || 'Veterinarian'}</h4>
                          <span className="text-[11px] text-slate-500">{reqItem.veterinarian?.specialization || 'Veterinary Specialist'}</span>
                        </div>
                      </div>
                      {renderStatusBadge(reqItem)}
                    </div>

                    {hasHistory && (
                      <div className="p-2 bg-indigo-50/80 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 flex items-center space-x-1.5">
                        <RotateCw className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Forwarded to next veterinarian after previous doctor unavailable.</span>
                      </div>
                    )}

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-800 font-semibold">
                        <span>Cattle: {reqItem.cattle?.nameTag || 'Cattle'}</span>
                        <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-extrabold text-[10px]">
                          {reqItem.riskLevel} Risk
                        </span>
                      </div>
                      <div className="text-slate-600">
                        Condition: <strong className="text-slate-900">{reqItem.aiCondition}</strong>
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
                          title="Trigger manual escalation to next available veterinarian"
                        >
                          <RotateCw className={`w-3 h-3 ${escalatingId === reqItem._id ? 'animate-spin' : ''}`} />
                          <span>Escalate</span>
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedRequest(reqItem)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-slate-200 hover:border-blue-200 transition flex items-center space-x-1"
                      >
                        <span>Details</span>
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

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative my-8">
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold border border-blue-200 shrink-0">
                👨‍⚕️
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Dr. {selectedRequest.veterinarian?.name}</h3>
                <span className="text-xs text-slate-500 font-medium">{selectedRequest.veterinarian?.specialization || 'Veterinary Specialist'}</span>
                <div className="mt-1">{renderStatusBadge(selectedRequest)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block font-bold text-[10px] uppercase">Cattle Tag</span>
                <span className="font-semibold text-slate-800">{selectedRequest.cattle?.nameTag} ({selectedRequest.cattle?.breed})</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold text-[10px] uppercase">AI Condition</span>
                <span className="font-bold text-blue-900">{selectedRequest.aiCondition}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold text-[10px] uppercase">Risk Level</span>
                <span className="font-bold text-slate-800">{selectedRequest.riskLevel} Risk</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold text-[10px] uppercase">Request Date</span>
                <span className="font-semibold text-slate-800">{new Date(selectedRequest.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {selectedRequest.farmerMessage && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 block">Your Note to Doctor:</span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 italic">
                  "{selectedRequest.farmerMessage}"
                </p>
              </div>
            )}

            {/* Escalation History Timeline */}
            {selectedRequest.escalationHistory && selectedRequest.escalationHistory.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-slate-800 flex items-center space-x-1.5">
                  <RotateCw className="w-4 h-4 text-indigo-600" />
                  <span>Veterinarian Escalation History</span>
                </span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  {selectedRequest.escalationHistory.map((hist, idx) => (
                    <div key={idx} className="flex items-start space-x-2 border-b border-slate-200/60 pb-2 last:border-0 last:pb-0">
                      <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        ✕
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">Dr. {hist.veterinarian?.name || 'Previous Veterinarian'}</span>
                          <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 capitalize">
                            {hist.status === 'timeout' ? 'Response Timeout' : 'Declined'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 italic">"{hist.reason || 'Unavailable'}"</p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-1 flex items-center space-x-2 text-indigo-900 font-semibold text-[11px] bg-indigo-50/70 p-2 rounded-lg border border-indigo-100">
                    <CornerDownRight className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Reassigned to current doctor: <strong>Dr. {selectedRequest.veterinarian?.name}</strong></span>
                  </div>
                </div>
              </div>
            )}

            {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs space-y-1">
                <span className="font-bold block text-red-900">Reason for Status:</span>
                <p>{selectedRequest.rejectionReason}</p>
              </div>
            )}

            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-center space-x-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>AI screening is preliminary and does not replace professional veterinary diagnosis.</span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {selectedRequest.status === 'pending' ? (
                <button
                  onClick={() => handleEscalate(selectedRequest._id, true)}
                  disabled={escalatingId === selectedRequest._id}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${escalatingId === selectedRequest._id ? 'animate-spin' : ''}`} />
                  <span>{escalatingId === selectedRequest._id ? 'Escalating...' : 'Escalate to Next Doctor'}</span>
                </button>
              ) : <div />}

              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
