import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  Activity
} from 'lucide-react';

export const MobileNavigation = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!isOpen) return null;

  const getNavItems = () => {
    switch (user?.role) {
      case 'farmer':
        return [
          { label: 'Farmer Dashboard', path: '/farmer/dashboard', icon: LayoutDashboard },
          { label: 'AI Disease Scanner', path: '/farmer/ai-scanner', icon: Scan },
          { label: 'Disease Scan History', path: '/farmer/scan-history', icon: FileText },
          { label: 'Milk Collections', path: '/farmer/milk-collections', icon: Milk },
          { label: 'Payments History', path: '/farmer/payments', icon: Wallet },
          { label: 'Reports & Analytics', path: '/farmer/reports', icon: BarChart3 },
          { label: 'Medicines Catalog', path: '/farmer/medicines', icon: Pill },
          { label: 'My Medicine Requests', path: '/farmer/medicine-requests', icon: ShoppingBag },
          { label: 'Dairy Connections', path: '/farmer/connections', icon: Users }
        ];
      case 'dairyOwner':
        return [
          { label: 'Dairy Console', path: '/dairy-owner/dashboard', icon: LayoutDashboard },
          { label: 'Milk Collection', path: '/dairy-owner/milk-collection', icon: Milk },
          { label: 'Payment Ledger', path: '/dairy-owner/payments', icon: Wallet },
          { label: 'Reports & Analytics', path: '/dairy-owner/reports', icon: BarChart3 },
          { label: 'Connected Farmers', path: '/dairy-owner/farmers', icon: Users }
        ];
      case 'medicalProvider':
        return [
          { label: 'Medical Console', path: '/medical-provider/dashboard', icon: Stethoscope },
          { label: 'Medical Inventory', path: '/medical-provider/inventory', icon: Pill },
          { label: 'Medicine Requests', path: '/medical-provider/medicine-requests', icon: ShoppingBag }
        ];
      case 'veterinarian':
        return [
          { label: 'Veterinarian Console', path: '/veterinarian/dashboard', icon: Stethoscope },
          { label: 'Disease Cases Queue', path: '/veterinarian/cases', icon: Activity }
        ];
      case 'admin':
        return [
          { label: 'Admin Dashboard', path: '/admin/dashboard', icon: ShieldAlert },
          { label: 'System Reports', path: '/admin/reports', icon: BarChart3 },
          { label: 'Veterinarian Queue', path: '/veterinarian/cases', icon: Activity },
          { label: 'Medical Inventory', path: '/medical-provider/inventory', icon: Pill },
          { label: 'Medicine Requests', path: '/medical-provider/medicine-requests', icon: ShoppingBag },
          { label: 'Farmer Medicines Catalog', path: '/farmer/medicines', icon: Pill },
          { label: 'Farmer AI Scanner', path: '/farmer/ai-scanner', icon: Scan },
          { label: 'Milk Collection Entry', path: '/dairy-owner/milk-collection', icon: Milk },
          { label: 'Dairy Payments Ledger', path: '/dairy-owner/payments', icon: Wallet },
          { label: 'Connected Farmers', path: '/dairy-owner/farmers', icon: Users }
        ];
      default:
        return [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }];
    }
  };

  const navItems = getNavItems();

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
            <span className="font-bold text-slate-900 text-sm">Gauseva HealthTech</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-800">{user?.name}</p>
          <div className="flex items-center space-x-1 mt-0.5">
            <UserCheck className="w-3 h-3 text-blue-600" />
            <span className="text-[11px] font-semibold text-blue-700 capitalize">{user?.role}</span>
          </div>
        </div>

        {/* Links */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

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
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
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
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
