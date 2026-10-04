import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { paymentService } from '../../services/paymentService';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { StatCard } from '../../components/common/StatCard';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Wallet,
  Building2,
  CheckCircle2,
  CreditCard,
  RefreshCw,
  AlertCircle,
  Eye,
  XCircle
} from 'lucide-react';

export const FarmerPayments = () => {
  const { token } = useAuth();
  const [payments, setPayments] = useState([]);
  const [metrics, setMetrics] = useState({ totalPaid: 0, totalPending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedDetail, setSelectedDetail] = useState(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await paymentService.getFarmerPayments(token);
      setPayments(res.payments || []);
      if (res.metrics) {
        setMetrics(res.metrics);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch payment history');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment History & Ledger"
        description="View payment settlements disbursed by your connected dairy owner."
        breadcrumbs={['Home', 'Farmer Portal', 'Payments']}
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-800 font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Paid / Received"
          value={`₹ ${metrics.totalPaid.toFixed(2)}`}
          icon={CheckCircle2}
          badgeText="Disbursed Funds"
          badgeType="success"
        />
        <StatCard
          title="Pending Unpaid Balance"
          value={`₹ ${metrics.totalPending.toFixed(2)}`}
          icon={CreditCard}
          badgeText={metrics.totalPending > 0 ? 'Pending Settlement' : 'Clear Balance'}
          badgeType={metrics.totalPending > 0 ? 'amber' : 'success'}
        />
        <StatCard
          title="Settlement Receipts"
          value={`${payments.length} Payments`}
          icon={Wallet}
          badgeText="Total Issued Statements"
          badgeType="neutral"
        />
      </div>

      {/* History Ledger List */}
      <SectionCard
        title="Disbursed Settlement History"
        subtitle="Read-only ledger of payments received from your connected dairy"
        action={
          <button
            onClick={fetchPayments}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
            title="Refresh History"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        }
      >
        {loading ? (
          <div className="py-8 text-center text-slate-500 text-sm">Loading payment history...</div>
        ) : payments.length === 0 ? (
          <EmptyState
            title="No Payment Statements Recorded Yet"
            description="When your connected Dairy Owner creates a payment settlement for your milk collections, it will display here."
            icon={Wallet}
          />
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Dairy Owner</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4 text-right">Gross Amount</th>
                    <th className="py-3 px-4 text-right">Paid Received</th>
                    <th className="py-3 px-4 text-right">Remaining</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                          <div>
                            <div className="font-semibold text-slate-900">{p.dairyOwner?.name || 'Dairy Owner'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{p.dairyOwner?.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                        {new Date(p.paymentPeriodStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – {new Date(p.paymentPeriodEnd).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">₹{p.grossAmount?.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">₹{p.paidAmount?.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-800">₹{p.remainingAmount?.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.paymentStatus === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : p.paymentStatus === 'partiallyPaid'
                              ? 'bg-amber-100 text-amber-800'
                              : p.paymentStatus === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedDetail(p)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Statement"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View Cards */}
            <div className="md:hidden space-y-3">
              {payments.map((p) => (
                <div key={p._id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-900">{p.dairyOwner?.name || 'Dairy Owner'}</h4>
                        <p className="text-xs text-slate-500 font-mono">{p.dairyOwner?.phone}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : p.paymentStatus === 'partiallyPaid'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {p.paymentStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-200 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Gross</span>
                      <span className="font-mono font-bold text-slate-800">₹{p.grossAmount?.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Paid</span>
                      <span className="font-mono font-bold text-emerald-700">₹{p.paidAmount?.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Balance</span>
                      <span className="font-mono font-bold text-amber-800">₹{p.remainingAmount?.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-mono">
                    <span>{new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <button onClick={() => setSelectedDetail(p)} className="text-blue-600 font-bold hover:underline">
                      View Statement →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* DETAIL MODAL */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Payment Statement Details</h3>
              <button onClick={() => setSelectedDetail(null)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700 font-mono">
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Dairy Owner:</span>
                <span className="font-bold text-slate-900">{selectedDetail.dairyOwner?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Payment Date:</span>
                <span>{new Date(selectedDetail.paymentDate).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Payment Method:</span>
                <span className="capitalize font-semibold">{selectedDetail.paymentMethod}</span>
              </div>
              {selectedDetail.referenceNumber && (
                <div className="flex justify-between py-1 border-b">
                  <span className="text-slate-500">Ref / UTR:</span>
                  <span>{selectedDetail.referenceNumber}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Gross Settlement:</span>
                <span className="font-bold">₹{selectedDetail.grossAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-emerald-700 font-bold">Amount Paid:</span>
                <span className="font-bold text-emerald-700">₹{selectedDetail.paidAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-amber-800 font-bold">Remaining Balance:</span>
                <span className="font-bold text-amber-800">₹{selectedDetail.remainingAmount?.toFixed(2)}</span>
              </div>
              {selectedDetail.remarks && (
                <div className="py-1">
                  <span className="text-slate-500 block">Remarks:</span>
                  <p className="text-slate-800 font-sans italic mt-0.5">{selectedDetail.remarks}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
