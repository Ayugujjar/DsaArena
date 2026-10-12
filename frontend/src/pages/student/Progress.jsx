import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ExternalLink, Filter, ChevronLeft, ChevronRight, Layers, TrendingUp, Calendar } from 'lucide-react';
import { progressAPI } from '../../services/api';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonChart, SkeletonTable } from '../../components/common/LoadingSkeleton';

export const Progress = () => {
  const [data, setData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    progressAPI.getMyProgress().then((res) => {
      if (res.success) setData(res);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchActivities(page, platformFilter);
  }, [page, platformFilter]);

  const fetchActivities = async (pg, plat) => {
    try {
      const res = await progressAPI.getActivityHistory({ page: pg, limit: 10, platform: plat });
      if (res.success) {
        setActivities(res.activities);
        setTotalPages(res.pages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <SkeletonChart />
        <SkeletonTable rows={5} cols={4} />
      </div>
    );
  }

  const monthlyChart = data?.charts?.monthlyChart || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Progress & Activity Log</h1>
        <p className="text-xs text-slate-500 mt-1">Detailed historical analysis of problem-solving velocity</p>
      </div>

      {/* 30-Day Solved Curve */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              30-Day Activity Velocity
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Problems solved per day over the past month</p>
          </div>
          <span className="text-xs text-orange-600 font-bold bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
            {data?.stats?.monthlySolved || 0} Solved this month
          </span>
        </div>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(val) => (val ? val.slice(5) : '')}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '0.75rem',
                  color: '#0f172a',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                }}
                formatter={(val) => [`${val} problems`, 'Solved']}
              />
              <Area
                type="monotone"
                dataKey="solved"
                stroke="#f97316"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#progressGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Submissions History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Chronological record of verified problems solved</p>
          </div>

          {/* Platform Filters */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {['All', 'LeetCode', 'GeeksforGeeks'].map((plat) => (
              <button
                key={plat}
                onClick={() => {
                  setPlatformFilter(plat);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  platformFilter === plat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {plat}
              </button>
            ))}
          </div>
        </div>

        {activities.length === 0 ? (
          <EmptyState
            title="No problem activities found"
            description="When problems are solved and synchronized, each unique problem is recorded with its platform and difficulty level."
            icon={Calendar}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/70">
                <tr>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Problem Name</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4 text-right">Solved On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.map((act) => (
                  <tr key={act._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          act.platform === 'LeetCode'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {act.platform}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {act.problemUrl ? (
                        <a
                          href={act.problemUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-orange-600 transition-colors inline-flex items-center gap-1.5"
                        >
                          <span>{act.problemName}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      ) : (
                        act.problemName
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[11px] font-semibold ${
                          act.difficulty === 'Easy'
                            ? 'text-emerald-600'
                            : act.difficulty === 'Medium'
                            ? 'text-amber-600'
                            : act.difficulty === 'Hard'
                            ? 'text-rose-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {act.difficulty || 'Unspecified'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {new Date(act.solvedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Progress;
