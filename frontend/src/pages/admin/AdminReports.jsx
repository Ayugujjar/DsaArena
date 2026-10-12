import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  Award,
  AlertCircle,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { reportAPI, batchAPI } from '../../services/api';

export const AdminReports = () => {
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' or 'monthly'

  // Weekly Matrix State
  const [weeklyData, setWeeklyData] = useState(null);
  const [weekLoading, setWeekLoading] = useState(true);
  const [weeklyBatch, setWeeklyBatch] = useState('All');
  const [weeklySearch, setWeeklySearch] = useState('');

  // Monthly Report State
  const [monthlyData, setMonthlyData] = useState(null);
  const [monthLoading, setMonthLoading] = useState(true);
  const [monthlyBatch, setMonthlyBatch] = useState('All');

  const [batches, setBatches] = useState(['Alpha', 'Beta', 'Gamma']);

  useEffect(() => {
    batchAPI
      .getBatches()
      .then((res) => {
        if (res.success && res.batches.length > 0) {
          setBatches(res.batches.map((b) => b.name));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Weekly
  useEffect(() => {
    const fetchWeekly = async () => {
      try {
        setWeekLoading(true);
        const res = await reportAPI.getWeeklyReport({
          batch: weeklyBatch,
          search: weeklySearch,
        });
        if (res.success) {
          setWeeklyData(res);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setWeekLoading(false);
      }
    };

    fetchWeekly();
  }, [weeklyBatch, weeklySearch]);

  // Fetch Monthly
  useEffect(() => {
    const fetchMonthly = async () => {
      try {
        setMonthLoading(true);
        const res = await reportAPI.getMonthlyReport({
          batch: monthlyBatch,
        });
        if (res.success) {
          setMonthlyData(res);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setMonthLoading(false);
      }
    };

    fetchMonthly();
  }, [monthlyBatch]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-rose-400" />
            <span>Progress Reports & Matrix</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Weekly student-by-day matrices and monthly cohort aggregate performance
          </p>
        </div>

        {/* Tab Switch */}
        <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'weekly' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Weekly Matrix (Mon-Sun)
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'monthly' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly Analytics
          </button>
        </div>
      </div>

      {/* TAB 1: WEEKLY PROGRESS MATRIX */}
      {activeTab === 'weekly' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
              <span className="text-xs text-slate-400 shrink-0 font-medium">Batch:</span>
              <button
                onClick={() => setWeeklyBatch('All')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                  weeklyBatch === 'All' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              {batches.map((b) => (
                <button
                  key={b}
                  onClick={() => setWeeklyBatch(b)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                    weeklyBatch === b ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={weeklySearch}
                onChange={(e) => setWeeklySearch(e.target.value)}
                placeholder="Search student..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Matrix Grid Table */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Weekly Student Progress Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Per-day totals with LeetCode and GFG counts shown separately
                </p>
              </div>
            </div>

            {weekLoading ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : !weeklyData?.matrix?.length ? (
              <div className="py-20 text-center text-xs text-slate-500">
                No students found for this filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs">
                  <thead className="uppercase tracking-wider text-slate-400 border-b border-slate-800 bg-slate-800/40">
                    <tr>
                      <th className="py-3.5 px-4 text-left">Student</th>
                      <th className="py-3.5 px-3">Batch</th>
                      {(weeklyData?.weekDays || []).map((w) => (
                        <th key={w.date} className="py-3.5 px-3">
                          <span className="block font-bold">{w.label}</span>
                          <span className="text-[10px] text-slate-500 font-normal">{w.date.slice(5)}</span>
                        </th>
                      ))}
                      <th className="py-3.5 px-4 text-indigo-400 font-bold">Week Total</th>
                      <th className="py-3.5 px-4 text-slate-300">Overall</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {weeklyData.matrix.map((row) => (
                      <tr key={row.studentId} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-left font-semibold text-white">
                          {row.name}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-indigo-300 border border-slate-700">
                            {row.batch}
                          </span>
                        </td>
                        {row.days.map((day) => (
                          <td key={day.date} className="py-3 px-3">
                            <div
                              title={`${day.solved} total: ${day.leetcode} LeetCode, ${day.gfg} GFG`}
                              className={`mx-auto w-14 rounded-md px-1 py-1 ${
                                day.solved === 0
                                  ? 'text-slate-600 bg-slate-950/40'
                                  : day.solved >= 5
                                  ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30'
                                  : 'text-indigo-300 bg-indigo-500/20 border border-indigo-500/30'
                              }`}
                            >
                              <span className="block font-bold text-xs">{day.solved} total</span>
                              <span className="block whitespace-nowrap text-[9px] leading-3">
                                <span className="text-amber-400">LC {day.leetcode}</span>
                                {' · '}
                                <span className="text-emerald-400">GFG {day.gfg}</span>
                              </span>
                            </div>
                          </td>
                        ))}
                        <td className="py-3 px-4 font-extrabold text-sm text-indigo-400">
                          {row.weeklyTotal}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-300">
                          {row.overallTotal}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY MONITORING ANALYTICS */}
      {activeTab === 'monthly' && (
        <div className="space-y-6">
          {/* Batch Selector */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-slate-400 shrink-0 font-medium">Batch Scope:</span>
            <button
              onClick={() => setMonthlyBatch('All')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                monthlyBatch === 'All' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Batches
            </button>
            {batches.map((b) => (
              <button
                key={b}
                onClick={() => setMonthlyBatch(b)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                  monthlyBatch === b ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Monthly Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Solved</span>
              <div className="text-2xl font-black text-white mt-1">
                {monthlyData?.summary?.totalProblemsSolved || 0}
              </div>
              <span className="text-[10px] text-slate-500">Current calendar month</span>
            </div>

            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Avg / Student</span>
              <div className="text-2xl font-black text-indigo-400 mt-1">
                {monthlyData?.summary?.avgProblemsPerStudent || 0}
              </div>
              <span className="text-[10px] text-slate-500">Across {monthlyData?.summary?.totalStudents || 0} students</span>
            </div>

            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">LeetCode Solved</span>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {monthlyData?.summary?.leetcodeSolved || 0}
              </div>
              <span className="text-[10px] text-slate-500">LeetCode this calendar month</span>
            </div>

            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">GFG Solved</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {monthlyData?.summary?.gfgSolved || 0}
              </div>
              <span className="text-[10px] text-slate-500">GFG this calendar month</span>
            </div>
          </div>

          {/* Monthly Trend Area Chart */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-1">
              Daily Solved by Platform (Past 30 Days)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Each date shows LeetCode and GFG solved counts separately for the selected batch</p>

            <div className="w-full h-64 relative" aria-busy={monthLoading}>
              {monthLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-slate-900/70 text-xs text-slate-400">
                  Updating daily report...
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData?.monthlyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="monthLeetCodeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="monthGfgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => v.slice(5)} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                    formatter={(val, name) => [`${val} solved`, name]}
                  />
                  <Area type="monotone" dataKey="leetcodeSolved" name="LeetCode" stackId="solved" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#monthLeetCodeGrad)" />
                  <Area type="monotone" dataKey="gfgSolved" name="GFG" stackId="solved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#monthGfgGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Most Active & Least Active Students */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Most Active */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                <span>Most Active This Month</span>
              </h3>
              <div className="space-y-2">
                {(monthlyData?.mostActive || []).map((s, idx) => (
                  <div key={s._id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-500 w-4">#{idx + 1}</span>
                      <div>
                        <span className="font-semibold text-white block">{s.name}</span>
                        <span className="text-[10px] text-slate-500">{s.batch} Batch</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400 block">{s.monthlySolved || 0} solved</span>
                      <span className="text-[10px] text-slate-500">{s.totalSolved} overall</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Least Active / Inactive */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Least Active / Zero Solved</span>
              </h3>
              {monthlyData?.leastActive?.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Great! All students have active submissions this month.</p>
              ) : (
                <div className="space-y-2">
                  {(monthlyData?.leastActive || []).map((s) => (
                    <div key={s._id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <div>
                        <span className="font-semibold text-white block">{s.name}</span>
                        <span className="text-[10px] text-slate-500">{s.batch} Batch</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-rose-400 block">0 solved</span>
                        <span className="text-[10px] text-slate-500">Requires follow-up</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
