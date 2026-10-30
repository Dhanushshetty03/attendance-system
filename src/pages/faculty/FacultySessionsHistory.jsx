import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Search, Edit3, Lock, CheckCircle2, AlertCircle, FileDown } from 'lucide-react';
import { StatusBadge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Modal } from '../../components/common/Modal';
import api from '../../services/api';
import { exportToCSV } from '../../utils/exportUtils';

export function FacultySessionsHistory() {
  const [searchParams] = useSearchParams();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected session inspection & editing state
  const [inspectingSession, setInspectingSession] = useState(null);
  const [sessionRecords, setSessionRecords] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStatusMap, setEditedStatusMap] = useState({});
  const [auditReason, setAuditReason] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await api.getFacultyDashboard();
      if (res.success) {
        setSessions(res.data?.recentSessions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Inspect session details
  const openSessionInspection = async (sessionId) => {
    try {
      setLoadingDetails(true);
      setEditSuccess('');
      setAuditReason('');
      setIsEditing(false);
      const res = await api.getSessionAttendance(sessionId);
      if (res.success) {
        setInspectingSession(res.session);
        setSessionRecords(res.records || []);

        const initialMap = {};
        res.records.forEach((r) => {
          initialMap[r.id] = r.status;
        });
        setEditedStatusMap(initialMap);
      }
    } catch (err) {
      alert(err.message || 'Failed to load session details');
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    const viewId = searchParams.get('viewSession');
    if (viewId) {
      openSessionInspection(viewId);
    }
  }, [searchParams]);

  const handleSaveEdits = async (e) => {
    e.preventDefault();
    if (!auditReason.trim()) {
      alert('A valid audit reason is required for attendance adjustments.');
      return;
    }

    try {
      setSavingEdit(true);
      const recordsToUpdate = sessionRecords.map((r) => ({
        recordId: r.id,
        status: editedStatusMap[r.id] || r.status,
      }));

      const res = await api.updateSessionAttendance(inspectingSession.id, {
        records: recordsToUpdate,
        auditReason,
      });

      if (res.success) {
        setEditSuccess('Attendance updated and audit entry recorded successfully.');
        setIsEditing(false);
        // Refresh session
        openSessionInspection(inspectingSession.id);
        loadSessions();
      }
    } catch (err) {
      alert(err.message || 'Failed to update attendance');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleExportRoster = () => {
    if (!sessionRecords.length) return;
    const data = sessionRecords.map((r) => ({
      'Roll No': r.rollNo || '',
      'USN': r.usn,
      'Student Name': r.studentName,
      'Status': r.status,
      'Session Date': new Date(inspectingSession.date).toLocaleDateString(),
      'Subject': inspectingSession.subjectCode,
    }));
    exportToCSV(data, `Session_Roster_${inspectingSession.subjectCode}.csv`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Conducted Sessions & Edit Window
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review previously finalized class sessions. Adjustments are permitted within the 72-hour institutional edit window.
        </p>
      </div>

      {/* Sessions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton lines={5} />
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No class sessions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Date & Slot</th>
                  <th className="py-3 px-4">Topic Covered</th>
                  <th className="py-3 px-4 text-center">Attendance Ratio</th>
                  <th className="py-3 px-4 text-center">Percentage</th>
                  <th className="py-3 px-4 text-center">Lock Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {sess.subjectCode} - {sess.subjectName}
                      <span className="block text-[10px] text-slate-500">Sec {sess.section}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {new Date(sess.date).toLocaleDateString()}
                      <span className="block text-[10px] text-slate-400">{sess.timeSlot}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 truncate max-w-xs">
                      {sess.topicCovered || 'Regular Class Session'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                      {sess.presentCount} / {sess.totalStudents}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-bold ${
                          sess.percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {sess.percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        <Lock className="w-3 h-3 text-slate-400" />
                        Locked
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openSessionInspection(sess.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 font-semibold text-xs transition-colors"
                      >
                        Inspect / Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Session Details / Edit Modal */}
      <Modal
        isOpen={!!inspectingSession}
        onClose={() => setInspectingSession(null)}
        title={
          inspectingSession
            ? `Class Session: ${inspectingSession.subjectCode} (${new Date(inspectingSession.date).toLocaleDateString()})`
            : 'Session Details'
        }
        maxWidth="max-w-3xl"
      >
        {inspectingSession && (
          <div className="space-y-4">
            {/* Session Info Bar */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {inspectingSession.subjectName} (Sec {inspectingSession.sectionName})
                </span>
                <p className="text-slate-500 mt-0.5">Time: {inspectingSession.timeSlot} • Type: {inspectingSession.sessionType}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportRoster}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                {inspectingSession.isEditable ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-1 px-3 py-1 text-[11px] font-bold rounded-lg bg-blue-600 text-white"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'Cancel Edit' : 'Edit Attendance'}</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-amber-600 font-semibold">
                    Edit window elapsed (locked)
                  </span>
                )}
              </div>
            </div>

            {editSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold">
                {editSuccess}
              </div>
            )}

            {/* Roster Table */}
            <div className="max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 font-bold uppercase text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="py-2 px-3">Roll</th>
                    <th className="py-2 px-3">USN</th>
                    <th className="py-2 px-3">Student</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sessionRecords.map((r) => {
                    const currentVal = editedStatusMap[r.id] || r.status;
                    return (
                      <tr key={r.id}>
                        <td className="py-2 px-3 font-mono text-slate-500">{r.rollNo || '—'}</td>
                        <td className="py-2 px-3 font-mono">{r.usn}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{r.studentName}</td>
                        <td className="py-2 px-3 text-center">
                          {isEditing ? (
                            <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 gap-1">
                              <button
                                type="button"
                                onClick={() => setEditedStatusMap({ ...editedStatusMap, [r.id]: 'PRESENT' })}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  currentVal === 'PRESENT' ? 'bg-emerald-600 text-white' : 'text-slate-500'
                                }`}
                              >
                                P
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditedStatusMap({ ...editedStatusMap, [r.id]: 'ABSENT' })}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  currentVal === 'ABSENT' ? 'bg-rose-600 text-white' : 'text-slate-500'
                                }`}
                              >
                                A
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditedStatusMap({ ...editedStatusMap, [r.id]: 'LEAVE' })}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  currentVal === 'LEAVE' ? 'bg-amber-600 text-white' : 'text-slate-500'
                                }`}
                              >
                                L
                              </button>
                            </div>
                          ) : (
                            <StatusBadge status={r.status} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Audit reason input if editing */}
            {isEditing && (
              <form onSubmit={handleSaveEdits} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mandatory Reason for Retroactive Modification <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Corrected mark entry discrepancy verified with student signature roster."
                    value={auditReason}
                    onChange={(e) => setAuditReason(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingEdit ? 'Saving...' : 'Save & Record Audit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
