import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, Clock3, Database, RefreshCw, Server, XCircle } from 'lucide-react';
import { adminAPI } from '../../services/api';

const HealthCard = ({ title, status, detail, icon: Icon }) => {
  const healthy = ['Connected', 'Operational', 'Active'].includes(status);
  const StatusIcon = healthy ? CheckCircle2 : XCircle;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${healthy ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          <StatusIcon className="h-3.5 w-3.5" />
          {status || 'Unknown'}
        </span>
      </div>
      <h2 className="mt-4 font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 break-words text-sm text-slate-500">{detail || 'No additional details reported.'}</p>
    </article>
  );
};

export const AdminSyncHealth = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    adminAPI
      .getSystemHealth()
      .then((response) => {
        if (mounted && response.success) {
          setData(response.data);
          setError('');
        }
      })
      .catch((requestError) => {
        if (mounted) setError(requestError.message || 'Unable to retrieve system health.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  if (loading && !data) {
    return <div className="py-16 text-center text-sm text-slate-500">Checking system and sync health...</div>;
  }

  if (error && !data) {
    return (
      <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
        <div className="flex items-center gap-2 font-semibold"><AlertCircle className="h-5 w-5" />Health check unavailable</div>
        <p className="mt-2 text-sm">{error}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setReloadKey((value) => value + 1);
          }}
          className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  const db = data?.database || {};
  const backend = data?.backend || {};
  const integrations = data?.integrations || {};
  const scheduler = data?.scheduler || {};
  const telemetry = data?.telemetry || {};

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">System & Sync Health</h1>
          <p className="mt-1 text-sm text-slate-500">Live checks for the database, integrations, and scheduled worker.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setReloadKey((value) => value + 1);
          }}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh checks
        </button>
      </header>

      {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error} Showing the last successful check.</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <HealthCard
          title="Database"
          status={db.status}
          detail={`${db.totalStudents ?? 0} students · ${db.totalBatches ?? 0} batches · ${db.totalProgressRecords ?? 0} progress records`}
          icon={Database}
        />
        <HealthCard
          title="Backend"
          status="Operational"
          detail={`Uptime ${Math.floor((backend.uptimeSeconds || 0) / 60)} min · Node ${backend.nodeVersion || 'Unknown'}`}
          icon={Server}
        />
        <HealthCard
          title="LeetCode"
          status={integrations.leetcode?.status}
          detail={`GraphQL endpoint · ${integrations.leetcode?.latencyMs ?? '—'} ms`}
          icon={Activity}
        />
        <HealthCard
          title="GeeksforGeeks"
          status={integrations.geeksforgeeks?.status}
          detail={`Public profile endpoint · ${integrations.geeksforgeeks?.latencyMs ?? '—'} ms`}
          icon={Activity}
        />
        <HealthCard
          title="Progress scheduler"
          status={scheduler.status}
          detail={`Configured schedule: ${scheduler.cronSchedule || 'Not configured'}`}
          icon={Clock3}
        />
        <HealthCard
          title="Sync failures"
          status={telemetry.failedSyncCount === 0 ? 'Operational' : 'Attention required'}
          detail={`${telemetry.failedSyncCount ?? 0} connected student records currently report a failed sync.`}
          icon={AlertCircle}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Database inventory</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">Database</dt><dd className="mt-1 font-medium text-slate-900">{db.databaseName || 'Unavailable'}</dd></div>
          <div><dt className="text-slate-500">Last successful sync</dt><dd className="mt-1 font-medium text-slate-900">{telemetry.lastSuccessfulSync ? new Date(telemetry.lastSuccessfulSync).toLocaleString() : 'No successful sync recorded'}</dd></div>
          <div><dt className="text-slate-500">Activity records</dt><dd className="mt-1 font-medium text-slate-900">{db.totalActivityRecords ?? 0}</dd></div>
          <div><dt className="text-slate-500">Server timestamp</dt><dd className="mt-1 font-medium text-slate-900">{backend.serverTimestamp ? new Date(backend.serverTimestamp).toLocaleString() : 'Unavailable'}</dd></div>
        </dl>
      </section>
    </div>
  );
};

export default AdminSyncHealth;
