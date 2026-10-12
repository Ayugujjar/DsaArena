import React, { useState } from 'react';
import {
  Code2,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Unlink,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { integrationAPI } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';

export const ConnectPlatforms = () => {
  const { user, refreshUser } = useAuth();

  const [lcUsername, setLcUsername] = useState(user?.leetcodeUsername || '');
  const [gfgUsername, setGfgUsername] = useState(user?.gfgUsername || '');

  const [lcLoading, setLcLoading] = useState(false);
  const [gfgLoading, setGfgLoading] = useState(false);
  const [lcSyncing, setLcSyncing] = useState(false);
  const [gfgSyncing, setGfgSyncing] = useState(false);

  const [lcMessage, setLcMessage] = useState({ text: '', type: '' });
  const [gfgMessage, setGfgMessage] = useState({ text: '', type: '' });

  const handleConnectLeetCode = async (e) => {
    e.preventDefault();
    if (!lcUsername.trim()) return;

    setLcLoading(true);
    setLcMessage({ text: '', type: '' });

    try {
      const res = await integrationAPI.connectLeetCode(lcUsername.trim());
      setLcMessage({ text: res.message || 'LeetCode connected and initial snapshot synchronized!', type: 'success' });
      if (refreshUser) await refreshUser();
    } catch (err) {
      setLcMessage({ text: err.message || 'Failed to connect LeetCode handle. Check if handle exists.', type: 'error' });
    } finally {
      setLcLoading(false);
    }
  };

  const handleConnectGFG = async (e) => {
    e.preventDefault();
    if (!gfgUsername.trim()) return;

    setGfgLoading(true);
    setGfgMessage({ text: '', type: '' });

    try {
      const res = await integrationAPI.connectGFG(gfgUsername.trim());
      setGfgMessage({ text: res.message || 'GeeksforGeeks connected and initial snapshot synchronized!', type: 'success' });
      if (refreshUser) await refreshUser();
    } catch (err) {
      setGfgMessage({ text: err.message || 'Failed to connect GeeksforGeeks handle.', type: 'error' });
    } finally {
      setGfgLoading(false);
    }
  };

  const handleSyncLeetCodeOnly = async () => {
    setLcSyncing(true);
    try {
      await integrationAPI.syncLeetCode();
      if (refreshUser) await refreshUser();
      setLcMessage({ text: 'LeetCode telemetry refreshed successfully!', type: 'success' });
      setTimeout(() => setLcMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      setLcMessage({ text: err.message || 'LeetCode sync failed.', type: 'error' });
    } finally {
      setLcSyncing(false);
    }
  };

  const handleSyncGFGOnly = async () => {
    setGfgSyncing(true);
    try {
      await integrationAPI.syncGFG();
      if (refreshUser) await refreshUser();
      setGfgMessage({ text: 'GeeksforGeeks telemetry refreshed successfully!', type: 'success' });
      setTimeout(() => setGfgMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      setGfgMessage({ text: err.message || 'GeeksforGeeks sync failed.', type: 'error' });
    } finally {
      setGfgSyncing(false);
    }
  };

  const handleDisconnect = async (platform) => {
    if (!window.confirm(`Are you sure you want to disconnect ${platform === 'leetcode' ? 'LeetCode' : 'GeeksforGeeks'}?`)) {
      return;
    }

    try {
      await integrationAPI.disconnect(platform);
      if (platform === 'leetcode') {
        setLcUsername('');
        setLcMessage({ text: 'LeetCode handle disconnected.', type: 'success' });
      } else {
        setGfgUsername('');
        setGfgMessage({ text: 'GeeksforGeeks handle disconnected.', type: 'success' });
      }
      if (refreshUser) await refreshUser();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Coding Platform Connections</h1>
        <p className="text-xs text-slate-500 mt-1">
          Link verified competitive programming handles to automatically track DSA problem solving
        </p>
      </div>

      {/* Security notice banner */}
      <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-xs text-orange-900 flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-orange-950 block mb-0.5 font-bold">Safe Read-Only Telemetry</strong>
          Never enter your LeetCode or GeeksforGeeks password. DsArena strictly queries publicly accessible GraphQL & profile
          endpoints. Please verify that your LeetCode profile submissions visibility is set to public.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LeetCode Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">LeetCode</h3>
                  <p className="text-[11px] text-slate-500">leetcode.com/username</p>
                </div>
              </div>

              {user?.leetcodeConnected ? (
                <StatusBadge type="sync" status={user?.leetcodeSyncStatus || 'success'} />
              ) : (
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Not Connected
                </span>
              )}
            </div>

            {lcMessage.text && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  lcMessage.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {lcMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{lcMessage.text}</span>
              </div>
            )}

            {user?.leetcodeLastError && user?.leetcodeSyncStatus === 'failed' && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <p className="font-semibold">Last Sync Error:</p>
                <p className="text-[11px] mt-0.5 text-rose-700">{user.leetcodeLastError}</p>
              </div>
            )}

            <form onSubmit={handleConnectLeetCode} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  LeetCode Handle / Username
                </label>
                <input
                  type="text"
                  value={lcUsername}
                  onChange={(e) => setLcUsername(e.target.value)}
                  placeholder="e.g. johndoe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={lcLoading}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${lcLoading ? 'animate-spin' : ''}`} />
                  <span>{lcLoading ? 'Connecting...' : user?.leetcodeConnected ? 'Update Handle' : 'Connect Account'}</span>
                </button>

                {user?.leetcodeConnected && (
                  <>
                    <button
                      type="button"
                      onClick={handleSyncLeetCodeOnly}
                      disabled={lcSyncing}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                      title="Sync LeetCode"
                    >
                      <RefreshCw className={`w-4 h-4 ${lcSyncing ? 'animate-spin text-orange-500' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDisconnect('leetcode')}
                      className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                      title="Disconnect handle"
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>

          {/* Connected Stats Preview */}
          {user?.leetcodeConnected && user?.leetcodeStats && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block mb-2">
                Live LeetCode Snapshot
              </span>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 block">Total</span>
                  <span className="font-extrabold text-slate-900">{user.leetcodeStats.totalSolved || 0}</span>
                </div>
                <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 block">Easy</span>
                  <span className="font-extrabold text-slate-900">{user.leetcodeStats.easySolved || 0}</span>
                </div>
                <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                  <span className="text-[10px] text-amber-700 block">Med</span>
                  <span className="font-extrabold text-slate-900">{user.leetcodeStats.mediumSolved || 0}</span>
                </div>
                <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-rose-700 block">Hard</span>
                  <span className="font-extrabold text-slate-900">{user.leetcodeStats.hardSolved || 0}</span>
                </div>
              </div>
              <div className="mt-2.5 text-[11px] text-slate-500 flex justify-between">
                <span>Rank: #{user.leetcodeStats.ranking?.toLocaleString() || 'N/A'}</span>
                <span>
                  {user.leetcodeStats.lastSynced
                    ? `Synced ${new Date(user.leetcodeStats.lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Awaiting sync'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* GeeksforGeeks Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">GeeksforGeeks</h3>
                  <p className="text-[11px] text-slate-500">geeksforgeeks.org/user/username</p>
                </div>
              </div>

              {user?.gfgConnected ? (
                <StatusBadge type="sync" status={user?.gfgSyncStatus || 'success'} />
              ) : (
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Not Connected
                </span>
              )}
            </div>

            {gfgMessage.text && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  gfgMessage.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {gfgMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{gfgMessage.text}</span>
              </div>
            )}

            {user?.gfgLastError && user?.gfgSyncStatus === 'failed' && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <p className="font-semibold">Last Sync Error:</p>
                <p className="text-[11px] mt-0.5 text-rose-700">{user.gfgLastError}</p>
              </div>
            )}

            <form onSubmit={handleConnectGFG} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  GFG Username / Handle
                </label>
                <input
                  type="text"
                  value={gfgUsername}
                  onChange={(e) => setGfgUsername(e.target.value)}
                  placeholder="e.g. johndoe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={gfgLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${gfgLoading ? 'animate-spin' : ''}`} />
                  <span>{gfgLoading ? 'Connecting...' : user?.gfgConnected ? 'Update Handle' : 'Connect Account'}</span>
                </button>

                {user?.gfgConnected && (
                  <>
                    <button
                      type="button"
                      onClick={handleSyncGFGOnly}
                      disabled={gfgSyncing}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                      title="Sync GeeksforGeeks"
                    >
                      <RefreshCw className={`w-4 h-4 ${gfgSyncing ? 'animate-spin text-emerald-600' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDisconnect('gfg')}
                      className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                      title="Disconnect handle"
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>

          {/* Connected Stats Preview */}
          {user?.gfgConnected && user?.gfgStats && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block mb-2">
                Live GeeksforGeeks Snapshot
              </span>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 block">Total</span>
                  <span className="font-extrabold text-slate-900">{user.gfgStats.totalSolved || 0}</span>
                </div>
                <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 block">Easy</span>
                  <span className="font-extrabold text-slate-900">{user.gfgStats.easySolved || 0}</span>
                </div>
                <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                  <span className="text-[10px] text-amber-700 block">Med</span>
                  <span className="font-extrabold text-slate-900">{user.gfgStats.mediumSolved || 0}</span>
                </div>
                <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                  <span className="text-[10px] text-indigo-700 block">Score</span>
                  <span className="font-extrabold text-slate-900">{user.gfgStats.codingScore || 0}</span>
                </div>
              </div>
              <div className="mt-2.5 text-[11px] text-slate-500 flex justify-between">
                <span>Inst. Rank: #{user.gfgStats.institutionRank || 'N/A'}</span>
                <span>
                  {user.gfgStats.lastSynced
                    ? `Synced ${new Date(user.gfgStats.lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Awaiting sync'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectPlatforms;
