import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services/reportService';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { StatCard } from '../../components/common/StatCard';
import {
  Users,
  Wallet,
  Building2,
  Stethoscope,
  CreditCard,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Lock
} from 'lucide-react';

export const AdminReports = () => {
  const { token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAdminReports = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await reportService.getDashboardSummary(token);
      if (res.metrics) {
        setDashboardData(res.metrics);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch system analytics summary');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAdminReports();
  }, [fetchAdminReports]);

  const metrics = dashboardData || {
    users: { totalUsers: 0, totalFarmers: 0, totalDairyOwners: 0, totalMedicalProviders: 0 },
    milk: { totalQuantity: 0, totalValue: 0 },
    payments: { totalPayments: 0, totalGross: 0, totalPaid: 0, totalOutstanding: 0 }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Administration & Global Reports"
        description="Read-only high-level analytics across system users, milk collections, and payment volumes."
        breadcrumbs={['Home', 'Admin Panel', 'Reports']}
        actions={
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold rounded-lg flex items-center">
              <Lock className="w-3.5 h-3.5 mr-1 text-amber-600" /> Read-Only Admin Console
            </span>
            <button
              onClick={fetchAdminReports}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        }
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

      {/* User Statistics */}
      <SectionCard title="System Registered User Demographics" subtitle="Aggregated count of active registered accounts across system roles">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Registered Accounts"
            value={loading ? '...' : `${metrics.users.totalUsers} Users`}
            icon={Users}
            badgeText="System Ecosystem"
            badgeType="neutral"
          />
          <StatCard
            title="Total Farmers"
            value={loading ? '...' : `${metrics.users.totalFarmers} Farmers`}
            icon={Users}
            badgeText="Registered Milk Producers"
            badgeType="success"
          />
          <StatCard
            title="Total Dairy Owners"
            value={loading ? '...' : `${metrics.users.totalDairyOwners} Dairies`}
            icon={Building2}
            badgeText="Registered Processing Units"
            badgeType="neutral"
          />
          <StatCard
            title="Total Medical Providers"
            value={loading ? '...' : `${metrics.users.totalMedicalProviders} Doctors`}
            icon={Stethoscope}
            badgeText="Healthcare Specialists"
            badgeType="neutral"
          />
        </div>
      </SectionCard>

      {/* Global Milk Collection Statistics */}
      <SectionCard title="System-Wide Milk Intake Volume & Valuation" subtitle="Cumulative metrics for all milk collections recorded in the database">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">Total Milk Volume Intake</span>
              <span className="font-mono font-bold text-slate-900 text-2xl mt-1 block">
                {metrics.milk.totalQuantity.toLocaleString('en-IN')} Liters
              </span>
            </div>
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl font-bold text-xl flex items-center justify-center">
              🥛
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Total Cumulative Milk Valuation</span>
              <span className="font-mono font-bold text-slate-900 text-2xl mt-1 block">
                ₹ {metrics.milk.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xl flex items-center justify-center">
              ₹
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Global Settlement & Ledger Statistics */}
      <SectionCard title="System-Wide Financial Settlement Ledger Summary" subtitle="Total gross, disbursed paid, and outstanding remaining balances">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Gross Settlement Volume"
            value={loading ? '...' : `₹ ${metrics.payments.totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            icon={Wallet}
            badgeText={`${metrics.payments.totalPayments} Payment Settlements`}
            badgeType="neutral"
          />
          <StatCard
            title="Total Disbursed Funds"
            value={loading ? '...' : `₹ ${metrics.payments.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            icon={CheckCircle2}
            badgeText="Total Paid Out"
            badgeType="success"
          />
          <StatCard
            title="Total Outstanding Balance"
            value={loading ? '...' : `₹ ${metrics.payments.totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            icon={CreditCard}
            badgeText={metrics.payments.totalOutstanding > 0 ? 'Pending System Settlement' : 'Clear System Balance'}
            badgeType={metrics.payments.totalOutstanding > 0 ? 'amber' : 'success'}
          />
        </div>
      </SectionCard>
    </div>
  );
};
