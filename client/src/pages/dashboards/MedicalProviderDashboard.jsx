import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { medicineService } from '../../services/medicineService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Stethoscope, Boxes, CheckCircle2, AlertTriangle, Pill } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MedicalProviderDashboard = () => {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState({
    totalMedicines: 0,
    availableMedicines: 0,
    outOfStockMedicines: 0,
    lowStockMedicines: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        if (token) {
          const res = await medicineService.getInventorySummary(token);
          if (res.summary) {
            setSummary(res.summary);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch medical dashboard inventory summary:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadSummary();
  }, [token]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Veterinary Medical Console"
        description={`Welcome, ${user?.name || 'Medical Provider'}. Manage veterinary medicine inventory and fulfill farmer prescription requests.`}
        breadcrumbs={['Home', 'Medical Console']}
        actions={
          <Link
            to="/medical-provider/inventory"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
          >
            <Pill className="w-4 h-4" />
            <span>Manage Inventory</span>
          </Link>
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
          title="Available Products"
          value={loading ? '...' : `${summary.availableMedicines} Items`}
          icon={CheckCircle2}
          badgeText="Ready for Supply"
          badgeType="success"
        />
        <StatCard
          title="Out of Stock"
          value={loading ? '...' : `${summary.outOfStockMedicines} Items`}
          icon={AlertTriangle}
          badgeText={summary.outOfStockMedicines > 0 ? 'Action Required' : 'In Stock'}
          badgeType={summary.outOfStockMedicines > 0 ? 'red' : 'success'}
        />
        <StatCard
          title="Low Stock Warning"
          value={loading ? '...' : `${summary.lowStockMedicines} Items`}
          icon={AlertTriangle}
          badgeText={summary.lowStockMedicines > 0 ? 'Stock ≤ 10' : 'Normal'}
          badgeType={summary.lowStockMedicines > 0 ? 'amber' : 'neutral'}
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

        <SectionCard title="Farmer Medicine Requests (Step 15 Preview)" subtitle="Upcoming order submissions queue">
          <EmptyState
            title="No Active Orders Queue"
            description="Veterinary medicine order submissions requested by farmers will display here in Step 15."
            icon={Stethoscope}
          />
        </SectionCard>
      </div>
    </div>
  );
};
