import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, AlertCircle, CheckCircle2, Shield, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const Settings = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Security rules
  const np = passData.newPassword;
  const hasMinLength = np.length >= 12;
  const hasUpper = /[A-Z]/.test(np);
  const hasLower = /[a-z]/.test(np);
  const hasNumber = /[0-9]/.test(np);
  const hasSpecial = /[^A-Za-z0-9]/.test(np);
  const withinHashLimit = new TextEncoder().encode(np).length <= 72;
  const isMatch = np.length > 0 && np === passData.confirmPassword;
  const isPasswordSecure = hasMinLength && withinHashLimit && hasUpper && hasLower && hasNumber && hasSpecial;

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!isPasswordSecure) {
      return setMessage({
        text: 'New password must be at least 12 characters and include uppercase, lowercase, number, and special character.',
        type: 'error',
      });
    }

    if (!isMatch) {
      return setMessage({ text: 'New passwords do not match', type: 'error' });
    }

    setLoading(true);
    try {
      const res = await userAPI.updatePassword({
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword,
      });

      if (res.success) {
        setMessage({ text: 'Password changed successfully!', type: 'success' });
        setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        logout(false);
        navigate('/login', { replace: true });
      }
    } catch (err) {
      setMessage({ text: err.message || 'Failed to update password', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account & Security Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Configure credentials and cybersecurity preferences</p>
      </div>

      {/* Password Change Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-orange-600" />
          <h2 className="text-base font-bold text-slate-900">Security & Password Update</h2>
        </div>

        {message.text && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={passData.currentPassword}
              onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
              placeholder="••••••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passData.newPassword}
                  onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                  placeholder="Min 12 characters"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-9 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={passData.confirmPassword}
                onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                placeholder="Re-enter new password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px]">
            <p className="font-semibold text-slate-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
              Password Safety Requirements:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-slate-600">
              <span className={hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                {hasMinLength ? '✓' : '○'} 12+ Characters
              </span>
              <span className={withinHashLimit ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                {withinHashLimit ? '✓' : '○'} At most 72 bytes
              </span>
              <span className={hasUpper ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                {hasUpper ? '✓' : '○'} Uppercase
              </span>
              <span className={hasLower ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                {hasLower ? '✓' : '○'} Lowercase
              </span>
              <span className={hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                {hasNumber ? '✓' : '○'} Number
              </span>
              <span className={hasSpecial ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                {hasSpecial ? '✓' : '○'} Special Symbol
              </span>
              <span className={isMatch ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                {isMatch ? '✓' : '○'} Passwords Match
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading || !isPasswordSecure || !isMatch}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Securing...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
