import { useAuth } from '../../context/AuthContext';
import { Menu, LogOut } from 'lucide-react';

export const Header = ({ onMobileMenuToggle }) => {
  const { user, logout } = useAuth();

  // Helper for initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      {/* Left: Mobile Toggle & Page Context */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
          aria-label="Open Mobile Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <span className="text-xs font-semibold text-slate-400 block md:inline mr-2">Authenticated System</span>
          <span className="hidden md:inline text-slate-300">|</span>
          <span className="text-xs font-bold text-blue-600 md:ml-2 capitalize">
            {user?.role || 'Guest'} Portal
          </span>
        </div>
      </div>

      {/* Right: User Profile & Actions */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs flex items-center justify-center">
            {getInitials(user?.name)}
          </div>
          <div className="hidden sm:block text-left">
            <span className="text-xs font-bold text-slate-800 block leading-tight">{user?.name}</span>
            <span className="text-[10px] text-slate-500 font-medium capitalize block">{user?.role}</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 rounded-lg transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
