export const StatCard = ({ title, value = "No data available yet", icon: Icon, badgeText, badgeType = "neutral" }) => {
  const badgeColorMap = {
    neutral: "bg-slate-100 text-slate-600 border-slate-200",
    success: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200"
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
          <div className="mt-2 text-xl font-bold text-slate-800">{value}</div>
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {badgeText && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${badgeColorMap[badgeType] || badgeColorMap.neutral}`}>
            {badgeText}
          </span>
        </div>
      )}
    </div>
  );
};
