import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  Activity
} from 'lucide-react';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Role-based navigation items matching current routes
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
        return [
          { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen sticky top-0 z-20 flex-shrink-0 shadow-xs">
      {/* Brand Section */}
      <div className="h-16 px-6 border-b border-slate-100 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
          🐄
        </div>
        <div>
          <span className="font-bold text-slate-900 text-sm tracking-tight block leading-tight">Gauseva</span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 block">HealthTech</span>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">Active Role</span>
        <div className="flex items-center space-x-2">
          <UserCheck className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-800 capitalize">{user?.role || 'User'}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Main Menu</span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

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
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer User Info & Logout */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-2">
            <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'User'}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.phone}</p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
