import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Users,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { batchAPI } from '../../services/api';

export const AdminBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await batchAPI.getBatches();
      if (res.success) {
        setBatches(res.batches);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const openCreateModal = () => {
    setEditId(null);
    setName('');
    setDescription('');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (batch) => {
    setEditId(batch._id);
    setName(batch.name);
    setDescription(batch.description || '');
    setError('');
    setModalOpen(true);
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      return setError('Batch name is required');
    }

    try {
      if (editId) {
        await batchAPI.updateBatch(editId, { name, description });
        setSuccessMsg(`Batch "${name}" updated successfully`);
      } else {
        await batchAPI.createBatch({ name, description });
        setSuccessMsg(`Batch "${name}" created successfully`);
      }
      setModalOpen(false);
      await fetchBatches();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (batch) => {
    if (!window.confirm(`Are you sure you want to delete batch "${batch.name}"?`)) {
      return;
    }

    try {
      const res = await batchAPI.deleteBatch(batch._id);
      if (res.success) {
        setSuccessMsg(`Batch "${batch.name}" deleted successfully`);
        await fetchBatches();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert(err.message || 'Could not delete batch');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-rose-400" />
            <span>Batch Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, manage cohorts, and review batch-level aggregate metrics
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Batch</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => (
            <div
              key={batch._id}
              className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-black">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{batch.name}</h3>
                      <span className="text-[10px] text-slate-500">
                        Created {new Date(batch.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(batch)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title="Edit Batch"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(batch)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Delete Batch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 min-h-[36px] line-clamp-2 mt-1">
                  {batch.description || 'No description provided.'}
                </p>

                {/* Batch Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 my-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500">Students</span>
                    <div className="text-lg font-bold text-white mt-0.5">{batch.studentCount || 0}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500">Total Solved</span>
                    <div className="text-lg font-bold text-white mt-0.5">{batch.totalProblems || 0}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500">Avg / Student</span>
                    <div className="text-base font-bold text-indigo-400 mt-0.5">{batch.avgProblems || 0}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500">Active Today</span>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">{batch.activeToday || 0}</div>
                  </div>
                </div>
              </div>

              <Link
                to={`/admin/students?batch=${batch.name}`}
                className="pt-3 border-t border-slate-800/80 text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center justify-between"
              >
                <span>View Batch Roster ({batch.studentCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">
              {editId ? 'Edit Batch' : 'Create New Training Batch'}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Batches group students into cohorts for target analytics and leaderboards
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Batch Name (e.g. Delta, 2026-CSE, Gamma) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Delta"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Pre-final year competitive programming cohort"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
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
                  {editId ? 'Save Changes' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
