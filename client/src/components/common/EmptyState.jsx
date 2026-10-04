export const EmptyState = ({ title, description, icon: Icon }) => {
  return (
    <div className="py-12 px-4 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h4 className="text-sm font-semibold text-slate-700">{title || "No data available yet"}</h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-3">
        {description || "This module placeholder will display live data once backend services are enabled."}
      </p>
      <span className="text-[11px] font-mono px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
        Module Pending
      </span>
    </div>
  );
};
