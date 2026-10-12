import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useAdminAuth } from '../../context/AdminAuthContext';

export const AdminAdmins = () => {
  const { admin: currentAdmin } = useAdminAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Admin',
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [setupLink, setSetupLink] = useState('');

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getAdmins();
      if (res.success) {
        setAdmins(res.admins);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setSetupLink('');

    try {
      const result = await adminAPI.createAdmin(formData);
      setSuccessMsg(result.message || `Administrator invitation created for ${formData.email}.`);
      setSetupLink(result.setupUrl || '');
      setModalOpen(false);
      setFormData({ name: '', email: '', role: 'Admin' });
      await fetchAdmins();
      if (result.emailSent) {
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.message || 'Failed to create admin');
    }
  };

  const handleDelete = async (adminObj) => {
    if (adminObj._id === currentAdmin?.id) {
      return alert('You cannot delete your own admin account');
    }

    if (!window.confirm(`Are you sure you want to remove admin access for "${adminObj.name}"?`)) {
      return;
    }

    try {
      await adminAPI.deleteAdmin(adminObj._id);
      setSuccessMsg(`Admin removed successfully`);
      await fetchAdmins();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to delete admin');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-rose-400" />
            <span>Admin Team & Roles</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Super Admin permission control: Manage institutional administrators and moderators
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Admin</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <div>
            <span>{successMsg}</span>
            {setupLink && (
              <a
                href={setupLink}
                target="_blank"
                rel="noreferrer"
                className="block mt-2 font-semibold text-emerald-200 underline break-all"
              >
                Open one-time password setup link
              </a>
            )}
          </div>
        </div>
      )}

      {/* Role Definitions Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 p-4 rounded-xl border border-rose-500/20">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">
            Super Admin
          </span>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Full root authority. Can create/delete admins, modify system settings, wipe cohorts, and view all student data.
          </p>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-indigo-500/20">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">
            Admin
          </span>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Instructors & Professors. Can create and modify batches, trigger progress updates, broadcast announcements, and inspect student records.
          </p>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-emerald-500/20">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
            Moderator
          </span>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Teaching Assistants & Peer Mentors. Read-only access to leaderboards, attendance matrix, and student problem logs.
          </p>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-sm">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="uppercase tracking-wider text-slate-400 border-b border-slate-800 bg-slate-800/40">
                <tr>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Permissions</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {admins.map((adm) => {
                  const isCurrent = adm._id === currentAdmin?.id;

                  return (
                    <tr key={adm._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-rose-400">
                          {adm.name.charAt(0)}
                        </div>
                        <span>{adm.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-bold">
                            YOU
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{adm.email}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] border ${
                            adm.role === 'Super Admin'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : adm.role === 'Admin'
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {adm.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {adm.permissions?.join(', ') || 'Standard view'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(adm.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isCurrent ? (
                          <button
                            onClick={() => handleDelete(adm)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Admin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[10px]">Active</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Create Administrator Account</h2>
            <p className="text-xs text-slate-400 mb-4">Grant platform oversight access to faculty or mentors</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Prof. Anjali Sharma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="anjali@college.edu"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <p className="text-xs text-slate-400">
                They will receive an email with a single-use password link. If email is unavailable, the setup link will appear here for secure sharing. Links expire in 30 minutes.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Admin">Admin (Professor / Instructor)</option>
                  <option value="Moderator">Moderator (TA / Peer Mentor)</option>
                  <option value="Super Admin">Super Admin (Principal / Lead)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30"
                >
                  Send Setup Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
