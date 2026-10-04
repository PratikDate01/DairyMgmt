import { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  Package,
  ShoppingBag,
  Search,
  Eye,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Calendar,
  User,
  Phone
} from 'lucide-react';
import {
  getProviderMedicineRequests,
  getProviderRequestsSummary,
  acceptMedicineRequest,
  rejectMedicineRequest,
  packMedicineRequest,
  readyMedicineRequest,
  completeMedicineRequest,
  cancelMedicineRequest
} from '../../services/medicineRequestService';

const statusBadges = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', label: 'Pending' },
  accepted: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', label: 'Accepted' },
  packed: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', label: 'Packed' },
  ready: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200', label: 'Ready for Pickup' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', label: 'Completed' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', label: 'Rejected' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', label: 'Cancelled' }
};

export default function MedicalMedicineRequests() {
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    packed: 0,
    ready: 0,
    completed: 0,
    rejected: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalType, setModalType] = useState(null); // 'detail' | 'reject' | 'cancel'
  const [providerRemarks, setProviderRemarks] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, requestsRes] = await Promise.all([
        getProviderRequestsSummary(),
        getProviderMedicineRequests({
          status: statusFilter,
          search,
          startDate,
          endDate,
          page: currentPage,
          limit: 10
        })
      ]);

      if (summaryRes.success) setSummary(summaryRes.data);
      if (requestsRes.success) {
        setRequests(requestsRes.data);
        setTotalPages(requestsRes.pagination?.totalPages || 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch medicine requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, currentPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData();
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setSearch('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Status Action Handlers
  const handleAccept = async (requestId) => {
    try {
      setActionLoading(true);
      const res = await acceptMedicineRequest(requestId);
      if (res.success) {
        setSuccessMsg('Request accepted successfully! Stock has been reserved.');
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept request');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePack = async (requestId) => {
    try {
      setActionLoading(true);
      const res = await packMedicineRequest(requestId);
      if (res.success) {
        setSuccessMsg('Request marked as packed.');
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to pack request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReady = async (requestId) => {
    try {
      setActionLoading(true);
      const res = await readyMedicineRequest(requestId);
      if (res.success) {
        setSuccessMsg('Request marked ready for collection.');
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set ready status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (requestId) => {
    try {
      setActionLoading(true);
      const res = await completeMedicineRequest(requestId);
      if (res.success) {
        setSuccessMsg('Request marked as completed.');
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete request');
    } finally {
      setActionLoading(false);
    }
  };

  const submitReject = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      const res = await rejectMedicineRequest(selectedRequest._id, providerRemarks);
      if (res.success) {
        setSuccessMsg('Request rejected.');
        setModalType(null);
        setSelectedRequest(null);
        setProviderRemarks('');
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  const submitCancel = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      const res = await cancelMedicineRequest(selectedRequest._id, cancelReason);
      if (res.success) {
        setSuccessMsg('Request cancelled successfully. Any reserved stock was restored.');
        setModalType(null);
        setSelectedRequest(null);
        setCancelReason('');
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel request');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Medicine Requests</h1>
          <p className="text-slate-500 text-sm">Manage incoming farmer requests, order packing, and fulfillment.</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-50 shadow-sm transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Alert Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{summary.pending}</p>
          <p className="text-xs text-slate-400 mt-1">Awaiting acceptance</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Accepted</span>
            <Check className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{summary.accepted}</p>
          <p className="text-xs text-slate-400 mt-1">Stock reserved</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Packed</span>
            <Package className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{summary.packed}</p>
          <p className="text-xs text-slate-400 mt-1">Ready for pickup prep</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Ready</span>
            <ShoppingBag className="w-5 h-5 text-teal-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{summary.ready}</p>
          <p className="text-xs text-slate-400 mt-1">Waiting collection</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Completed</span>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{summary.completed}</p>
          <p className="text-xs text-slate-400 mt-1">Fulfilled requests</p>
        </div>
      </div>

      {/* Filter Tabs & Search Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100">
          {['all', 'pending', 'accepted', 'packed', 'ready', 'completed', 'rejected', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st} {st !== 'all' && `(${summary[st] || 0})`}
            </button>
          ))}
        </div>

        {/* Search & Dates Form */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search medicine or farmer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition shadow-sm"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-sm">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-base font-semibold text-slate-700">No requests found</p>
            <p className="text-xs text-slate-400">Try adjusting search or status filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Farmer Details</th>
                    <th className="p-4">Medicine</th>
                    <th className="p-4">Quantity</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Requested On</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {requests.map((req) => {
                    const badge = statusBadges[req.status] || statusBadges.pending;
                    return (
                      <tr key={req._id} className="hover:bg-slate-50 transition">
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{req.farmer?.name || 'Farmer'}</div>
                          <div className="text-xs text-slate-400">{req.farmer?.phone || 'N/A'}</div>
                        </td>

                        <td className="p-4">
                          <div className="font-medium text-slate-800">{req.medicineNameSnapshot}</div>
                          <div className="text-xs text-slate-400">₹{req.unitPriceSnapshot} / unit</div>
                        </td>

                        <td className="p-4">
                          <span className="font-semibold text-slate-800">{req.quantity}</span>
                        </td>

                        <td className="p-4 font-bold text-slate-800">
                          ₹{req.totalAmount}
                        </td>

                        <td className="p-4 text-xs text-slate-500">
                          {new Date(req.requestedAt || req.createdAt).toLocaleDateString()}
                          <div className="text-[11px] text-slate-400">
                            {new Date(req.requestedAt || req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {badge.label}
                          </span>
                        </td>

                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                          {req.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAccept(req._id)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-sm transition"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => { setSelectedRequest(req); setModalType('reject'); }}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {req.status === 'accepted' && (
                            <>
                              <button
                                onClick={() => handlePack(req._id)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm transition"
                              >
                                Mark Packed
                              </button>
                              <button
                                onClick={() => { setSelectedRequest(req); setModalType('cancel'); }}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {req.status === 'packed' && (
                            <button
                              onClick={() => handleReady(req._id)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-medium shadow-sm transition"
                            >
                              Mark Ready
                            </button>
                          )}

                          {req.status === 'ready' && (
                            <button
                              onClick={() => handleComplete(req._id)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-sm transition"
                            >
                              Complete
                            </button>
                          )}

                          <button
                            onClick={() => { setSelectedRequest(req); setModalType('detail'); }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition inline-flex items-center gap-1 text-xs font-medium"
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal: Request Details & Timeline */}
      {modalType === 'detail' && selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Request Details</h3>
                <p className="text-xs text-slate-400">ID: {selectedRequest._id}</p>
              </div>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Farmer Info */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" /> Farmer Details
              </h4>
              <p className="text-sm font-semibold text-slate-800">{selectedRequest.farmer?.name || 'N/A'}</p>
              <p className="text-xs text-slate-600 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedRequest.farmer?.phone || 'N/A'}
              </p>
              {selectedRequest.farmer?.address && (
                <p className="text-xs text-slate-500">Address: {selectedRequest.farmer.address}</p>
              )}
            </div>

            {/* Medicine Info & Pricing */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Order Summary</h4>
              <div className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-lg">
                <div>
                  <span className="font-semibold text-slate-800">{selectedRequest.medicineNameSnapshot}</span>
                  <p className="text-xs text-slate-400">₹{selectedRequest.unitPriceSnapshot} × {selectedRequest.quantity} units</p>
                </div>
                <span className="text-base font-bold text-slate-900">₹{selectedRequest.totalAmount}</span>
              </div>
              {selectedRequest.notes && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800">
                  <span className="font-semibold">Farmer Notes:</span> {selectedRequest.notes}
                </div>
              )}
              {selectedRequest.providerRemarks && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
                  <span className="font-semibold">Provider Remarks:</span> {selectedRequest.providerRemarks}
                </div>
              )}
            </div>

            {/* Status Timeline */}
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Timeline</h4>
              <div className="space-y-4 relative pl-4 border-l-2 border-slate-200 ml-2">
                {/* Step 1: Requested */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                  <p className="text-xs font-semibold text-slate-800">Requested</p>
                  <p className="text-[11px] text-slate-400">{new Date(selectedRequest.requestedAt || selectedRequest.createdAt).toLocaleString()}</p>
                </div>

                {/* Step 2: Accepted */}
                {selectedRequest.acceptedAt && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white" />
                    <p className="text-xs font-semibold text-slate-800">Accepted</p>
                    <p className="text-[11px] text-slate-400">{new Date(selectedRequest.acceptedAt).toLocaleString()}</p>
                  </div>
                )}

                {/* Step 3: Packed */}
                {selectedRequest.packedAt && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-purple-600 border-2 border-white" />
                    <p className="text-xs font-semibold text-slate-800">Packed</p>
                    <p className="text-[11px] text-slate-400">{new Date(selectedRequest.packedAt).toLocaleString()}</p>
                  </div>
                )}

                {/* Step 4: Ready */}
                {selectedRequest.readyAt && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-teal-600 border-2 border-white" />
                    <p className="text-xs font-semibold text-slate-800">Ready for Collection</p>
                    <p className="text-[11px] text-slate-400">{new Date(selectedRequest.readyAt).toLocaleString()}</p>
                  </div>
                )}

                {/* Step 5: Completed */}
                {selectedRequest.completedAt && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white" />
                    <p className="text-xs font-semibold text-slate-800">Completed</p>
                    <p className="text-[11px] text-slate-400">{new Date(selectedRequest.completedAt).toLocaleString()}</p>
                  </div>
                )}

                {/* Cancelled / Rejected */}
                {selectedRequest.cancelledAt && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-gray-500 border-2 border-white" />
                    <p className="text-xs font-semibold text-gray-800">Cancelled</p>
                    <p className="text-[11px] text-slate-400">{new Date(selectedRequest.cancelledAt).toLocaleString()}</p>
                  </div>
                )}

                {selectedRequest.rejectedAt && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                    <p className="text-xs font-semibold text-red-800">Rejected</p>
                    <p className="text-[11px] text-slate-400">{new Date(selectedRequest.rejectedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reject Request */}
      {modalType === 'reject' && selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={submitReject} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Reject Medicine Request</h3>
            <p className="text-xs text-slate-500">Provide optional remarks for rejecting request from {selectedRequest.farmer?.name}.</p>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Remarks / Reason</label>
              <textarea
                rows={3}
                value={providerRemarks}
                onChange={(e) => setProviderRemarks(e.target.value)}
                placeholder="e.g. Out of stock, expired batch..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium shadow-sm"
              >
                {actionLoading ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Cancel Request */}
      {modalType === 'cancel' && selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={submitCancel} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Cancel Medicine Request</h3>
            <p className="text-xs text-slate-500">Cancelling will restore the deducted stock of {selectedRequest.quantity} units to inventory.</p>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Cancellation Reason</label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer requested cancellation..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm font-medium shadow-sm"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
