import React, { useState, useEffect } from 'react';
import { Trophy, Search, Flame, Layers, Filter } from 'lucide-react';
import { leaderboardAPI, batchAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonTable } from '../../components/common/LoadingSkeleton';

export const Leaderboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [timeframe, setTimeframe] = useState('overall'); // 'overall', 'monthly', 'weekly'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    batchAPI
      .getBatches()
      .then((res) => {
        if (res.success && res.batches.length > 0) {
          setBatches(res.batches.map((b) => b.name));
        } else {
          setBatches(['Alpha', 'Beta', 'Gamma']);
        }
      })
      .catch(() => {
        setBatches(['Alpha', 'Beta', 'Gamma']);
      });
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedBatch, timeframe, search]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await leaderboardAPI.getLeaderboard({
        batch: selectedBatch,
        timeframe,
        search,
      });
      if (res.success) {
        setStudents(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-orange-500" />
            <span>Leaderboard</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Compare verified problem-solving rankings across batches and colleges
          </p>
        </div>

        {/* Timeframe switch */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 self-start sm:self-auto border border-slate-200">
          {[
            { id: 'overall', label: 'Overall' },
            { id: 'monthly', label: 'Monthly' },
            { id: 'weekly', label: 'Weekly' },
          ].map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeframe === tf.id
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Batch Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-500 shrink-0 font-medium">Batch:</span>
          <button
            onClick={() => setSelectedBatch('All')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
              selectedBatch === 'All'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            All Batches
          </button>
          {batches.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBatch(b)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                selectedBatch === b
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        {loading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : students.length === 0 ? (
          <EmptyState
            title="No leaderboard rankings found"
            description="There are currently 0 active students matching your selected criteria. As soon as students solve problems, their ranks will populate dynamically."
            icon={Trophy}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/70">
                <tr>
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Batch</th>
                  <th className="py-3.5 px-4 text-center">LeetCode</th>
                  <th className="py-3.5 px-4 text-center">GFG</th>
                  <th className="py-3.5 px-4 text-center">Total Solved</th>
                  <th className="py-3.5 px-4 text-center">Weekly</th>
                  <th className="py-3.5 px-4 text-center">Monthly</th>
                  <th className="py-3.5 px-4 text-center">Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => {
                  const isCurrentUser = user && s.id === user._id;

                  return (
                    <tr
                      key={s.id}
                      className={`transition-colors ${
                        isCurrentUser
                          ? 'bg-orange-50/50 border-l-4 border-l-orange-500'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold">
                        {s.rank === 1 ? (
                          <span className="text-base" title="1st Place">🥇 1</span>
                        ) : s.rank === 2 ? (
                          <span className="text-base" title="2nd Place">🥈 2</span>
                        ) : s.rank === 3 ? (
                          <span className="text-base" title="3rd Place">🥉 3</span>
                        ) : (
                          <span className="text-slate-500">#{s.rank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{s.name}</span>
                              {isCurrentUser && (
                                <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-1.5 py-0.2 rounded border border-orange-200">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {s.branch || 'CSE'} • {s.college || 'Institute'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {s.batch}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-amber-600 font-bold">
                        {s.leetcodeSolved}
                      </td>
                      <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">
                        {s.gfgSolved}
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-slate-900 text-sm">
                        {s.totalSolved}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-600">
                        {s.weeklySolved}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-600">
                        {s.monthlySolved}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 text-[11px]">
                          <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {s.streak}d
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
