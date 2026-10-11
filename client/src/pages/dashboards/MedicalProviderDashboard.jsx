import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { medicineService } from '../../services/medicineService';
import { getProviderRequestsSummary } from '../../services/medicineRequestService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Stethoscope, Boxes, CheckCircle2, AlertTriangle, Pill, ShoppingBag, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MedicalProviderDashboard = () => {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState({
    totalMedicines: 0,
    availableMedicines: 0,
    outOfStockMedicines: 0,
    lowStockMedicines: 0
  });
  const [requestsSummary, setRequestsSummary] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    packed: 0,
    ready: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        if (token) {
          const [invRes, reqRes] = await Promise.all([
            medicineService.getInventorySummary(token).catch(() => ({ summary: null })),
            getProviderRequestsSummary(token).catch(() => ({ summary: null }))
          ]);
          if (invRes.summary) {
            setSummary(invRes.summary);
          }
          if (reqRes.summary) {
            setRequestsSummary(reqRes.summary);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch medical dashboard data:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [token]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Veterinary Medical Console"
        description={`Welcome, ${user?.name || 'Medical Store'}. Manage veterinary medicine inventory and fulfill farmer prescription requests.`}
        breadcrumbs={['Home', 'Medical Console']}
        actions={
          <div className="flex items-center space-x-2">
            <Link
              to="/medical-provider/medicine-requests"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Orders Queue ({requestsSummary.pending})</span>
            </Link>
            <Link
              to="/medical-provider/inventory"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <Pill className="w-4 h-4" />
              <span>Manage Inventory</span>
            </Link>
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Medicine Catalog"
          value={loading ? '...' : `${summary.totalMedicines} Items`}
          icon={Boxes}
          badgeText={summary.totalMedicines > 0 ? 'Catalog Active' : 'No Items Added'}
          badgeType={summary.totalMedicines > 0 ? 'success' : 'neutral'}
        />
        <StatCard
          title="Pending Prescription Orders"
          value={loading ? '...' : `${requestsSummary.pending} Orders`}
          icon={ShoppingBag}
          badgeText={requestsSummary.pending > 0 ? 'Awaiting Action' : 'All Orders Processed'}
          badgeType={requestsSummary.pending > 0 ? 'amber' : 'success'}
        />
        <StatCard
          title="Out of Stock"
          value={loading ? '...' : `${summary.outOfStockMedicines} Items`}
          icon={AlertTriangle}
          badgeText={summary.outOfStockMedicines > 0 ? 'Action Required' : 'In Stock'}
          badgeType={summary.outOfStockMedicines > 0 ? 'red' : 'success'}
        />
        <StatCard
          title="Completed Orders"
          value={loading ? '...' : `${requestsSummary.completed} Fulfilled`}
          icon={CheckCircle2}
          badgeText="Total Disbursed"
          badgeType="success"
        />
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="Medicine Inventory Management"
          subtitle="Catalog control, stock quantity adjustments, and product availability"
          action={
            <Link to="/medical-provider/inventory" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
              Open Inventory Console →
            </Link>
          }
        >
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600 font-semibold">Total Inventory Items</span>
              <span className="font-mono font-bold text-slate-900">{summary.totalMedicines} Products</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-emerald-700 font-semibold">Available Catalog Items</span>
              <span className="font-mono font-bold text-emerald-700">{summary.availableMedicines} Products</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-amber-800 font-semibold">Low Stock Warnings (≤ 10)</span>
              <span className="font-mono font-bold text-amber-800">{summary.lowStockMedicines} Products</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-red-700 font-semibold">Out of Stock Items</span>
              <span className="font-mono font-bold text-red-700">{summary.outOfStockMedicines} Products</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Prescription Fulfillment Orders Queue"
          subtitle="Farmer medicine requests generated from veterinary prescriptions"
          action={
            <Link to="/medical-provider/medicine-requests" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
              Fulfill Orders →
            </Link>
          }
        >
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-amber-700 font-semibold">Pending Review</span>
              <span className="font-mono font-bold text-amber-800">{requestsSummary.pending} Requests</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-blue-700 font-semibold">Accepted / In Packing</span>
              <span className="font-mono font-bold text-blue-800">{(requestsSummary.accepted || 0) + (requestsSummary.packed || 0)} Requests</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-teal-700 font-semibold">Ready for Pickup</span>
              <span className="font-mono font-bold text-teal-800">{requestsSummary.ready || 0} Requests</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-emerald-700 font-semibold">Completed Orders</span>
              <span className="font-mono font-bold text-emerald-800">{requestsSummary.completed || 0} Orders</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};
