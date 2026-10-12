import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Activity,
  CheckCircle2,
  Code2,
  Zap,
  RefreshCw,
  FolderKanban,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { adminAPI } from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getDashboard();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSyncAll = async () => {
    setSyncingAll(true);
    setSyncMsg('');
    try {
      const res = await adminAPI.syncAll();
      setSyncMsg(res.message || 'Background sync triggered for all students!');
      setTimeout(() => setSyncMsg(''), 5000);
    } catch (err) {
      setSyncMsg(err.message || 'Failed to trigger batch sync');
    } finally {
      setSyncingAll(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const batchStats = data?.batchStats || [];
  const topPerformers = data?.topPerformers || [];
  const inactiveAlerts = data?.inactiveAlerts || [];
  const weeklyTrend = data?.weeklyTrend || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Bulk Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Organization DSA Analytics</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry and student engagement across all training batches
          </p>
        </div>

        <div className="flex items-center gap-3">
          {syncMsg && (
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              {syncMsg}
            </span>
          )}
          <button
            onClick={handleSyncAll}
            disabled={syncingAll}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
            <span>{syncingAll ? 'Triggering...' : 'Sync All Students'}</span>
          </button>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          title="Total Students"
          value={stats.totalStudents || 0}
          icon={Users}
          color="indigo"
          subtext="Enrolled cohorts"
        />

        <StatCard
          title="Active Today"
          value={stats.activeToday || 0}
          icon={Activity}
          color="emerald"
          subtext="Solved in last 24h"
        />

        <StatCard
          title="Active (7 Days)"
          value={stats.activeThisWeek || 0}
          icon={TrendingUp}
          color="amber"
          subtext="Solved this week"
        />

        <StatCard
          title="Total Problems"
          value={stats.totalProblems || 0}
          icon={CheckCircle2}
          color="blue"
          subtext="LC + GFG Solved"
        />

        <StatCard
          title="LeetCode Solved"
          value={stats.leetcodeProblems || 0}
          icon={Code2}
          color="amber"
          subtext="Verified submissions"
        />

        <StatCard
          title="GFG Solved"
          value={stats.gfgProblems || 0}
          icon={Zap}
          color="emerald"
          subtext="Verified submissions"
        />
      </div>

      {/* Batch Overview Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-rose-400" />
            <span>Batch Performance Overview</span>
          </h2>
          <Link to="/admin/batches" className="text-xs font-semibold text-rose-400 hover:text-rose-300">
            Manage Batches →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {batchStats.map((batch) => (
            <div
              key={batch.name}
              className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 backdrop-blur-sm hover:border-slate-700 transition-all shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-bold text-white">{batch.name} Batch</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {batch.studentCount} Students
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Solved</span>
                  <div className="text-lg font-bold text-white mt-0.5">{batch.totalProblems}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Avg / Student</span>
                  <div className="text-lg font-bold text-indigo-400 mt-0.5">{batch.avgProblems}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-slate-400">Active Today:</span>
                <span className="font-bold text-emerald-400">{batch.activeToday} students</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Trend Chart & Top Solvers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Organization Practice Velocity (7 Days)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Total problems solved daily across all batches</p>
            </div>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="orgTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) => val.slice(5)}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [`${val} problems`, 'Solved Across Organization']}
                />
                <Area type="monotone" dataKey="solved" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#orgTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Solvers */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-1">
              Top Performers
            </h3>
            <p className="text-xs text-slate-500 mb-4">Highest total problems solved</p>

            <div className="space-y-3">
              {topPerformers.map((s, idx) => (
                <div key={s._id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-slate-400 w-4 text-center">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                    <div>
                      <span className="font-semibold text-white block">{s.name}</span>
                      <span className="text-[10px] text-slate-500">{s.batch} Batch</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white block">{s.totalSolved}</span>
                    <span className="text-[10px] text-amber-400 font-semibold">{s.currentStreak}d streak</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/admin/students"
            className="mt-4 pt-3 border-t border-slate-800 text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center justify-between"
          >
            <span>View All Students</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Inactive Student Alerts Table */}
      {inactiveAlerts.length > 0 && (
        <div className="bg-slate-900/80 rounded-2xl border border-rose-500/20 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Inactive Practice Alerts
                </h3>
                <p className="text-xs text-slate-400">
                  Students who have not practiced or solved problems in over 7 days
                </p>
              </div>
            </div>
            <Link to="/admin/students?status=inactive" className="text-xs font-semibold text-rose-400 hover:text-rose-300">
              Filter All Inactive →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="uppercase tracking-wider text-slate-400 border-b border-slate-800 bg-slate-800/40">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Total Solved</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {inactiveAlerts.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">{s.name}</td>
                    <td className="py-3 px-4 text-slate-400">{s.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-indigo-300 border border-slate-700">
                        {s.batch}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{s.totalSolved}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {s.lastActive ? new Date(s.lastActive).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status="inactive" lastActive={s.lastActive} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/admin/students/${s._id}`}
                        className="text-xs font-semibold text-rose-400 hover:text-rose-300"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
