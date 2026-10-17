import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Menu, LogOut, UserCheck, ChevronDown, RefreshCw } from 'lucide-react';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { getRoleLabel } from '../../i18n/statusMap';

export const Header = ({ onMobileMenuToggle }) => {
  const { user, switchRole, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const activeRole = user?.activeRole || user?.role;
  const userRoles = user?.roles && user.roles.length > 0 ? user.roles : [activeRole];
  const hasMultipleRoles = userRoles.length > 1;

  // Helper for initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleRoleSwitch = async (newRole) => {
    if (newRole === activeRole) {
      setDropdownOpen(false);
      return;
    }
    try {
      setSwitching(true);
      await switchRole(newRole);
      setDropdownOpen(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to switch role:', err);
    } finally {
      setSwitching(false);
    }
  };

  const activeRoleName = getRoleLabel(activeRole, t);

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
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline mr-2">{t('authenticatedSystem')}</span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="text-xs font-bold text-blue-600 sm:ml-2">
            {t('portal', { role: activeRoleName || t('guest') })}
          </span>
        </div>
      </div>

      {/* Right: Language Switcher, Multi-Role Switcher & User Profile */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        {/* Bilingual Language Switcher */}
        <LanguageSwitcher />

        {/* Multi-role Switcher Dropdown */}
        {hasMultipleRoles && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              disabled={switching}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
              title={t('switchActiveRole')}
            >
              {switching ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span className="hidden sm:inline">{t('switchRole')}</span>
              <span className="font-bold">{activeRoleName}</span>
              <ChevronDown className="w-3 h-3 text-blue-500" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {t('availableRoles')}
                </div>
                {userRoles.map((r) => {
                  const isCurrent = r === activeRole;
                  const label = getRoleLabel(r, t);
                  return (
                    <button
                      key={r}
                      onClick={() => handleRoleSwitch(r)}
                      disabled={switching}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition ${
                        isCurrent ? 'bg-blue-50/70 font-bold text-blue-700' : 'text-slate-700 font-medium'
                      }`}
                    >
                      <span>{label}</span>
                      {isCurrent && <span className="text-[10px] text-blue-600 font-bold">{t('activeBadge')}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs flex items-center justify-center">
            {getInitials(user?.name)}
          </div>
          <div className="hidden sm:block text-left">
            <span className="text-xs font-bold text-slate-800 block leading-tight">{user?.name}</span>
            <span className="text-[10px] text-slate-500 font-medium capitalize block">{activeRoleName}</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 rounded-lg transition"
          title={t('logout')}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </header>
  );
};
