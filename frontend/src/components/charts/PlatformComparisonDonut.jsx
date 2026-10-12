import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export const PlatformComparisonDonut = ({ leetcode = 0, gfg = 0 }) => {
  const data = [
    { name: 'LeetCode', value: leetcode, color: '#f97316' },
    { name: 'GeeksforGeeks', value: gfg, color: '#10b981' },
  ];

  const total = leetcode + gfg;

  if (total === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
        <span>No platform data available</span>
        <span className="text-xs text-slate-400 mt-1">Connect your profiles to see comparison</span>
      </div>
    );
  }

  const lcPercent = Math.round((leetcode / total) * 100);
  const gfgPercent = 100 - lcPercent;

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full h-52 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '0.75rem',
                color: '#0f172a',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              }}
              formatter={(value, name) => [`${value} problems (${Math.round((value / total) * 100)}%)`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-900">{total}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 mt-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-slate-600 font-medium">LeetCode:</span>
          <span className="text-slate-900 font-bold">{leetcode}</span>
          <span className="text-slate-400 text-[11px]">({lcPercent}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-slate-600 font-medium">GFG:</span>
          <span className="text-slate-900 font-bold">{gfg}</span>
          <span className="text-slate-400 text-[11px]">({gfgPercent}%)</span>
        </div>
      </div>
    </div>
  );
};

export default PlatformComparisonDonut;
