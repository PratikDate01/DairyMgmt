import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getRoleLabel } from '../../i18n/statusMap';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import {
  X,
  LayoutDashboard,
  Milk,
  Wallet,
  Users,
  Stethoscope,
  ShieldAlert,
  LogOut,
  UserCheck,
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

export const MobileNavigation = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (!isOpen) return null;

  const activeRole = user?.activeRole || user?.role;

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
        return [{ label: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard }];
    }
  };

  const navItems = getNavItems();
  const activeRoleName = getRoleLabel(activeRole, t);

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-4/5 max-w-xs bg-white h-full shadow-xl flex flex-col z-10">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🐄</span>
            <span className="font-bold text-slate-900 text-sm">{t('appName')} {t('appSubtitle')}</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info & Mobile Language Switcher */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-800">{user?.name || t('user')}</p>
            <div className="flex items-center space-x-1 mt-0.5">
              <UserCheck className="w-3 h-3 text-blue-600" />
              <span className="text-[11px] font-semibold text-blue-700">{activeRoleName}</span>
            </div>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const currentPathWithSearch = location.pathname + location.search;
            const isActive = currentPathWithSearch === item.path || (location.pathname === item.path && !item.path.includes('?'));

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold rounded-lg border border-red-200 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
