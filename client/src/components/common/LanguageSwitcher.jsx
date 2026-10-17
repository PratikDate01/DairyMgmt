import { useTranslation } from 'react-i18next';
import { changeAppLanguage } from '../../i18n';
import { Languages } from 'lucide-react';

/**
 * Universal bilingual language switcher component.
 * Allows instant toggle between English ('en') and Marathi ('mr') with local storage persistence.
 *
 * @param {Object} props
 * @param {string} [props.className] - Additional wrapper styling
 * @param {'pill' | 'compact' | 'minimal'} [props.variant='pill'] - Visual style
 */
export const LanguageSwitcher = ({ className = '', variant = 'pill' }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language === 'mr' ? 'mr' : 'en';

  const handleLanguageChange = (lang) => {
    if (lang === currentLang) return;
    changeAppLanguage(lang);
  };

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center space-x-1 ${className}`}>
        <button
          type="button"
          onClick={() => handleLanguageChange(currentLang === 'en' ? 'mr' : 'en')}
          className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-2xs"
          title={currentLang === 'en' ? 'Switch to मराठी' : 'Switch to English'}
          aria-label="Toggle language"
        >
          <Languages className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-bold">{currentLang === 'en' ? 'मराठी' : 'English'}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-lg border border-slate-200 bg-slate-50 text-xs ${className}`}
      role="group"
      aria-label="Language selector"
    >
      <Languages className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1 shrink-0" aria-hidden="true" />
      <button
        type="button"
        onClick={() => handleLanguageChange('en')}
        className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-semibold transition ${
          currentLang === 'en'
            ? 'bg-blue-600 text-white shadow-xs font-bold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
        }`}
        aria-pressed={currentLang === 'en'}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => handleLanguageChange('mr')}
        className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-semibold transition ${
          currentLang === 'mr'
            ? 'bg-blue-600 text-white shadow-xs font-bold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
        }`}
        aria-pressed={currentLang === 'mr'}
      >
        मराठी
      </button>
    </div>
  );
};
