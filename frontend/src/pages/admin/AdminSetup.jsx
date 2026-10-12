import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Lock, Mail, ShieldAlert, ShieldCheck, User } from 'lucide-react';
import { adminAuthAPI } from '../../services/api';
import { useAdminAuth } from '../../context/AdminAuthContext';

export const AdminSetup = () => {
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  const [formData, setFormData] = useState({ name: '', email: '', code: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [codeIssued, setCodeIssued] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isSetupAllowed, setIsSetupAllowed] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [setupStatusError, setSetupStatusError] = useState(false);

  useEffect(() => {
    adminAuthAPI
      .checkSetupStatus()
      .then((result) => {
        setSetupRequired(result.setupRequired);
        setIsSetupAllowed(result.setupAvailable);
      })
      .catch(() => {
        setSetupStatusError(true);
        setIsSetupAllowed(false);
      })
      .finally(() => setChecking(false));
  }, []);

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleRequestCode = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await adminAuthAPI.requestSetupCode({
        name: formData.name.trim(),
        email: formData.email.trim(),
      });
      setGeneratedCode(result.setupCode || '');
      setCodeIssued(true);
    } catch (requestError) {
      setError(requestError.message || 'Unable to generate the setup code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await adminAuthAPI.completeInitialSetup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        code: formData.code.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      await login(formData.email.trim(), formData.password);
      navigate('/admin/dashboard');
    } catch (requestError) {
      setError(requestError.message || 'The verification code was rejected. Check it and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSetupAllowed) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {setupStatusError
              ? 'Unable to Check Initial Setup'
              : setupRequired
                ? 'Admin Setup Configuration Required'
                : 'Initial Setup Already Completed'}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {setupStatusError
              ? 'The server could not verify whether initial setup is available. Try again later or contact an administrator.'
              : setupRequired
                ? 'Open this page on the backend computer during development, or set ADMIN_SETUP_EMAIL on the server.'
                : 'The platform already has registered administrative accounts. New admins can be created from the Admin Portal.'}
          </p>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            <span>Proceed to Administrator Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 font-sans antialiased">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl text-slate-900 tracking-tight">DsArena</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Initial Super Admin Setup</h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate a one-time scratch code and enter it to create the first administrator.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          {error && (
            <div role="alert" className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {codeIssued ? (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
                <CheckCircle2 className="w-4 h-4 inline mr-2" />
                {generatedCode
                  ? 'Your one-time scratch code is shown below. It expires in 10 minutes.'
                  : 'Enter the one-time code shown in the backend terminal. It expires in 10 minutes.'}
              </div>
              {generatedCode && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wider text-orange-700">Your scratch code</div>
                  <div className="mt-1 font-mono text-3xl font-bold tracking-[0.35em] text-slate-900">{generatedCode}</div>
                </div>
              )}
              <div>
                <label htmlFor="setup-code" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Setup code
                </label>
                <input
                  id="setup-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-center text-2xl tracking-[0.5em] text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label htmlFor="admin-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Create password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={72}
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="admin-confirm-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={72}
                    required
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Verifying code...' : 'Verify code and create admin'}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCodeIssued(false);
                  setGeneratedCode('');
                  setFormData((current) => ({ ...current, code: '', password: '', confirmPassword: '' }));
                }}
                className="w-full text-sm text-slate-500 hover:text-slate-700"
              >
                Back
              </button>
            </form>
          ) : (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label htmlFor="admin-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Admin full name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-name"
                    type="text"
                    required
                    maxLength={100}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="admin-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Admin email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-email"
                    type="email"
                    required
                    maxLength={254}
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  In local development the code appears here; on other servers, use the email configured as ADMIN_SETUP_EMAIL.
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Generating code...' : 'Generate setup code'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
          <div className="mt-6 text-center text-xs text-slate-500">
            <Link to="/admin/login" className="text-orange-600 font-bold hover:underline">
              Administrator Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;
