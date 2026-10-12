import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { adminAuthAPI } from '../../services/api';

export const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupStatusKnown, setSetupStatusKnown] = useState(false);

  useEffect(() => {
    adminAuthAPI
      .checkSetupStatus()
      .then((res) => {
        setNeedsSetup(res.setupRequired);
      })
      .catch(() => {})
      .finally(() => setSetupStatusKnown(true));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Admin authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 relative font-sans antialiased">
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl text-slate-900 tracking-tight">DsArena</span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">Administrator Portal</h2>
          <p className="text-xs text-slate-500 mt-1">Institutional monitoring and batch analytics management</p>
        </div>

        {/* Needs Setup Banner if 0 Admins exist */}
        {setupStatusKnown && needsSetup && (
          <div className="mb-6 p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-900 shadow-sm flex items-start gap-3">
            <Sparkles className="w-5 h-5 shrink-0 text-orange-600 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-sm text-orange-800">First-Time Setup Required</p>
              <p className="text-orange-700 mt-0.5">
                Zero administrative accounts exist in the database. You must bootstrap the initial Super Admin account before signing in.
              </p>
              <Link
                to="/admin/setup"
                className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-xs shadow-xs transition-colors"
              >
                <span>Launch Initial Admin Setup</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Card Form */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@organization.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In as Administrator'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <Link
              to="/login"
              className="text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors"
            >
              &larr; Switch to Student Sign In
            </Link>
            {!needsSetup && (
              <p className="mt-3 text-[11px] text-slate-500">
                Need an admin account? Ask your Super Admin to create one.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
