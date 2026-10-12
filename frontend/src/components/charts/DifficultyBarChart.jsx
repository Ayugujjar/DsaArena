import React from 'react';

export const DifficultyBarChart = ({ easy = 0, medium = 0, hard = 0 }) => {
  const total = easy + medium + hard;

  const easyPercent = total > 0 ? Math.round((easy / total) * 100) : 0;
  const medPercent = total > 0 ? Math.round((medium / total) * 100) : 0;
  const hardPercent = total > 0 ? Math.max(0, 100 - easyPercent - medPercent) : 0;

  return (
    <div className="w-full space-y-4">
      {/* Progress bar line */}
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
        {easy > 0 && (
          <div
            style={{ width: `${easyPercent}%` }}
            className="bg-emerald-500 h-full transition-all duration-500 hover:opacity-90"
            title={`Easy: ${easy} (${easyPercent}%)`}
          />
        )}
        {medium > 0 && (
          <div
            style={{ width: `${medPercent}%` }}
            className="bg-amber-500 h-full transition-all duration-500 hover:opacity-90"
            title={`Medium: ${medium} (${medPercent}%)`}
          />
        )}
        {hard > 0 && (
          <div
            style={{ width: `${hardPercent}%` }}
            className="bg-rose-500 h-full transition-all duration-500 hover:opacity-90"
            title={`Hard: ${hard} (${hardPercent}%)`}
          />
        )}
      </div>

      {/* Difficulty stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 text-center">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Easy</span>
          <div className="text-xl font-black text-slate-900 mt-0.5">{easy}</div>
          <span className="text-[11px] text-slate-500">{easyPercent}%</span>
        </div>

        <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100 text-center">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Medium</span>
          <div className="text-xl font-black text-slate-900 mt-0.5">{medium}</div>
          <span className="text-[11px] text-slate-500">{medPercent}%</span>
        </div>

        <div className="bg-rose-50/50 p-3 rounded-2xl border border-rose-100 text-center">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Hard</span>
          <div className="text-xl font-black text-slate-900 mt-0.5">{hard}</div>
          <span className="text-[11px] text-slate-500">{hardPercent}%</span>
        </div>
      </div>
    </div>
  );
};

export default DifficultyBarChart;
