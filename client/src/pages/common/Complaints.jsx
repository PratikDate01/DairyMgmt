import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { complaintService } from '../../services/complaintService';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/EmptyState';
import {
  MessageSquare,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  X,
  ShieldCheck,
  Tag,
  Calendar,
  Info
} from 'lucide-react';

export const Complaints = () => {
  const { user, token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Submit Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Status Filter
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchComplaints = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const res = await complaintService.getMyComplaints(token);
      setComplaints(res.complaints || []);
    } catch (err) {
      console.error('Failed to load complaints:', err);
      setError(err.message || 'Unable to load your complaint history.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccessMsg('');
      const res = await complaintService.submitComplaint(token, {
        title: title.trim(),
        category,
        description: description.trim()
      });
      setSuccessMsg(res.message || 'Your complaint has been submitted for administrative review.');
      setTitle('');
      setCategory('general');
      setDescription('');
      setShowModal(false);
      fetchComplaints();
    } catch (err) {
      setError(err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (statusFilter === 'all') return true;
    return c.status === statusFilter;
  });

  const categoryLabels = {
    general: 'General Support',
    milk_collection: 'Milk Collection Discrepancy',
    payments: 'Payment & Ledger Dispute',
    veterinary: 'Veterinary Consultation Issue',
    medicines: 'Medicine Procurement / Order',
    fodder: 'Fodder Marketplace Issue',
    account: 'Account & Verification Support'
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complaints & Grievance Support"
        description="Submit grievances, report platform discrepancies, and track administrative resolutions with complete transparency."
        breadcrumbs={['Home', 'Complaints & Support']}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setShowModal(true);
                setError('');
                setSuccessMsg('');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log New Complaint</span>
            </button>
            <button
              onClick={fetchComplaints}
              className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition"
              title="Refresh Complaints"
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* Success / Error Feedback */}
      {successMsg && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* Main Section */}
      <SectionCard
        title="My Grievance History"
        subtitle="Track submitted issues and administrator responses"
        action={
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses ({complaints.length})</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        }
      >
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
            Loading complaint history...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <EmptyState
            title="No Complaints Logged"
            description="You have no recorded complaints matching this filter. Click 'Log New Complaint' to submit an issue to administrators."
            icon={MessageSquare}
          />
        ) : (
          <div className="space-y-3">
            {filteredComplaints.map((c) => (
              <div
                key={c._id}
                className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-slate-900">{c.title}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        {categoryLabels[c.category] || c.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-3">
                      <span>Submitted: {new Date(c.createdAt).toLocaleString()}</span>
                      {c.resolvedAt && (
                        <span className="text-emerald-700 font-medium">
                          Resolved: {new Date(c.resolvedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`self-start sm:self-auto px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      c.status === 'resolved' || c.status === 'closed'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : c.status === 'in_progress'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {c.status?.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {c.description}
                </p>

                {/* Administrator Resolution Notes */}
                {c.adminNotes ? (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-emerald-900 flex items-center space-x-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Administrator Resolution Notes</span>
                    </div>
                    <p className="text-emerald-800">{c.adminNotes}</p>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Awaiting administrator evaluation & resolution notes</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Submission Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Submit Grievance to Platform Administrators</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Complaint Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Milk quantity logged incorrectly for morning shift"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Issue Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="general">General Support</option>
                  <option value="milk_collection">Milk Collection Discrepancy</option>
                  <option value="payments">Payment & Ledger Dispute</option>
                  <option value="veterinary">Veterinary Consultation Issue</option>
                  <option value="medicines">Medicine Procurement / Order</option>
                  <option value="fodder">Fodder Marketplace Issue</option>
                  <option value="account">Account & Verification Support</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Detailed Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide date, cattle ID, transaction details, or other context to assist the administrator in resolving your grievance..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center space-x-1.5"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Grievance</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
