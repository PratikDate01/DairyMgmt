import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['medicalProvider', 'common']);
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
        title={t('medicalProvider:dashboard.title', 'Veterinary Medical Console')}
        description={t('medicalProvider:dashboard.subtitle', { name: user?.name || 'Medical Store', defaultValue: `Welcome, ${user?.name || 'Medical Store'}. Manage veterinary medicine inventory and fulfill farmer prescription requests.` })}
        breadcrumbs={[t('common:nav.home', 'Home'), t('medicalProvider:dashboard.title', 'Medical Console')]}
        actions={
          <div className="flex items-center space-x-2">
            <Link
              to="/medical-provider/medicine-requests"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t('medicalProvider:dashboard.ordersQueue', { count: requestsSummary.pending, defaultValue: `Orders Queue (${requestsSummary.pending})` })}</span>
            </Link>
            <Link
              to="/medical-provider/inventory"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <Pill className="w-4 h-4" />
              <span>{t('medicalProvider:dashboard.manageInventory', 'Manage Inventory')}</span>
            </Link>
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('medicalProvider:dashboard.medicineCatalog', 'Medicine Catalog')}
          value={loading ? '...' : `${summary.totalMedicines} Items`}
          icon={Boxes}
          badgeText={summary.totalMedicines > 0 ? t('common:status.active', 'Catalog Active') : t('common:status.empty', 'No Items Added')}
          badgeType={summary.totalMedicines > 0 ? 'success' : 'neutral'}
        />
        <StatCard
          title={t('medicalProvider:dashboard.pendingOrders', 'Pending Prescription Orders')}
          value={loading ? '...' : `${requestsSummary.pending} Orders`}
          icon={ShoppingBag}
          badgeText={requestsSummary.pending > 0 ? t('common:status.pending', 'Awaiting Action') : t('common:status.completed', 'All Orders Processed')}
          badgeType={requestsSummary.pending > 0 ? 'amber' : 'success'}
        />
        <StatCard
          title={t('medicalProvider:dashboard.outOfStock', 'Out of Stock')}
          value={loading ? '...' : `${summary.outOfStockMedicines} Items`}
          icon={AlertTriangle}
          badgeText={summary.outOfStockMedicines > 0 ? t('common:actions.filter', 'Action Required') : t('common:status.active', 'In Stock')}
          badgeType={summary.outOfStockMedicines > 0 ? 'red' : 'success'}
        />
        <StatCard
          title={t('medicalProvider:dashboard.completedOrders', 'Completed Orders')}
          value={loading ? '...' : `${requestsSummary.completed} Fulfilled`}
          icon={CheckCircle2}
          badgeText={t('common:status.completed', 'Total Disbursed')}
          badgeType="success"
        />
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title={t('medicalProvider:dashboard.inventorySection', 'Medicine Inventory Management')}
          subtitle={t('medicalProvider:dashboard.inventorySubtitle', 'Catalog control, stock quantity adjustments, and product availability')}
          action={
            <Link to="/medical-provider/inventory" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
              {t('medicalProvider:dashboard.openInventory', 'Open Inventory Console →')}
            </Link>
          }
        >
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600 font-semibold">{t('medicalProvider:dashboard.totalInventory', 'Total Inventory Items')}</span>
              <span className="font-mono font-bold text-slate-900">{summary.totalMedicines} Products</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-emerald-700 font-semibold">{t('medicalProvider:dashboard.availableCatalog', 'Available Catalog Items')}</span>
              <span className="font-mono font-bold text-emerald-700">{summary.availableMedicines} Products</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-amber-800 font-semibold">{t('medicalProvider:dashboard.lowStockWarning', 'Low Stock Warnings (≤ 10)')}</span>
              <span className="font-mono font-bold text-amber-800">{summary.lowStockMedicines} Products</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-red-700 font-semibold">{t('medicalProvider:dashboard.outOfStockItems', 'Out of Stock Items')}</span>
              <span className="font-mono font-bold text-red-700">{summary.outOfStockMedicines} Products</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={t('medicalProvider:dashboard.ordersSection', 'Prescription Fulfillment Orders Queue')}
          subtitle={t('medicalProvider:dashboard.ordersSubtitle', 'Farmer medicine requests generated from veterinary prescriptions')}
          action={
            <Link to="/medical-provider/medicine-requests" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
              {t('medicalProvider:dashboard.fulfillOrders', 'Fulfill Orders →')}
            </Link>
          }
        >
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-amber-700 font-semibold">{t('medicalProvider:dashboard.pendingReview', 'Pending Review')}</span>
              <span className="font-mono font-bold text-amber-800">{requestsSummary.pending} Requests</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-blue-700 font-semibold">{t('medicalProvider:dashboard.acceptedPacking', 'Accepted / In Packing')}</span>
              <span className="font-mono font-bold text-blue-800">{(requestsSummary.accepted || 0) + (requestsSummary.packed || 0)} Requests</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-teal-700 font-semibold">{t('medicalProvider:dashboard.readyForPickup', 'Ready for Pickup')}</span>
              <span className="font-mono font-bold text-teal-800">{requestsSummary.ready || 0} Requests</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-emerald-700 font-semibold">{t('medicalProvider:dashboard.completedCount', 'Completed Orders')}</span>
              <span className="font-mono font-bold text-emerald-800">{requestsSummary.completed || 0} Orders</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};
