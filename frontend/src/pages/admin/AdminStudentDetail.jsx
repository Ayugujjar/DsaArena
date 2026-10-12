import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Code2,
  Zap,
  Flame,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { adminAPI } from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DifficultyBarChart } from '../../components/charts/DifficultyBarChart';
import { PlatformComparisonDonut } from '../../components/charts/PlatformComparisonDonut';

export const AdminStudentDetail = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [historyTimeline, setHistoryTimeline] = useState([]);
  const [recentProblems, setRecentProblems] = useState([]);
  const [range, setRange] = useState('30'); // '30', '90', '180'
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getStudentDetail(id, { range });
      if (res.success) {
        setStudent(res.student);
        setHistoryTimeline(res.historyTimeline || []);
        setRecentProblems(res.recentProblems || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [id, range]);

  const handleSyncOnDemand = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      await adminAPI.syncStudent(id);
      setSyncMsg('Progress synced successfully!');
      await fetchStudentData();
      setTimeout(() => setSyncMsg(''), 4000);
    } catch (err) {
      setSyncMsg(err.message || 'Sync failed');
      setTimeout(() => setSyncMsg(''), 4000);
    } finally {
      setSyncing(false);
    }
  };

  if (loading && !student) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/students"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">{student?.name}</h1>
              <StatusBadge lastActive={student?.lastActive} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {student?.email} • {student?.batch} Batch • {student?.branch} ({student?.college || 'College'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {syncMsg && (
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              {syncMsg}
            </span>
          )}
          <button
            onClick={handleSyncOnDemand}
            disabled={syncing}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Student Now'}</span>
          </button>
        </div>
      </div>

      {/* Profile Handles & Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Solved"
          value={student?.totalSolved || 0}
          icon={CheckCircle2}
          color="indigo"
          subtext="Verified problem total"
        />

        <StatCard
          title="LeetCode Account"
          value={student?.leetcodeStats?.totalSolved || 0}
          icon={Code2}
          color="amber"
          subtext={student?.leetcodeUsername ? `@${student.leetcodeUsername}` : 'Not connected'}
        />

        <StatCard
          title="GeeksforGeeks Account"
          value={student?.gfgStats?.totalSolved || 0}
          icon={Zap}
          color="emerald"
          subtext={student?.gfgUsername ? `@${student.gfgUsername}` : 'Not connected'}
        />

        <StatCard
          title="Streak Length"
          value={`${student?.currentStreak || 0} Days`}
          icon={Flame}
          color="rose"
          subtext={`Longest record: ${student?.longestStreak || 0} days`}
        />
      </div>

      {/* Activity Timeline Chart with Range Picker (30 Days, 3 Months, 6 Months) */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Daily Solved by Platform
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Each day's recorded LeetCode and GeeksforGeeks solves</p>
          </div>

          {/* Range Picker */}
          <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex items-center gap-1 self-start sm:self-auto">
            {[
              { id: '30', label: 'Last 30 Days' },
              { id: '90', label: 'Last 3 Months' },
              { id: '180', label: 'Last 6 Months' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  range === r.id ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="detailLeetCodeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="detailGfgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
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
                formatter={(val, name) => [`${val} solved`, name]}
              />
              <Area type="monotone" dataKey="leetcodeSolved" name="LeetCode" stackId="solved" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#detailLeetCodeGrad)" />
              <Area type="monotone" dataKey="gfgSolved" name="GeeksforGeeks" stackId="solved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#detailGfgGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Difficulty Breakdown & Platform Donut */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-1">
            Difficulty Distribution
          </h3>
          <p className="text-xs text-slate-500 mb-4">Total problems solved classified by difficulty</p>
          <DifficultyBarChart
            easy={student?.easySolved || 0}
            medium={student?.mediumSolved || 0}
            hard={student?.hardSolved || 0}
          />
        </div>

        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Platform Ratio
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">LeetCode vs GeeksforGeeks</p>
          </div>
          <PlatformComparisonDonut
            leetcode={student?.leetcodeStats?.totalSolved || 0}
            gfg={student?.gfgStats?.totalSolved || 0}
          />
        </div>
      </div>

      {/* Problem Activity History */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-1">
          Recent Problem Submissions
        </h3>
        <p className="text-xs text-slate-500 mb-4">Recent problem activities logged from connected platforms</p>

        {recentProblems.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No submissions recorded yet for this student.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="uppercase tracking-wider text-slate-400 border-b border-slate-800 bg-slate-800/40">
                <tr>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Problem Name</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Solved Date</th>
                  <th className="py-3 px-4 text-right">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentProblems.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.platform === 'LeetCode'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {p.platform}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{p.problemName}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          p.difficulty === 'Easy'
                            ? 'text-emerald-400'
                            : p.difficulty === 'Medium'
                            ? 'text-amber-400'
                            : p.difficulty === 'Hard'
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(p.solvedAt).toLocaleDateString()} {new Date(p.solvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={p.problemUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-medium"
                      >
                        <span>Open Problem</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
