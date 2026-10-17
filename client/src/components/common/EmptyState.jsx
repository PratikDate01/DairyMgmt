import { useTranslation } from 'react-i18next';

export const EmptyState = ({ title, description, icon: Icon, badge }) => {
  const { t } = useTranslation();
  return (
    <div className="py-10 px-4 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mb-3 shadow-2xs">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h4 className="text-sm font-semibold text-slate-800">{title || t('empty.noData', 'No Data Available')}</h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1">
        {description || t('empty.placeholderDesc', 'No records match the current filter or criteria.')}
      </p>
      {badge && (
        <span className="mt-3 text-[11px] font-mono px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
          {badge}
        </span>
      )}
    </div>
  );
};
