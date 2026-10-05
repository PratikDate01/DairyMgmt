import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { diseaseScanService } from '../../services/diseaseScanService';
import { vetRequestService } from '../../services/vetRequestService';
import {
  Stethoscope,
  CheckCircle,
  Clock,
  Building2,
  Info,
  RefreshCw,
  X,
  UserCheck,
  Send,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export const VeterinarianRecommendations = ({ scanId, conditionName }) => {
  const { token } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [farmerRequests, setFarmerRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [selectedVet, setSelectedVet] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(null);
  const [farmerMessage, setFarmerMessage] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const fetchRecommendationsAndRequests = async () => {
    if (!scanId || !token) return;
    try {
      setLoading(true);
      setError('');
      const data = await diseaseScanService.getRecommendedVeterinarians(scanId, token);
      setRecommendations(data.recommendations || []);

      // Fetch farmer's existing vet requests to disable duplicates & show status badges
      try {
        const reqs = await vetRequestService.getFarmerRequests(token);
        setFarmerRequests(reqs || []);
      } catch {
        setFarmerRequests([]);
      }
    } catch (err) {
      console.error('Failed to load recommended veterinarians:', err);
      setError(err.message || 'Unable to load veterinarian recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendationsAndRequests();
  }, [scanId, token]);

  const handleOpenRequestModal = (vet) => {
    setShowRequestModal(vet);
    setFarmerMessage('');
    setError('');
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!showRequestModal || !scanId) return;

    setSubmittingRequest(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await vetRequestService.createVetRequest(
        {
          veterinarianId: showRequestModal.veterinarianId,
          diseaseScanId: scanId,
          farmerMessage: farmerMessage
        },
        token
      );

      setSuccessMsg(res.message || `Consultation request sent successfully to Dr. ${showRequestModal.name}.`);
      setShowRequestModal(null);
      fetchRecommendationsAndRequests();
    } catch (err) {
      setError(err.message || 'Failed to send consultation request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const getExistingRequestStatus = (vetId) => {
    const existing = farmerRequests.find(
      (r) =>
        (r.diseaseScan?._id === scanId || r.diseaseScan === scanId) &&
        (r.veterinarian?._id === vetId || r.veterinarian === vetId)
    );
    return existing ? existing.status : null;
  };

  const getBadgeStyle = (badge) => {
    switch (badge) {
      case 'Best Match':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Recommended':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-4 pt-6 border-t border-slate-200">
      {/* Alerts */}
      {successMsg && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-slate-900 to-blue-950 p-5 rounded-2xl text-white shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-blue-500/20 rounded-xl text-blue-300">
              <Stethoscope className="w-5 h-5" />
            </span>
            <h3 className="text-base font-extrabold tracking-tight">Recommended Veterinarians</h3>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Based on preliminary AI screening results for <strong className="text-blue-200">{conditionName || 'your cattle'}</strong>, these registered veterinarians are matched by clinical expertise and availability.
          </p>
        </div>

        <button
          onClick={fetchRecommendationsAndRequests}
          disabled={loading}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-sm transition shrink-0 flex items-center space-x-1.5 self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Notice Disclaimer */}
      <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Veterinary Matching & Consultation</span>
          <span>
            Based on the preliminary AI screening, these veterinarians may be suitable for consultation. Select a veterinarian to request a professional case review.
          </span>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs font-bold text-slate-700">Finding suitable veterinarians...</p>
          <p className="text-[11px] text-slate-400">Analyzing expertise, specialization, and availability match</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && recommendations.length === 0 && (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-xl font-bold">
            👨‍⚕️
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Registered Veterinarians Found</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No veterinarians are currently registered for recommendation in the system. As new veterinarians register, suitable matches will appear here.
          </p>
        </div>
      )}

      {/* Recommendations Cards Grid */}
      {!loading && recommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((vet) => {
            const reqStatus = getExistingRequestStatus(vet.veterinarianId);
            const isPending = reqStatus === 'pending';
            const isAccepted = reqStatus === 'accepted';
            const isRejected = reqStatus === 'rejected';

            return (
              <div
                key={vet.veterinarianId}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Top Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold border border-blue-200 shrink-0">
                        👨‍⚕️
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base font-extrabold text-slate-900">Dr. {vet.name}</h4>
                        </div>
                        <span className="text-xs font-medium text-slate-500 block">{vet.specialization}</span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg border ${getBadgeStyle(vet.badge)}`}>
                      {vet.badge} ({vet.matchScore}%)
                    </span>
                  </div>

                  {/* Clinic & Availability Info */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center text-slate-700 space-x-1.5 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{vet.clinicName}</span>
                    </div>
                    <div className="flex items-center text-slate-600 space-x-1.5">
                      <Clock className={`w-3.5 h-3.5 ${vet.availability === 'available' ? 'text-emerald-500' : vet.availability === 'busy' ? 'text-amber-500' : 'text-slate-400'}`} />
                      <span className={`font-semibold capitalize ${vet.availability === 'available' ? 'text-emerald-700' : vet.availability === 'busy' ? 'text-amber-700' : 'text-slate-500'}`}>
                        Status: {vet.availability}
                      </span>
                    </div>
                  </div>

                  {/* Match Reasons */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Match Rationale</span>
                    <div className="space-y-1">
                      {vet.matchReasons.map((reason, idx) => (
                        <div key={idx} className="flex items-start space-x-1.5 text-xs text-slate-700">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expertise Badges */}
                  <div className="pt-1 flex flex-wrap gap-1">
                    {vet.expertise.map((item, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md border border-blue-100">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVet(vet)}
                    className="py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Profile</span>
                  </button>

                  {isPending ? (
                    <button
                      type="button"
                      disabled
                      className="py-2 px-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 cursor-not-allowed"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Request Pending</span>
                    </button>
                  ) : isAccepted ? (
                    <button
                      type="button"
                      disabled
                      className="py-2 px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 cursor-not-allowed"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Accepted</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenRequestModal(vet)}
                      className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isRejected ? 'Request Again' : 'Request Vet'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VET PROFILE POPUP MODAL */}
      {selectedVet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedVet(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3.5">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold border border-blue-200 shrink-0">
                👨‍⚕️
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Dr. {selectedVet.name}</h3>
                <span className="text-xs font-semibold text-blue-700 block">{selectedVet.specialization}</span>
                <span className="text-[11px] text-slate-500 font-medium">{selectedVet.clinicName}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Consultation Status:</span>
                <span className="font-bold text-emerald-700 capitalize">{selectedVet.availability}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Suitability Score:</span>
                <span className="font-bold text-blue-700">{selectedVet.matchScore}% ({selectedVet.matchLevel})</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 block">Areas of Clinical Expertise:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedVet.expertise.map((item, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-800 font-bold text-xs rounded-lg border border-blue-100">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedVet(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION & REQUEST CREATION MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowRequestModal(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl font-bold">
                🩺
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Request Veterinarian Review</h3>
                <span className="text-xs text-slate-500">Dr. {showRequestModal.name} ({showRequestModal.specialization})</span>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1 text-blue-950">
              <div className="flex justify-between">
                <span>Preliminary AI Result:</span>
                <strong className="font-bold">{conditionName || 'Cattle Health Concern'}</strong>
              </div>
              <p className="text-[11px] text-blue-800 pt-1 border-t border-blue-200/60">
                You are requesting this licensed veterinarian to review your cattle's health screening report.
              </p>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message / Notes for Veterinarian (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Describe observed behavior, symptoms duration, or specific questions for the doctor..."
                  value={farmerMessage}
                  onChange={(e) => setFarmerMessage(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start space-x-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  The AI screening result is a preliminary assessment. The veterinarian will evaluate your cattle's case and provide professional advice.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Send className={`w-3.5 h-3.5 ${submittingRequest ? 'animate-spin' : ''}`} />
                  <span>{submittingRequest ? 'Sending Request...' : 'Send Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
