import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getRoleLabel } from '../../i18n/statusMap';
import {
  LayoutDashboard,
  Milk,
  Wallet,
  Users,
  Stethoscope,
  ShieldAlert,
  LogOut,
  UserCheck,
  ChevronRight,
  BarChart3,
  Pill,
  ShoppingBag,
  Scan,
  FileText,
  Activity,
  HeartPulse,
  Store,
  MessageSquare
} from 'lucide-react';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const activeRole = user?.activeRole || user?.role;

  // Role-based navigation items matching current routes
  const getNavItems = () => {
    switch (activeRole) {
      case 'farmer':
        return [
          { label: t('nav.farmerDashboard'), path: '/farmer/dashboard', icon: LayoutDashboard },
          { label: t('nav.fodderMarketplace'), path: '/farmer/fodder-marketplace', icon: Store },
          { label: t('nav.myCattleDirectory'), path: '/farmer/cattle', icon: HeartPulse },
          { label: t('nav.aiDiseaseScanner'), path: '/farmer/ai-scanner', icon: Scan },
          { label: t('nav.diseaseScanHistory'), path: '/farmer/scan-history', icon: FileText },
          { label: t('nav.myVetRequests'), path: '/farmer/vet-requests', icon: Stethoscope },
          { label: t('nav.milkCollections'), path: '/farmer/milk-collections', icon: Milk },
          { label: t('nav.paymentsHistory'), path: '/farmer/payments', icon: Wallet },
          { label: t('nav.reportsAnalytics'), path: '/farmer/reports', icon: BarChart3 },
          { label: t('nav.medicinesCatalog'), path: '/farmer/medicines', icon: Pill },
          { label: t('nav.myMedicineRequests'), path: '/farmer/medicine-requests', icon: ShoppingBag },
          { label: t('nav.dairyConnections'), path: '/farmer/connections', icon: Users },
          { label: t('nav.complaintsSupport'), path: '/complaints', icon: MessageSquare }
        ];
      case 'dairyOwner':
        return [
          { label: t('nav.dairyConsole'), path: '/dairy-owner/dashboard', icon: LayoutDashboard },
          { label: t('nav.milkCollection'), path: '/dairy-owner/milk-collection', icon: Milk },
          { label: t('nav.paymentLedger'), path: '/dairy-owner/payments', icon: Wallet },
          { label: t('nav.reportsAnalytics'), path: '/dairy-owner/reports', icon: BarChart3 },
          { label: t('nav.connectedFarmers'), path: '/dairy-owner/farmers', icon: Users },
          { label: t('nav.complaintsSupport'), path: '/complaints', icon: MessageSquare }
        ];
      case 'medicalProvider':
        return [
          { label: t('nav.medicalConsole'), path: '/medical-provider/dashboard', icon: Stethoscope },
          { label: t('nav.medicalInventory'), path: '/medical-provider/inventory', icon: Pill },
          { label: t('nav.medicineRequests'), path: '/medical-provider/medicine-requests', icon: ShoppingBag },
          { label: t('nav.complaintsSupport'), path: '/complaints', icon: MessageSquare }
        ];
      case 'veterinarian':
        return [
          { label: t('nav.veterinarianConsole'), path: '/veterinarian/dashboard', icon: Stethoscope },
          { label: t('nav.diseaseCasesQueue'), path: '/veterinarian/cases', icon: Activity },
          { label: t('nav.complaintsSupport'), path: '/complaints', icon: MessageSquare }
        ];
      case 'admin':
        return [
          { label: t('nav.adminDashboard'), path: '/admin/dashboard', icon: ShieldAlert },
          { label: t('nav.userDirectory'), path: '/admin/dashboard?tab=users', icon: Users },
          { label: t('nav.verifications'), path: '/admin/dashboard?tab=verifications', icon: UserCheck },
          { label: t('nav.cattleRecords'), path: '/admin/dashboard?tab=cattle', icon: HeartPulse },
          { label: t('nav.veterinaryRequests'), path: '/admin/dashboard?tab=vet-requests', icon: Activity },
          { label: t('nav.medicinesCatalog'), path: '/admin/dashboard?tab=medicines', icon: Pill },
          { label: t('nav.fodderListings'), path: '/admin/dashboard?tab=fodder', icon: Store },
          { label: t('nav.complaints'), path: '/admin/dashboard?tab=complaints', icon: ShieldAlert },
          { label: t('nav.systemReports'), path: '/admin/reports', icon: BarChart3 },
          { label: t('nav.veterinarianQueue'), path: '/veterinarian/cases', icon: Activity },
          { label: t('nav.medicalInventory'), path: '/medical-provider/inventory', icon: Pill },
          { label: t('nav.milkCollectionEntry'), path: '/dairy-owner/milk-collection', icon: Milk },
          { label: t('nav.dairyPaymentsLedger'), path: '/dairy-owner/payments', icon: Wallet }
        ];
      default:
        return [
          { label: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard }
        ];
    }
  };

  const navItems = getNavItems();
  const activeRoleName = getRoleLabel(activeRole, t);

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen sticky top-0 z-20 flex-shrink-0 shadow-xs">
      {/* Brand Section */}
      <div className="h-16 px-6 border-b border-slate-100 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
          🐄
        </div>
        <div>
          <span className="font-bold text-slate-900 text-sm tracking-tight block leading-tight">{t('appName')}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 block">{t('appSubtitle')}</span>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">{t('activeRole')}</span>
        <div className="flex items-center space-x-2">
          <UserCheck className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-800">{activeRoleName || t('user')}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">{t('mainMenu')}</span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const currentPathWithSearch = location.pathname + location.search;
          const isActive = currentPathWithSearch === item.path || (location.pathname === item.path && !item.path.includes('?'));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer User Info & Logout */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-2">
            <p className="text-xs font-bold text-slate-800 truncate">{user?.name || t('user')}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.phone}</p>
          </div>
          <button
            onClick={logout}
            title={t('logout')}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
