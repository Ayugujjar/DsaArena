import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Code2,
  Trophy,
  Flame,
  BarChart3,
  Layers,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';
import { leaderboardAPI } from '../../services/api';

export const LandingPage = () => {
  const [topStudents, setTopStudents] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState(false);

  useEffect(() => {
    let mounted = true;
    leaderboardAPI
      .getLeaderboard({ limit: 5 })
      .then((res) => {
        if (!mounted) return;
        if (res.success) setTopStudents(res.data || []);
      })
      .catch(() => {
        if (mounted) setLeaderboardError(true);
      })
      .finally(() => {
        if (mounted) setLeaderboardLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight">DsArena</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/about"
              className="text-sm font-medium text-slate-600 hover:text-orange-600 px-3 py-1.5 transition-colors hidden sm:block"
            >
              About
            </Link>
            <Link
              to="/admin/login"
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </Link>
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-orange-600 px-4 py-2 rounded-xl transition-colors"
            >
              Student Login
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 px-6">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-orange-200/70 to-amber-100/60 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold mb-6">
            <Zap className="w-3.5 h-3.5" />
            <span>Automated Multi-Batch DSA Tracking</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight mb-6">
            Monitor, Compete & Excel in <br />
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              LeetCode & GeeksforGeeks
            </span>
          </h1>

          <p className="text-slate-600 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            The all-in-one progress tracking suite for universities, bootcamps, and training batches.
            Reliable platform sync, day-wise activity, live leaderboards, streaks, and attendance monitoring.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2 text-base"
            >
              <span>Register Your Profile</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-orange-50 border border-slate-200 text-slate-700 font-semibold transition-all flex items-center justify-center gap-2 text-base"
            >
              <span>Student Dashboard</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Multi-Batch Architecture</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Organize students into batches like Alpha, Beta, Gamma, or create custom training cohorts with batch-level analytics and leaderboards.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Automated Dual Sync</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Syncs solved totals, difficulty breakdowns, and timestamped accepted problems from public profiles.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Competitive Leaderboards</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Foster healthy competition with global and batch-filtered rankings, weekly sprints, monthly honors, and consecutive day streak awards.
            </p>
          </div>
        </div>
      </section>

      {/* Live Leaderboard Preview */}
      <section className="py-12 px-6 max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-orange-500" />
                <span>Top DSA Solvers</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Live ranking preview across all college batches</p>
            </div>
            <Link to="/login" className="text-xs font-semibold text-orange-600 hover:text-orange-700">
              View Full Leaderboard →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4 text-center">LeetCode</th>
                  <th className="py-3 px-4 text-center">GFG</th>
                  <th className="py-3 px-4 text-center">Total Solved</th>
                  <th className="py-3 px-4 text-center">Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboardLoading ? (
                  <tr>
                    <td className="py-8 px-4 text-center text-slate-500" colSpan={7}>Loading leaderboard...</td>
                  </tr>
                ) : leaderboardError ? (
                  <tr>
                    <td className="py-8 px-4 text-center text-rose-600" colSpan={7}>
                      Leaderboard is temporarily unavailable.
                    </td>
                  </tr>
                ) : topStudents.length === 0 ? (
                  <tr>
                    <td className="py-8 px-4 text-center text-slate-500" colSpan={7}>No students available yet.</td>
                  </tr>
                ) : topStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-orange-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold">
                      {s.rank === 1 ? '🥇 1' : s.rank === 2 ? '🥈 2' : s.rank === 3 ? '🥉 3' : `#${s.rank}`}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{s.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                        {s.batch}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-amber-400 font-semibold">{s.leetcodeSolved}</td>
                    <td className="py-3.5 px-4 text-center text-emerald-400 font-semibold">{s.gfgSolved}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900 text-base">{s.totalSolved}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600">
                        <Flame className="w-3.5 h-3.5 fill-orange-500" />
                        {s.streak}d
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-orange-50/60 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 DsArena. Built for collegiate & training DSA progress monitoring.</p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-orange-600">About Platform</Link>
            <Link to="/admin/login" className="hover:text-rose-400">Admin Login</Link>
            <Link to="/login" className="hover:text-orange-600">Student Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
