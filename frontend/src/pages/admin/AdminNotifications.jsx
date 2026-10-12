import React, { useState, useEffect } from 'react';
import { BellRing, Send, CheckCircle2, AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { notificationAPI, batchAPI, adminAPI } from '../../services/api';

export const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [batches, setBatches] = useState(['Alpha', 'Beta', 'Gamma']);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [studentPages, setStudentPages] = useState(1);

  const [formData, setFormData] = useState({
    recipientType: 'all',
    batchName: 'Gamma',
    recipientIds: [],
    title: '',
    message: '',
    type: 'announcement',
  });

  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    try {
      const res = await notificationAPI.getAllNotifications();
      if (res.success) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    notificationAPI
      .getAllNotifications()
      .then((res) => {
        if (active && res.success) setNotifications(res.notifications);
      })
      .catch((err) => {
        if (active) console.error('Failed to load notification history:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    batchAPI
      .getBatches()
      .then((res) => {
        if (active && res.success && res.batches.length > 0) {
          setBatches(res.batches.map((b) => b.name));
        }
      })
      .catch((err) => console.error('Failed to load batches:', err));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (formData.recipientType !== 'students') return;

    let active = true;
    adminAPI
      .getStudents({
        page: studentPage,
        limit: 10,
        search: studentSearch,
        sortBy: 'name',
        order: 'asc',
      })
      .then((res) => {
        if (!active) return;
        setStudents(res.students || []);
        setStudentPages(res.pages || 1);
      })
      .catch((err) => {
        if (active) {
          setStatusMsg({ text: err.message || 'Unable to load students', type: 'error' });
          setStudents([]);
        }
      })
      .finally(() => {
        if (active) setStudentsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [formData.recipientType, studentPage, studentSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg({ text: '', type: '' });

    if (!formData.title.trim() || !formData.message.trim()) {
      return setStatusMsg({ text: 'Title and message are required', type: 'error' });
    }
    if (formData.recipientType === 'students' && formData.recipientIds.length === 0) {
      return setStatusMsg({ text: 'Select at least one student', type: 'error' });
    }

    setSubmitting(true);
    try {
      const res = await notificationAPI.sendNotification(formData);
      if (res.success) {
        setStatusMsg({ text: res.message || 'Message sent successfully!', type: 'success' });
        setFormData({
          recipientType: 'all',
          batchName: 'Gamma',
          recipientIds: [],
          title: '',
          message: '',
          type: 'announcement',
        });
        await fetchAll();
      }
    } catch (err) {
      setStatusMsg({ text: err.message || 'Failed to broadcast announcement', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <BellRing className="w-6 h-6 text-rose-400" />
          <span>Announcements & Broadcasts</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Broadcast alerts, contest reminders, and batch notifications to students
        </p>
      </div>

      {/* Broadcast Form */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm shadow-xl">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Send className="w-4 h-4 text-rose-400" />
          <span>Compose New Announcement</span>
        </h2>

        {statusMsg.text && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Target Audience
              </label>
              <select
                value={formData.recipientType}
                onChange={(e) => {
                  setFormData({ ...formData, recipientType: e.target.value });
                  setStudentPage(1);
                  setStudentsLoading(e.target.value === 'students');
                  setStatusMsg({ text: '', type: '' });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="all">All Enrolled Students</option>
                <option value="batch">Specific Training Batch</option>
                <option value="students">Selected Students</option>
              </select>
            </div>

            {formData.recipientType === 'batch' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Select Batch
                </label>
                <select
                  value={formData.batchName}
                  onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  {batches.map((b) => (
                    <option key={b} value={b}>
                      {b} Batch
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {formData.recipientType === 'students' && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Choose Students
                  </label>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {formData.recipientIds.length} selected (up to 100 per message)
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="search"
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setStudentPage(1);
                      setStudentsLoading(true);
                    }}
                    placeholder="Search name or email"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="max-h-52 overflow-y-auto divide-y divide-slate-800 rounded-lg border border-slate-800">
                {studentsLoading ? (
                  <div className="p-4 text-center text-xs text-slate-500">Loading students...</div>
                ) : students.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">No matching students found.</div>
                ) : (
                  students.map((student) => {
                    const selected = formData.recipientIds.includes(student._id);
                    const selectionLimitReached = !selected && formData.recipientIds.length >= 100;
                    return (
                      <label
                        key={student._id}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-900/80 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={selectionLimitReached}
                          onChange={(e) => {
                            setFormData((current) => ({
                              ...current,
                              recipientIds: e.target.checked
                                ? [...current.recipientIds, student._id]
                                : current.recipientIds.filter((id) => id !== student._id),
                            }));
                          }}
                          className="accent-orange-500"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-medium text-white">{student.name}</span>
                          <span className="block truncate text-[10px] text-slate-500">{student.email}</span>
                        </span>
                        <span className="ml-auto text-[10px] text-slate-500">{student.batch}</span>
                      </label>
                    );
                  })
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <button
                  type="button"
                  disabled={studentPage <= 1 || studentsLoading}
                  onClick={() => {
                    setStudentsLoading(true);
                    setStudentPage((page) => page - 1);
                  }}
                  className="inline-flex items-center gap-1 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <span>Page {studentPage} of {studentPages}</span>
                <button
                  type="button"
                  disabled={studentPage >= studentPages || studentsLoading}
                  onClick={() => {
                    setStudentsLoading(true);
                    setStudentPage((page) => page + 1);
                  }}
                  className="inline-flex items-center gap-1 disabled:opacity-40"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Announcement Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Saturday Mock DSA Contest Announcement"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Message Content *
            </label>
            <textarea
              rows={3}
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter detailed message for students..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || (formData.recipientType === 'students' && formData.recipientIds.length === 0)}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Sending...' : 'Send Message'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Broadcast History */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
          Broadcast History
        </h3>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No broadcasts sent yet.</div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n._id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{n.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {n.recipientType === 'all'
                        ? 'All Students'
                        : n.recipientType === 'batch'
                          ? `${n.batchName} Batch`
                          : n.recipientType === 'students'
                            ? `${n.recipientIds?.length || 0} Selected Students`
                            : 'One Student'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed mt-1 text-[11px]">{n.message}</p>
                <div className="mt-2 text-[10px] text-slate-500">Sent by: {n.senderName}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
