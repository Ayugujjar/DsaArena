import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { adminAuthAPI } from '../../services/api';

export const AdminSetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminAuthAPI.setupPassword(token, { password, confirmPassword });
      setComplete(true);
    } catch (requestError) {
      setError(requestError.message || 'Unable to set your password. Request a new invitation link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-7 sm:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div className="font-extrabold text-2xl text-slate-900">DsArena</div>
          <h1 className="text-xl font-bold text-slate-900 mt-4">Set administrator password</h1>
        </div>

        {complete ? (
          <div className="text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <p className="text-sm text-slate-600 mb-6">
              Your password is set. Sign in to the administrator portal to continue.
            </p>
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-xl"
            >
              Administrator Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-slate-700 mb-1">
                New password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={72}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label htmlFor="admin-confirm-password" className="block text-sm font-medium text-slate-700 mb-1">
                Confirm password
              </label>
              <input
                id="admin-confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={72}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-xl disabled:opacity-60"
            >
              {loading ? 'Saving password...' : 'Set password'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminSetPassword;
