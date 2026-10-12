import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Code2,
  Flame,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Zap,
  Layers,
  Clock,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { progressAPI, integrationAPI } from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonCard, SkeletonChart } from '../../components/common/LoadingSkeleton';
import { WeeklyProgressChart } from '../../components/charts/WeeklyProgressChart';
import { PlatformComparisonDonut } from '../../components/charts/PlatformComparisonDonut';
import { DifficultyBarChart } from '../../components/charts/DifficultyBarChart';
import { ContributionHeatmap } from '../../components/charts/ContributionHeatmap';

export const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [syncError, setSyncError] = useState('');

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const res = await progressAPI.getMyProgress();
      if (res.success) {
        setData(res);
        setLoadError('');
      } else {
        setLoadError(res.message || 'Unable to load your progress right now.');
      }
    } catch (err) {
      setLoadError(err.message || 'Unable to load your progress right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMsg('');
    setSyncError('');
    try {
      const res = await integrationAPI.syncNow();
      if (res.success) {
        setSyncMsg('Progress updated!');
        if (refreshUser) await refreshUser();
        await fetchProgress();
        setTimeout(() => setSyncMsg(''), 4000);
      }
    } catch (err) {
      setSyncError(err.message || 'Sync failed. Check handle connection.');
      setTimeout(() => setSyncError(''), 5000);
    } finally {
      setSyncing(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-44 bg-slate-900 rounded-3xl animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonChart className="lg:col-span-2" />
          <SkeletonChart />
        </div>
      </div>
    );
  }

  if (loadError && !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h2 className="font-semibold">Dashboard unavailable</h2>
            <p className="mt-1 text-sm">{loadError}</p>
            <button
              onClick={fetchProgress}
              className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const today = data?.todayBreakdown || {};
  const recent = data?.recentActivity || [];

  const hasAnyPlatformConnected = user?.leetcodeConnected || user?.gfgConnected;

  return (
    <div className="space-y-6">
      {/* Dark navy greeting banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                {user?.batch || 'General'} Batch
              </span>
              <span className="text-xs text-slate-400">• {user?.branch || 'Computer Science'}</span>
              {user?.college && <span className="text-xs text-slate-400">• {user.college}</span>}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Good morning, {user?.name?.split(' ')[0] || 'Student'} 👋
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl">
              Track your verified daily problem-solving consistency across LeetCode & GeeksforGeeks.
            </p>

            {user?.lastSynced && (
              <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <span>Last synchronized: {new Date(user.lastSynced).toLocaleString()}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : syncMsg || 'Sync Now'}</span>
            </button>
            <Link
              to="/connect-platforms"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <span>Connect Handles</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>

        {syncError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{syncError}</span>
          </div>
        )}
      </div>

      {/* Zero Platforms Warning Banner */}
      {!hasAnyPlatformConnected && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-orange-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 text-orange-600">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">No Coding Handles Connected Yet</h4>
              <p className="text-xs text-orange-700 mt-0.5">
                Connect your verified LeetCode or GeeksforGeeks handle to start syncing live problems and leaderboard rankings.
              </p>
            </div>
          </div>
          <Link
            to="/connect-platforms"
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors"
          >
            Connect Handles Now &rarr;
          </Link>
        </div>
      )}

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Problems Solved"
          value={stats.totalSolved ?? user?.totalSolved ?? 0}
          icon={CheckCircle2}
          color="orange"
          subtext="Verified across active platforms"
          trend={
            <span>
              <strong className="text-orange-600">+{stats.dailySolved ?? 0}</strong> solved today
            </span>
          }
        />

        <StatCard
          title="LeetCode Solved"
          value={user?.leetcodeStats?.totalSolved ?? 0}
          icon={Code2}
          color="amber"
          subtext={user?.leetcodeConnected ? `@${user?.leetcodeUsername}` : 'Not connected'}
          trend={
            <span className="text-[11px]">
              Easy: {user?.leetcodeStats?.easySolved || 0} • Med: {user?.leetcodeStats?.mediumSolved || 0} • Hard: {user?.leetcodeStats?.hardSolved || 0}
            </span>
          }
        />

        <StatCard
          title="GeeksforGeeks Solved"
          value={user?.gfgStats?.totalSolved ?? 0}
          icon={Zap}
          color="emerald"
          subtext={user?.gfgConnected ? `@${user?.gfgUsername}` : 'Not connected'}
          trend={
            <span className="text-[11px]">
              Score: {user?.gfgStats?.codingScore || 0} • Solved: {user?.gfgStats?.totalSolved || 0}
            </span>
          }
        />

        <StatCard
          title="Current Streak"
          value={`${stats.currentStreak ?? user?.currentStreak ?? 0} Days`}
          icon={Flame}
          color="rose"
          subtext={`Longest: ${stats.longestStreak ?? user?.longestStreak ?? 0} days`}
          trend={
            <span className="text-amber-600 font-medium flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              Keep practicing daily!
            </span>
          }
        />
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="text-center sm:text-left sm:pl-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Today</span>
          <div className="text-2xl font-black text-slate-900 mt-0.5">
            {today.total || stats.dailySolved || 0} Solved
          </div>
          <span className="text-[11px] text-slate-500">LC: {today.leetcode || 0} • GFG: {today.gfg || 0}</span>
        </div>

        <div className="text-center sm:text-left sm:border-l sm:border-slate-100 sm:pl-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">This Week</span>
          <div className="text-2xl font-black text-slate-900 mt-0.5">
            {stats.weeklySolved ?? user?.weeklySolved ?? 0} Solved
          </div>
          <span className="text-[11px] text-slate-500">Mon - Sun Window</span>
        </div>

        <div className="text-center sm:text-left sm:border-l sm:border-slate-100 sm:pl-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">This Month</span>
          <div className="text-2xl font-black text-slate-900 mt-0.5">
            {stats.monthlySolved ?? user?.monthlySolved ?? 0} Solved
          </div>
          <span className="text-[11px] text-slate-500">Current calendar month</span>
        </div>

        <div className="text-center sm:text-left sm:border-l sm:border-slate-100 sm:pl-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Last Active</span>
          <div className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5 justify-center sm:justify-start">
            <Clock className="w-3.5 h-3.5 text-orange-500" />
            <span>
              {stats.lastActive
                ? new Date(stats.lastActive).toLocaleDateString()
                : user?.lastActive
                ? new Date(user.lastActive).toLocaleDateString()
                : 'Today'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            {stats.lastActive
              ? new Date(stats.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : ''}
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Progress Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Weekly Progress</h3>
              <p className="text-xs text-slate-500 mt-0.5">Problems solved each day of this week</p>
            </div>
            <span className="text-xs text-orange-600 font-bold bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
              {stats.weeklySolved ?? 0} total this week
            </span>
          </div>
          <WeeklyProgressChart data={charts.weeklyChart} />
        </div>

        {/* Platform Comparison Donut */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Platform Breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5">LeetCode vs GeeksforGeeks</p>
          </div>
          <PlatformComparisonDonut
            leetcode={user?.leetcodeStats?.totalSolved || 0}
            gfg={user?.gfgStats?.totalSolved || 0}
          />
        </div>
      </div>

      {/* Difficulty Breakdown & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Difficulty Bar Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-1">
            Difficulty Distribution
          </h3>
          <p className="text-xs text-slate-500 mb-4">Problem classification across platforms</p>
          <DifficultyBarChart
            easy={user?.leetcodeStats?.easySolved || user?.easySolved || 0}
            medium={user?.leetcodeStats?.mediumSolved || user?.mediumSolved || 0}
            hard={user?.leetcodeStats?.hardSolved || user?.hardSolved || 0}
          />
        </div>

        {/* Contribution Calendar Heatmap */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Contribution Heatmap
            </h3>
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              Practice Matrix
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Visual record of daily practice consistency (Past 90 Days)</p>
          <ContributionHeatmap contributionMap={charts.contributionMap || {}} />
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Recent Activity</h3>
            <p className="text-xs text-slate-500 mt-0.5">Live problem submissions retrieved via data synchronization</p>
          </div>
          <Link to="/progress" className="text-xs font-bold text-orange-600 hover:text-orange-700">
            View All History &rarr;
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="No problem activity recorded yet"
            description="When you solve problems on LeetCode or GeeksforGeeks, click 'Sync Now' or wait for the automatic scheduler to record your submissions."
            actionText={hasAnyPlatformConnected ? 'Sync Progress Now' : 'Connect Coding Handles'}
            onAction={hasAnyPlatformConnected ? handleSync : undefined}
            actionLink={!hasAnyPlatformConnected ? '/connect-platforms' : undefined}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map((item, idx) => (
              <div key={item._id || idx} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.platform === 'LeetCode'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {item.platform}
                  </span>
                  <div>
                    <a
                      href={item.problemUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-slate-900 hover:text-orange-600 transition-colors inline-flex items-center gap-1"
                    >
                      <span>{item.problemName}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`text-[10px] font-semibold ${
                      item.difficulty === 'Easy'
                        ? 'text-emerald-600'
                        : item.difficulty === 'Medium'
                        ? 'text-amber-600'
                        : item.difficulty === 'Hard'
                        ? 'text-rose-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {item.difficulty}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(item.solvedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
