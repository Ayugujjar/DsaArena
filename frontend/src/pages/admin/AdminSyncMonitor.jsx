import React, { useEffect, useState } from 'react';
import { AlertCircle, Clock3, RefreshCw, Search } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAdminAuth } from '../../context/AdminAuthContext';

const formatDate = (value) => (value ? new Date(value).toLocaleString() : 'Never');

export const AdminSyncMonitor = () => {
  const { isAdminOrAbove } = useAdminAuth();
  const [filters, setFilters] = useState({ search: '', platform: 'All', status: 'All' });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retryingKey, setRetryingKey] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    adminAPI
      .getSyncMonitor({
        ...filters,
        search: filters.search.trim() || undefined,
        status: filters.status === 'All' ? undefined : filters.status,
        platform: filters.platform === 'All' ? undefined : filters.platform,
      })
      .then((response) => {
        if (mounted && response.success) {
          setRecords(response.records || []);
          setError('');
        }
      })
      .catch((requestError) => {
        if (mounted) setError(requestError.message || 'Unable to load sync records.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [filters, reloadKey]);

  const retrySync = async (record) => {
    const platform = record.platform === 'LeetCode' ? 'leetcode' : 'gfg';
    const key = `${record.studentId}-${platform}`;
    setRetryingKey(key);
    setError('');
    setNotice('');
    try {
      const response = await adminAPI.syncStudent(record.studentId, platform);
      if (!response.success) throw new Error(response.message || 'Synchronization failed.');
      setNotice(`${record.name}'s ${record.platform} data was synchronized.`);
      setLoading(true);
      setReloadKey((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message || 'Unable to retry synchronization.');
    } finally {
      setRetryingKey('');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sync Monitor</h1>
        <p className="mt-1 text-sm text-slate-500">Review real platform sync state and retry failed connections.</p>
      </header>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search student</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.search}
            onChange={(event) => {
              setLoading(true);
              setFilters((value) => ({ ...value, search: event.target.value }));
            }}
            placeholder="Search students"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-400"
          />
        </label>
        <select
          aria-label="Filter platform"
          value={filters.platform}
          onChange={(event) => {
            setLoading(true);
            setFilters((value) => ({ ...value, platform: event.target.value }));
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        >
          <option>All</option>
          <option>LeetCode</option>
          <option>GeeksforGeeks</option>
        </select>
        <select
          aria-label="Filter sync status"
          value={filters.status}
          onChange={(event) => {
            setLoading(true);
            setFilters((value) => ({ ...value, status: event.target.value }));
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        >
          <option>All</option>
          <option value="success">Successful</option>
          <option value="failed">Failed</option>
          <option value="in_progress">Syncing</option>
        </select>
      </section>

      {notice && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Last Sync</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Error</th>
                <th className="px-4 py-3">Next Sync</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Loading sync records...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">No connected platform accounts match these filters.</td></tr>
              ) : records.map((record) => {
                const platform = record.platform === 'LeetCode' ? 'leetcode' : 'gfg';
                const key = `${record.studentId}-${platform}`;
                return (
                  <tr key={key} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{record.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{record.email} · {record.batch}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-800">{record.platform}</p>
                      <p className="mt-0.5 text-xs text-slate-500">@{record.handle}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatDate(record.lastSynced)}</td>
                    <td className="px-4 py-4"><StatusBadge type="sync" status={record.status} /></td>
                    <td className="max-w-xs whitespace-normal px-4 py-4 text-xs text-rose-700">
                      {record.lastError || '—'}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />Next configured scheduler run</span>
                    </td>
                    <td className="px-4 py-4">
                      {record.status === 'failed' && isAdminOrAbove && (
                        <button
                          type="button"
                          onClick={() => retrySync(record)}
                          disabled={Boolean(retryingKey)}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${retryingKey === key ? 'animate-spin' : ''}`} />
                          {retryingKey === key ? 'Retrying...' : 'Retry Sync'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminSyncMonitor;
