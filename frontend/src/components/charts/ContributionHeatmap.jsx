import React, { useMemo } from 'react';

export const ContributionHeatmap = ({ contributionMap = {} }) => {
  // Generate past 90 days grid organized by weeks
  const { weeks, totalActiveDays, maxProblemsInDay } = useMemo(() => {
    const days = [];
    const today = new Date();
    let activeCount = 0;
    let maxProblems = 0;

    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const count = contributionMap[dateStr] || 0;
      if (count > 0) activeCount++;
      if (count > maxProblems) maxProblems = count;

      days.push({
        date: dateStr,
        dayOfWeek: d.getDay(),
        count,
      });
    }

    const alignedDays = [
      ...Array(days[0].dayOfWeek).fill(null),
      ...days,
    ];
    while (alignedDays.length % 7 !== 0) alignedDays.push(null);
    const weekGroups = [];
    for (let i = 0; i < alignedDays.length; i += 7) {
      weekGroups.push(alignedDays.slice(i, i + 7));
    }

    return { weeks: weekGroups, totalActiveDays: activeCount, maxProblemsInDay: maxProblems };
  }, [contributionMap]);

  const getColorClass = (count) => {
    if (count === 0) return 'bg-slate-100 border-slate-200';
    if (count <= 2) return 'bg-emerald-200 text-emerald-800 border-emerald-300';
    if (count <= 5) return 'bg-emerald-400 text-emerald-950 border-emerald-500';
    if (count <= 9) return 'bg-emerald-600 text-white border-emerald-700';
    return 'bg-emerald-700 text-white border-emerald-800 shadow-xs';
  };

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="min-w-[600px]">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          <span className="font-medium">Activity Timeline (Past 90 Days)</span>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-slate-100 border border-slate-200"></div>
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-200 border border-emerald-300"></div>
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400 border border-emerald-500"></div>
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-600 border border-emerald-700"></div>
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-700 border border-emerald-800"></div>
            <span>More</span>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex flex-col gap-1.5 text-[9px] leading-none text-slate-400 pt-0.5">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span key={day} className="h-3.5">{day}</span>
            ))}
          </div>
          <div className="flex gap-1.5">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5">
                {week.map((day, dayIdx) => day ? (
                  <div
                    key={day.date}
                    aria-label={`${day.count} solved on ${day.date}`}
                    className={`w-3.5 h-3.5 rounded-sm border transition-all duration-150 hover:scale-125 cursor-pointer relative group ${getColorClass(
                      day.count
                    )}`}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 pointer-events-none whitespace-nowrap bg-slate-900 text-white text-[11px] px-2.5 py-1 rounded-lg shadow-xl border border-slate-800">
                      <span className="font-bold">{day.count} solved</span> on {day.date}
                    </div>
                  </div>
                ) : (
                  <div key={`empty-${wIdx}-${dayIdx}`} className="w-3.5 h-3.5" aria-hidden="true" />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
          <span>{totalActiveDays} active practice days recorded</span>
          <span>Max solved in a day: {maxProblemsInDay}</span>
        </div>
      </div>
    </div>
  );
};

export default ContributionHeatmap;
