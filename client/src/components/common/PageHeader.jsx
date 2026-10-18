import { BackButton } from './BackButton';

export const PageHeader = ({
  title,
  description,
  breadcrumbs = [],
  actions,
  showBack = false,
  backFallback,
  onBack,
  forceFallback = false,
  backLabel
}) => {
  const shouldRenderBack = showBack || !!backFallback;

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 mb-6 border-b border-slate-200">
      <div>
        {breadcrumbs.length > 0 && (
          <nav className="flex text-xs text-slate-500 mb-1.5 space-x-1">
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center">
                {idx > 0 && <span className="mx-1 text-slate-400">/</span>}
                <span className={idx === breadcrumbs.length - 1 ? 'font-medium text-slate-700' : ''}>
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-3">
          {shouldRenderBack && (
            <BackButton
              fallback={backFallback}
              forceFallback={forceFallback}
              onClick={onBack}
              label={backLabel}
            />
          )}
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        </div>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>

      {actions && <div className="flex items-center space-x-3">{actions}</div>}
    </div>
  );
};
