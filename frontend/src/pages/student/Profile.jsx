import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  CheckCircle2,
  Code2,
  Zap,
  Save,
  AlertCircle,
  Camera,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userAPI, batchAPI } from '../../services/api';

export const Profile = () => {
  const { user, refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    branch: user?.branch || 'CSE',
    college: user?.college || '',
    batch: user?.batch || 'General',
    profileImage: user?.profileImage || '',
  });

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const photoInputRef = useRef(null);

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setMessage({ text: 'Choose a PNG, JPEG, or WebP image.', type: 'error' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: 'Profile photos must be 2 MB or smaller.', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData((current) => ({ ...current, profileImage: reader.result }));
        setMessage({ text: 'Photo selected. Save changes to update your profile.', type: 'success' });
      } else {
        setMessage({ text: 'Unable to read the selected photo.', type: 'error' });
      }
    };
    reader.onerror = () => setMessage({ text: 'Unable to read the selected photo.', type: 'error' });
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await userAPI.updateProfile(formData);
      if (res.success) {
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        if (refreshUser) await refreshUser();
      }
    } catch (err) {
      setMessage({ text: err.message || 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your academic identity and competitive coding handles</p>
      </div>

      {/* Top Profile Summary Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-2xl bg-orange-500 overflow-hidden flex items-center justify-center font-black text-2xl text-white shadow-md shadow-orange-500/20">
            {formData.profileImage ? (
              <img src={formData.profileImage} alt={`${user?.name || 'Student'} profile`} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0) || 'U'
            )}
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handlePhotoChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700"
          >
            <Camera className="w-3.5 h-3.5" /> Edit photo
          </button>
          {formData.profileImage && (
            <button
              type="button"
              onClick={() => setFormData((current) => ({ ...current, profileImage: '' }))}
              className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-rose-600"
            >
              <Trash2 className="w-3 h-3" /> Remove
            </button>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
              {user?.batch || 'General'} Batch
            </span>
          </div>
          <p className="text-xs text-slate-500">{user?.email}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {user?.branch || 'CSE'} • {user?.college || 'University Not Specified'}
          </p>
        </div>

        {/* Connected Badges */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Code2 className="w-4 h-4 text-amber-500" />
            <span className="text-slate-600 font-medium">LeetCode:</span>
            <span className="text-slate-900 font-bold">
              {user?.leetcodeConnected ? `@${user.leetcodeUsername}` : 'Disconnected'}
            </span>
            {user?.leetcodeConnected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto" />}
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-600 font-medium">GFG:</span>
            <span className="text-slate-900 font-bold">
              {user?.gfgConnected ? `@${user.gfgUsername}` : 'Disconnected'}
            </span>
            {user?.gfgConnected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto" />}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Solved</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{user?.totalSolved || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-orange-600">Weekly Solved</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{user?.weeklySolved || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-indigo-600">Monthly Solved</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{user?.monthlySolved || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-amber-600">Current Streak</span>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-center justify-center gap-1">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            {user?.currentStreak || 0}d
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-600">Longest Streak</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{user?.longestStreak || 0}d</div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4">Edit Profile Information</h3>

        {message.text && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Batch
              </label>
              <select
                name="batch"
                value={formData.batch}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
              >
                {batches.map((b) => (
                  <option key={b} value={b}>
                    {b} Batch
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Branch / Specialization
              </label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                placeholder="e.g. CSE"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                College / Institute
              </label>
              <input
                type="text"
                name="college"
                value={formData.college}
                onChange={handleChange}
                placeholder="e.g. NIT Delhi"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
