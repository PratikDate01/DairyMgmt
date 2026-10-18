import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Reusable BackButton component providing consistent backward navigation across workflows.
 *
 * @param {Object} props
 * @param {string} [props.fallback] - Fallback path if direct navigation or no in-app history exists.
 * @param {boolean} [props.forceFallback=false] - When true, always navigates to fallback rather than history(-1).
 * @param {string} [props.label] - Optional custom label. Defaults to localized 'actions.back'.
 * @param {boolean} [props.showLabel=true] - Whether to show the text label alongside the arrow icon.
 * @param {string} [props.variant='default'] - 'default' | 'inverse' | 'subtle'
 * @param {string} [props.className=''] - Additional CSS classes.
 * @param {Function} [props.onClick] - Optional custom click handler.
 * @param {string} [props.ariaLabel] - Accessible name override for screen readers.
 */
export const BackButton = ({
  fallback,
  forceFallback = false,
  label,
  showLabel = true,
  variant = 'default',
  className = '',
  onClick,
  ariaLabel
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation(['common']);
  const { user } = useAuth();

  const getRoleDashboard = () => {
    const role = user?.activeRole || user?.role;
    switch (role) {
      case 'farmer':
        return '/farmer/dashboard';
      case 'dairyOwner':
        return '/dairy-owner/dashboard';
      case 'veterinarian':
        return '/veterinarian/dashboard';
      case 'medicalProvider':
        return '/medical-provider/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/dashboard';
    }
  };

  const targetFallback = fallback || getRoleDashboard();
  const resolvedLabel = label || t('common:actions.back', 'Back');
  const resolvedAriaLabel = ariaLabel || resolvedLabel;

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
      if (e.defaultPrevented) return;
    }

    if (forceFallback) {
      navigate(targetFallback);
      return;
    }

    // In React Router, window.history.state.idx tracks navigation depth within the SPA session
    const hasInAppHistory =
      typeof window !== 'undefined' &&
      window.history?.state &&
      typeof window.history.state.idx === 'number' &&
      window.history.state.idx > 0;

    if (hasInAppHistory) {
      navigate(-1);
    } else {
      navigate(targetFallback);
    }
  };

  const variantClasses = {
    default:
      'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-xs focus:ring-blue-500',
    inverse:
      'bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-sm focus:ring-white/50',
    subtle:
      'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent focus:ring-blue-500'
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={resolvedAriaLabel}
      title={resolvedAriaLabel}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-semibold rounded-xl shrink-0 whitespace-nowrap transition-colors duration-150 focus:outline-hidden focus:ring-2 focus:ring-offset-1 cursor-pointer ${
        variantClasses[variant] || variantClasses.default
      } ${className}`}
    >
      <ArrowLeft className="w-4 h-4 shrink-0" />
      {showLabel && <span>{resolvedLabel}</span>}
    </button>
  );
};
