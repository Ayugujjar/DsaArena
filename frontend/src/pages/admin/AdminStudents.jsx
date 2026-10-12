import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, Eye, RefreshCw, Flame } from 'lucide-react';
import { adminAPI, batchAPI } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';

export const AdminStudents = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState(['Alpha', 'Beta', 'Gamma']);
  const [batchFilter, setBatchFilter] = useState(searchParams.get('batch') || 'All');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('totalSolved');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchStudents();
  }, [batchFilter, statusFilter, search, sortBy, page]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {
        batch: batchFilter,
        search,
        sortBy,
        order: 'desc',
        page,
        limit: 15,
      };
      if (statusFilter !== 'All') {
        params.status = statusFilter;
      }

      const res = await adminAPI.getStudents(params);
      if (res.success) {
        setStudents(res.students);
        setTotalPages(res.pages);
        setTotalStudents(res.total);
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Student Directory & Attendance</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse, filter, and inspect student DSA consistency across batches
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          {totalStudents} Students Enrolled
        </span>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, handle, college..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-xs text-slate-400 font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="totalSolved">Total Solved</option>
              <option value="dailySolved">Daily Solved</option>
              <option value="weeklySolved">Weekly Solved</option>
              <option value="monthlySolved">Monthly Solved</option>
              <option value="currentStreak">Streak Length</option>
              <option value="lastActive">Recent Activity</option>
            </select>
          </div>
        </div>

        {/* Filter Pills (Batch & Status) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
          {/* Batch Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-400 font-medium mr-1">Batch:</span>
            <button
              onClick={() => {
                setBatchFilter('All');
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                batchFilter === 'All' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            {batches.map((b) => (
              <button
                key={b}
                onClick={() => {
                  setBatchFilter(b);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                  batchFilter === b ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Activity Status Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium mr-1">Status:</span>
            {[
              { id: 'All', label: 'All' },
              { id: 'active_today', label: 'Active Today', color: 'emerald' },
              { id: 'active_week', label: 'Active 7d', color: 'amber' },
              { id: 'inactive', label: 'Inactive', color: 'rose' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setStatusFilter(st.id);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === st.id
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-sm">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : students.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500">
            No students match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="uppercase tracking-wider text-slate-400 border-b border-slate-800 bg-slate-800/40">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Batch</th>
                  <th className="py-3.5 px-4 text-center">LeetCode</th>
                  <th className="py-3.5 px-4 text-center">GFG</th>
                  <th className="py-3.5 px-4 text-center">Today</th>
                  <th className="py-3.5 px-4 text-center">This Week</th>
                  <th className="py-3.5 px-4 text-center">This Month</th>
                  <th className="py-3.5 px-4 text-center">Total Solved</th>
                  <th className="py-3.5 px-4 text-center">Streak</th>
                  <th className="py-3.5 px-4">Last Active</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-semibold text-white block">{s.name}</span>
                        <span className="text-[10px] text-slate-500">{s.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-indigo-300 border border-slate-700">
                        {s.batch}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-amber-400 font-semibold">
                      {s.leetcodeStats?.totalSolved || 0}
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-semibold">
                      {s.gfgStats?.totalSolved || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-white">
                      {s.dailySolved || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-300">
                      {s.weeklySolved || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-300">
                      {s.monthlySolved || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-white text-sm">
                      {s.totalSolved || 0}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-400 text-[11px]">
                        <Flame className="w-3 h-3 fill-amber-400" />
                        {s.currentStreak || 0}d
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {s.lastActive ? new Date(s.lastActive).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={s.activityStatus} lastActive={s.lastActive} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/admin/students/${s._id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-800 text-xs text-slate-400">
            <span>
              Page {page} of {totalPages} ({totalStudents} total records)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
