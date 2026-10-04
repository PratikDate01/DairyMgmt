import { useState, useEffect } from 'react';
import {
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  X
} from 'lucide-react';
import {
  getMyMedicineRequests,
  cancelMedicineRequest
} from '../../services/medicineRequestService';
import { PageHeader } from '../../components/common/PageHeader';

const statusBadges = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', label: 'Pending' },
  accepted: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', label: 'Accepted' },
  packed: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', label: 'Packed' },
  ready: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200', label: 'Ready for Pickup' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', label: 'Completed' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', label: 'Rejected' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', label: 'Cancelled' }
};

export default function FarmerMedicineRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getMyMedicineRequests({
        status: statusFilter,
        page: currentPage,
        limit: 10
      });

      if (res.success) {
        setRequests(res.data);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch your requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, currentPage]);

  const handleCancel = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this pending request?')) return;
    try {
      setCancellingId(requestId);
      const res = await cancelMedicineRequest(requestId, 'Cancelled by farmer');
      if (res.success) {
        setSuccessMsg('Request cancelled successfully.');
        fetchRequests();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel request');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Medicine Requests"
        description="Track the status of your submitted medicine requests and pickup schedules."
        breadcrumbs={['Home', 'Farmer Portal', 'My Requests']}
        actions={
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-500 font-bold text-xs">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 font-bold text-xs">Dismiss</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['all', 'pending', 'accepted', 'packed', 'ready', 'completed', 'rejected', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table / List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs">Loading requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No requests found</p>
            <p className="text-xs text-slate-400">You have not submitted any medicine requests in this status.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Medicine Requested</th>
                    <th className="p-4">Medical Provider</th>
                    <th className="p-4">Quantity</th>
                    <th className="p-4">Total Price</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {requests.map((req) => {
                    const badge = statusBadges[req.status] || statusBadges.pending;
                    return (
                      <tr key={req._id} className="hover:bg-slate-50 transition">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{req.medicineNameSnapshot}</div>
                          <div className="text-[11px] text-slate-400">₹{req.unitPriceSnapshot} / unit</div>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{req.medicalProvider?.name || 'Provider'}</div>
                          <div className="text-[11px] text-slate-400">{req.medicalProvider?.phone || 'N/A'}</div>
                        </td>

                        <td className="p-4 font-semibold text-slate-800">
                          {req.quantity}
                        </td>

                        <td className="p-4 font-bold text-emerald-700 font-mono text-sm">
                          ₹{req.totalAmount}
                        </td>

                        <td className="p-4 text-slate-500 text-[11px]">
                          {new Date(req.requestedAt || req.createdAt).toLocaleDateString()}
                        </td>

                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {badge.label}
                          </span>
                        </td>

                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                          {req.status === 'pending' && (
                            <button
                              onClick={() => handleCancel(req._id)}
                              disabled={cancellingId === req._id}
                              className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold transition"
                            >
                              {cancellingId === req._id ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Details & Status Timeline Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">Request Timeline & Details</h3>
                <p className="text-[11px] text-slate-400">ID: {selectedRequest._id}</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-xs">
              <p className="font-bold text-slate-900">{selectedRequest.medicineNameSnapshot}</p>
              <p className="text-slate-500">Provider: <span className="font-semibold text-slate-700">{selectedRequest.medicalProvider?.name}</span> ({selectedRequest.medicalProvider?.phone})</p>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-700 font-medium">
                <span>Qty: {selectedRequest.quantity} units @ ₹{selectedRequest.unitPriceSnapshot}</span>
                <span className="font-bold text-slate-900">Total: ₹{selectedRequest.totalAmount}</span>
              </div>
            </div>

            {selectedRequest.notes && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800">
                <span className="font-semibold">My Notes:</span> {selectedRequest.notes}
              </div>
            )}

            {selectedRequest.providerRemarks && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
                <span className="font-semibold">Provider Remarks:</span> {selectedRequest.providerRemarks}
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Timeline</h4>
              <div className="space-y-4 relative pl-4 border-l-2 border-slate-200 ml-2 text-xs">
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                  <p className="font-semibold text-slate-800">Requested</p>
                  <p className="text-[10px] text-slate-400">{new Date(selectedRequest.requestedAt || selectedRequest.createdAt).toLocaleString()}</p>
                </div>

                {selectedRequest.acceptedAt && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white" />
                    <p className="font-semibold text-slate-800">Accepted by Provider</p>
                    <p className="text-[10px] text-slate-400">{new Date(selectedRequest.acceptedAt).toLocaleString()}</p>
                  </div>
                )}

                {selectedRequest.packedAt && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-purple-600 border-2 border-white" />
                    <p className="font-semibold text-slate-800">Medicine Packed</p>
                    <p className="text-[10px] text-slate-400">{new Date(selectedRequest.packedAt).toLocaleString()}</p>
                  </div>
                )}

                {selectedRequest.readyAt && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-teal-600 border-2 border-white" />
                    <p className="font-semibold text-slate-800">Ready for Collection</p>
                    <p className="text-[10px] text-slate-400">{new Date(selectedRequest.readyAt).toLocaleString()}</p>
                  </div>
                )}

                {selectedRequest.completedAt && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white" />
                    <p className="font-semibold text-slate-800">Completed</p>
                    <p className="text-[10px] text-slate-400">{new Date(selectedRequest.completedAt).toLocaleString()}</p>
                  </div>
                )}

                {selectedRequest.cancelledAt && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-gray-500 border-2 border-white" />
                    <p className="font-semibold text-gray-800">Cancelled</p>
                    <p className="text-[10px] text-slate-400">{new Date(selectedRequest.cancelledAt).toLocaleString()}</p>
                  </div>
                )}

                {selectedRequest.rejectedAt && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                    <p className="font-semibold text-red-800">Rejected</p>
                    <p className="text-[10px] text-slate-400">{new Date(selectedRequest.rejectedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
