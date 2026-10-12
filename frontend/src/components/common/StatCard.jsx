import React from 'react';

export const StatCard = ({ title, value, icon: Icon, subtext, color = 'orange', trend }) => {
  const colorMap = {
    orange: {
      bg: 'bg-orange-50 text-orange-600 border-orange-100',
      badge: 'text-orange-600 bg-orange-50',
    },
    indigo: {
      bg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      badge: 'text-indigo-600 bg-indigo-50',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      badge: 'text-emerald-600 bg-emerald-50',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600 border-rose-100',
      badge: 'text-rose-600 bg-rose-50',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
      badge: 'text-amber-600 bg-amber-50',
    },
    blue: {
      bg: 'bg-blue-50 text-blue-600 border-blue-100',
      badge: 'text-blue-600 bg-blue-50',
    },
  };

  const currentTheme = colorMap[color] || colorMap.orange;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
          {title}
        </span>
        {Icon && (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 ${currentTheme.bg}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {value !== undefined && value !== null ? value : 0}
        </div>
        {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500">
          {trend}
        </div>
      )}
    </div>
  );
};

export default StatCard;
