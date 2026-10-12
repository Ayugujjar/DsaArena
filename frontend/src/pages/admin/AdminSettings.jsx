import React from 'react';
import { Sliders, Database, Clock, Server, CheckCircle2, Shield } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export const AdminSettings = () => {
  const { admin } = useAdminAuth();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sliders className="w-6 h-6 text-rose-400" />
          <span>System & Telemetry Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Platform synchronization intervals and environment telemetry</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Background Sync Engine Card */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Synchronization Engine</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Automated background cron runs on the server to retrieve new submissions and calculate daily streaks.
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Current Schedule:</span>
              <span className="font-mono font-semibold text-indigo-400">Every 6 Hours (0 */6 * * *)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Status:</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active & Running
              </span>
            </div>
          </div>
        </div>

        {/* Database & Infrastructure */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Database & Host</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Persistent storage and telemetry metrics stored in local MongoDB cluster.
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Database Engine:</span>
              <span className="font-semibold text-white">MongoDB Community v8.3.4</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Database Name:</span>
              <span className="font-mono font-semibold text-emerald-400">dsa_tracker</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Access Review */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-rose-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Security & Token Architecture</h3>
        </div>
        <div className="text-xs text-slate-400 leading-relaxed space-y-2">
          <p>
            • Student sessions are signed using dedicated HMAC JWT tokens valid for 30 days.
          </p>
          <p>
            • Admin sessions are governed by isolated institutional admin secrets with role enforcement on all mutating endpoints.
          </p>
          <p>
            • Third-party credentials (LeetCode & GFG passwords) are intentionally excluded from the architecture to ensure zero credential leakage risk.
          </p>
        </div>
      </div>
    </div>
  );
};
