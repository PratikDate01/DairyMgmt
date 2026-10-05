import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { veterinarianService } from '../../services/veterinarianService';
import { vetRequestService } from '../../services/vetRequestService';
import {
  Activity,
  Stethoscope,
  CheckCircle,
  Clock,
  Info,
  User,
  ChevronRight,
  Send,
  XCircle,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { CaseDetailModal } from './CaseDetailModal';

export const PendingCases = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('incoming_requests'); // 'incoming_requests' | 'general_queue'

  // Vet Requests state (Phase 21)
  const [vetRequests, setVetRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestError, setRequestError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // General Case Queue state
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [caseError, setCaseError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCase, setSelectedCase] = useState(null);

  // Rejection modal state
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Fetch Incoming Vet Requests
  const fetchVetRequests = async () => {
    setLoadingRequests(true);
    setRequestError('');
    try {
      const data = await vetRequestService.getVeterinarianRequests(token);
      setVetRequests(data);
    } catch (err) {
      console.error('Error fetching vet requests:', err);
      setRequestError(err.message || 'Failed to fetch incoming consultation requests.');
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch General Cases
  const fetchCases = async () => {
    setLoadingCases(true);
    setCaseError('');
    try {
      const data = await veterinarianService.getCases(token, statusFilter);
      setCases(data);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setCaseError(err.message || 'Failed to fetch cases queue.');
    } finally {
      setLoadingCases(false);
    }
  };

  useEffect(() => {
    fetchVetRequests();
    fetchCases();
  }, [token, statusFilter]);

  // Handle Accept Request
  const handleAcceptRequest = async (requestId) => {
    setSubmittingAction(true);
    setRequestError('');
    setSuccessMsg('');
    try {
      const res = await vetRequestService.acceptVetRequest(requestId, token);
      setSuccessMsg(res.message || 'Consultation request accepted!');
      fetchVetRequests();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setRequestError(err.message || 'Failed to accept request.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Reject Request Submit
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingRequest) return;

    setSubmittingAction(true);
    setRequestError('');
    setSuccessMsg('');
    try {
      const res = await vetRequestService.rejectVetRequest(rejectingRequest._id, rejectionReason, token);
      setSuccessMsg(res.message || 'Consultation request declined.');
      setRejectingRequest(null);
      setRejectionReason('');
      fetchVetRequests();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setRequestError(err.message || 'Failed to decline request.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCaseUpdated = (updatedCase) => {
    setCases((prev) => prev.map((c) => (c._id === updatedCase._id ? updatedCase : c)));
    setSelectedCase(updatedCase);
  };

  const pendingRequestsCount = vetRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Stethoscope className="w-6 h-6 text-teal-600" />
            <span>Veterinarian Clinical Console</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review incoming farmer consultation requests and manage livestock disease screening cases.
          </p>
        </div>

        {/* Console Main Tabs */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('incoming_requests')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'incoming_requests'
                ? 'bg-white text-teal-700 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Incoming Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-extrabold ml-1">
                {pendingRequestsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('general_queue')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'general_queue'
                ? 'bg-white text-teal-700 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Disease Cases Queue</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}
      {(requestError || caseError) && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{requestError || caseError}</span>
        </div>
      )}

      {/* TAB 1: INCOMING FARMER VET REQUESTS (Phase 21) */}
      {activeTab === 'incoming_requests' && (
        <div className="space-y-4">
          {loadingRequests ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
              <p className="text-xs font-medium text-slate-500">Loading incoming farmer requests...</p>
            </div>
          ) : vetRequests.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto text-xl">
                👨‍⚕️
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Incoming Requests</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                There are currently no consultation requests submitted directly to your profile by farmers.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vetRequests.map((reqItem) => {
                const isPending = reqItem.status === 'pending';
                const isAccepted = reqItem.status === 'accepted';
                const isRejected = reqItem.status === 'rejected';

                return (
                  <div
                    key={reqItem._id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 transition space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md flex items-center space-x-1">
                          <span>🐄 {reqItem.cattle?.nameTag || 'Cattle'}</span>
                        </span>
                        <div className="flex items-center space-x-1">
                          {reqItem.escalationHistory && reqItem.escalationHistory.length > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                              🔁 Referred Request
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isAccepted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isRejected
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {reqItem.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Farmer & Condition info */}
                      <div className="flex items-start space-x-3">
                        {reqItem.diseaseScan?.imageUrl ? (
                          <img
                            src={reqItem.diseaseScan.imageUrl}
                            alt="Cattle scan"
                            className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-xl shrink-0">
                            🐄
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">{reqItem.aiCondition}</h4>
                          <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="font-semibold text-slate-700">{reqItem.farmer?.name || 'Farmer'}</span>
                          </p>
                          <p className="text-[10px] text-slate-400">Phone: {reqItem.farmer?.phone}</p>
                        </div>
                      </div>

                      {/* Farmer Message */}
                      {reqItem.farmerMessage && (
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 italic">
                          <strong className="not-italic text-slate-900 block mb-0.5 font-semibold">Farmer's Message:</strong>
                          "{reqItem.farmerMessage}"
                        </div>
                      )}

                      {/* Rejection Reason display if rejected */}
                      {isRejected && reqItem.rejectionReason && (
                        <div className="p-2.5 bg-red-50 rounded-xl border border-red-100 text-[11px] text-red-800">
                          <strong>Rejection Note:</strong> {reqItem.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Action Footer */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="text-[10px] text-slate-400 font-mono">
                        Requested: {new Date(reqItem.createdAt).toLocaleDateString()}
                      </div>

                      {isPending ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setRejectingRequest(reqItem)}
                            disabled={submittingAction}
                            className="py-1.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAcceptRequest(reqItem._id)}
                            disabled={submittingAction}
                            className="py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-2 text-center text-xs font-bold text-slate-600 bg-slate-50 rounded-xl border border-slate-200 capitalize">
                          Request {reqItem.status}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GENERAL DISEASE CASES QUEUE */}
      {activeTab === 'general_queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700">Filter Cases by Status</span>
            <div className="flex items-center space-x-1 text-xs font-semibold">
              {[
                { id: 'all', label: 'All Cases' },
                { id: 'pending_review', label: 'Pending' },
                { id: 'under_review', label: 'In Progress' },
                { id: 'review_completed', label: 'Completed' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1 rounded-lg transition ${
                    statusFilter === tab.id
                      ? 'bg-teal-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loadingCases ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-3"></div>
              <p className="text-xs font-medium text-slate-500">Loading cases queue...</p>
            </div>
          ) : cases.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto text-xl">
                🩺
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Cases Found</h3>
              <p className="text-xs text-slate-500">
                There are currently no cattle disease cases matching the selected status filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cases.map((caseItem) => (
                <div
                  key={caseItem._id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-400 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                        {caseItem.animalType} • {caseItem.animalIdTag}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        caseItem.veterinarianReviewStatus === 'review_completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : caseItem.veterinarianReviewStatus === 'under_review'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {caseItem.veterinarianReviewStatus.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-start space-x-3">
                      <img
                        src={caseItem.imageUrl}
                        alt="Cattle scan"
                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 flex-shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{caseItem.detectedCondition}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{caseItem.farmer?.name || 'Farmer'} ({caseItem.farmer?.phone})</span>
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 line-clamp-2">
                      <strong className="text-slate-800">Symptoms:</strong> {caseItem.symptoms || 'None reported.'}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(caseItem.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => setSelectedCase(caseItem)}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1"
                    >
                      <span>Review Case</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REJECTION REASON CONFIRMATION MODAL */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => {
                setRejectingRequest(null);
                setRejectionReason('');
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-xl font-bold">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Decline Consultation Request</h3>
                <span className="text-xs text-slate-500">From Farmer: {rejectingRequest.farmer?.name}</span>
              </div>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                <span className="font-bold block">Automatic Escalation Notice:</span>
                <p>Declining this request will record your response and automatically forward the consultation request to the next suitable veterinarian.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Declining (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Currently fully booked, clinic out of area, or please consult another specialist..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingRequest(null);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <span>{submittingAction ? 'Declining...' : 'Decline & Find Another Vet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Review Modal */}
      {selectedCase && (
        <CaseDetailModal
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
          onCaseUpdated={handleCaseUpdated}
        />
      )}
    </div>
  );
};
