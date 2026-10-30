import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Search,
  Lock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Modal } from '../../components/common/Modal';
import api from '../../services/api';

export function MarkAttendancePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [assignedClasses, setAssignedClasses] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('09:00 - 10:00');
  const [sessionType, setSessionType] = useState('REGULAR');
  const [topicCovered, setTopicCovered] = useState('');

  // Enrolled students and attendance states
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { [studentId]: 'PRESENT' | 'ABSENT' | 'LEAVE' }
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successSummary, setSuccessSummary] = useState(null);

  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 1. Fetch assigned classes on mount
  useEffect(() => {
    async function loadAssigned() {
      try {
        setLoading(true);
        const res = await api.getFacultyDashboard();
        if (res.success && res.data?.assignedClasses?.length > 0) {
          const classes = res.data.assignedClasses;
          setAssignedClasses(classes);

          const paramSubject = searchParams.get('subjectId');
          const paramSection = searchParams.get('sectionId');
          const paramSlot = searchParams.get('timeSlot');

          if (paramSubject && paramSection) {
            setSelectedSubjectId(paramSubject);
            setSelectedSectionId(paramSection);
          } else {
            setSelectedSubjectId(classes[0].subjectId);
            setSelectedSectionId(classes[0].sectionId);
          }

          if (paramSlot) {
            setTimeSlot(paramSlot);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load assigned classes');
      } finally {
        setLoading(false);
      }
    }
    loadAssigned();
  }, [searchParams]);

  // 2. Load enrolled students whenever selected subject and section change
  useEffect(() => {
    if (!selectedSubjectId || !selectedSectionId) return;

    async function loadStudents() {
      try {
        setLoading(true);
        setError('');
        const res = await api.getEnrolledStudents(selectedSubjectId, selectedSectionId);
        if (res.success) {
          const enrolled = res.students || [];
          setStudents(enrolled);

          // By default, initialize all enrolled students as PRESENT
          const initialMap = {};
          enrolled.forEach((s) => {
            initialMap[s.id] = 'PRESENT';
          });
          setAttendanceMap(initialMap);
        }
      } catch (err) {
        setError(err.message || 'Failed to load enrolled student roster');
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, [selectedSubjectId, selectedSectionId]);

  // Handle individual status toggle
  const setStatus = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Quick actions
  const markAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
  };

  // Live counters
  const totalStudents = students.length;
  const presentCount = Object.values(attendanceMap).filter((v) => v === 'PRESENT').length;
  const absentCount = Object.values(attendanceMap).filter((v) => v === 'ABSENT').length;
  const leaveCount = Object.values(attendanceMap).filter((v) => v === 'LEAVE').length;
  const livePercentage =
    totalStudents > 0 ? Math.round((presentCount / totalStudents) * 10000) / 100 : 0;

  // Search filter
  const filteredStudents = students.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return s.name.toLowerCase().includes(term) || s.usn.toLowerCase().includes(term) || (s.rollNo && s.rollNo.toLowerCase().includes(term));
  });

  // Submit & Lock Attendance
  const handleProceedToSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Check if every student has an attendance status
    const unmarked = students.find((s) => !attendanceMap[s.id]);
    if (unmarked) {
      setError(`Student ${unmarked.name} (${unmarked.usn}) does not have an attendance status assigned.`);
      return;
    }

    setShowConfirmModal(true);
  };

  const executeSubmission = async () => {
    try {
      setSubmitting(true);
      setError('');

      const recordsData = students.map((s) => ({
        studentId: s.id,
        status: attendanceMap[s.id],
      }));

      const payload = {
        subjectId: selectedSubjectId,
        sectionId: selectedSectionId,
        date: sessionDate,
        timeSlot,
        sessionType,
        topicCovered: topicCovered || 'Regular Curriculum Session',
        records: recordsData,
      };

      const res = await api.markAttendance(payload);
      if (res.success) {
        setShowConfirmModal(false);
        setSuccessSummary(res.summary);
      }
    } catch (err) {
      setShowConfirmModal(false);
      setError(err.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Mark Class Attendance
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Select course, section, date and record student attendance. Records are locked immediately upon submission.
        </p>
      </div>

      {/* Success Notification Alert */}
      {successSummary && (
        <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Attendance Successfully Submitted & Locked in Database!</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900">
              <span className="text-slate-400">Total Evaluated</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{successSummary.totalEvaluated}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900">
              <span className="text-emerald-600">Present</span>
              <p className="text-lg font-bold text-emerald-600">{successSummary.presentCount}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900">
              <span className="text-rose-600">Absent</span>
              <p className="text-lg font-bold text-rose-600">{successSummary.absentCount}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900">
              <span className="text-blue-600">Attendance %</span>
              <p className="text-lg font-bold text-blue-600">{successSummary.attendancePercentage}%</p>
            </div>
          </div>
          <div className="pt-2 flex gap-3">
            <button
              onClick={() => {
                setSuccessSummary(null);
                navigate('/faculty/sessions');
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
            >
              View in Sessions History
            </button>
            <button
              onClick={() => setSuccessSummary(null)}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
            >
              Mark Another Session
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Session Configuration Form */}
      <form onSubmit={handleProceedToSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            1. Select Class & Session Parameters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Subject Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subject & Section
              </label>
              <select
                value={`${selectedSubjectId}_${selectedSectionId}`}
                onChange={(e) => {
                  const [subId, secId] = e.target.value.split('_');
                  setSelectedSubjectId(subId);
                  setSelectedSectionId(secId);
                }}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {assignedClasses.map((cls) => (
                  <option key={cls.assignmentId} value={`${cls.subjectId}_${cls.sectionId}`}>
                    {cls.subjectCode} - {cls.subjectName} (Sec {cls.sectionName})
                  </option>
                ))}
              </select>
            </div>

            {/* Session Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Time Slot */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Time Slot
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="09:00 - 10:00">09:00 - 10:00 AM (Hour 1)</option>
                <option value="10:00 - 11:00">10:00 - 11:00 AM (Hour 2)</option>
                <option value="11:15 - 12:15">11:15 - 12:15 PM (Hour 3)</option>
                <option value="12:15 - 13:15">12:15 - 01:15 PM (Hour 4)</option>
                <option value="14:00 - 16:00">02:00 - 04:00 PM (Lab Slot)</option>
              </select>
            </div>

            {/* Session Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Session Type
              </label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="REGULAR">Regular Theory</option>
                <option value="LAB">Practical / Laboratory</option>
                <option value="TUTORIAL">Tutorial</option>
                <option value="REMEDIAL">Remedial Class</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Curriculum Topic / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. B-Trees and B+ Trees Indexing mechanisms with sample query demonstrations"
              value={topicCovered}
              onChange={(e) => setTopicCovered(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Live Attendance Stats Header Bar */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Enrolled</span>
              <span className="text-xl font-black">{totalStudents}</span>
            </div>
            <div>
              <span className="text-emerald-400 block text-[10px] uppercase font-bold">Present</span>
              <span className="text-xl font-black text-emerald-400">{presentCount}</span>
            </div>
            <div>
              <span className="text-rose-400 block text-[10px] uppercase font-bold">Absent</span>
              <span className="text-xl font-black text-rose-400">{absentCount}</span>
            </div>
            <div>
              <span className="text-amber-400 block text-[10px] uppercase font-bold">Leave</span>
              <span className="text-xl font-black text-amber-400">{leaveCount}</span>
            </div>
            <div>
              <span className="text-blue-400 block text-[10px] uppercase font-bold">Session Rate</span>
              <span className="text-xl font-black text-blue-400">{livePercentage}%</span>
            </div>
          </div>

          {/* Quick Roster Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => markAll('PRESENT')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => markAll('ABSENT')}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
            >
              Clear to Absent
            </button>
          </div>
        </div>

        {/* Student Roster Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              2. Student Roster ({filteredStudents.length} Students)
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by name, USN, roll..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-6">
              <LoadingSkeleton lines={6} />
            </div>
          ) : students.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              No students enrolled in this course section.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-16">Roll No</th>
                    <th className="py-3 px-4">Student Details</th>
                    <th className="py-3 px-4 text-center">Cumulative %</th>
                    <th className="py-3 px-4 text-center">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.map((s) => {
                    const status = attendanceMap[s.id] || 'PRESENT';
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">
                          {s.rollNo || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{s.name}</div>
                          <span className="text-[11px] text-slate-500 font-mono">{s.usn}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-bold ${
                              s.currentAttendance?.percentage >= 75
                                ? 'text-emerald-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {s.currentAttendance?.percentage || 0}%
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            ({s.currentAttendance?.attended || 0}/{s.currentAttendance?.conducted || 0})
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 gap-1 border border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => setStatus(s.id, 'PRESENT')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                status === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                              }`}
                            >
                              Present (P)
                            </button>
                            <button
                              type="button"
                              onClick={() => setStatus(s.id, 'ABSENT')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                status === 'ABSENT'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                              }`}
                            >
                              Absent (A)
                            </button>
                            <button
                              type="button"
                              onClick={() => setStatus(s.id, 'LEAVE')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                status === 'LEAVE'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                              }`}
                            >
                              Leave (OD)
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Bottom Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="text-xs text-slate-500">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Audit Compliance:
            </span>{' '}
            Submission timestamp and instructor ID will be cryptographically logged.
          </div>

          <button
            type="submit"
            disabled={students.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>Lock & Submit Attendance</span>
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Attendance Submission"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            You are about to finalize attendance for <strong>{totalStudents}</strong> students on <strong>{sessionDate}</strong> ({timeSlot}).
          </p>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <div className="flex justify-between font-medium">
              <span>Present Students:</span>
              <span className="text-emerald-600 font-bold">{presentCount}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Absent Students:</span>
              <span className="text-rose-600 font-bold">{absentCount}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Authorized Leave:</span>
              <span className="text-amber-600 font-bold">{leaveCount}</span>
            </div>
            <div className="flex justify-between font-medium pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Attendance Rate:</span>
              <span className="text-blue-600 font-black">{livePercentage}%</span>
            </div>
          </div>

          <p className="text-[11px] text-amber-600 dark:text-amber-400">
            ⚠️ Duplicate session prevention is enforced. Subsequent adjustments must be made within the 72-hour authorized edit window.
          </p>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Review Again
            </button>
            <button
              type="button"
              onClick={executeSubmission}
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Locking in DB...' : 'Confirm and Lock'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
