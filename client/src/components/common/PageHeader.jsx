export const PageHeader = ({ title, description, breadcrumbs = [], actions }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 mb-6 border-b border-slate-200">
      <div>
        {breadcrumbs.length > 0 && (
          <nav className="flex text-xs text-slate-500 mb-1 space-x-1">
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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>

      {actions && <div className="flex items-center space-x-3">{actions}</div>}
    </div>
  );
};
