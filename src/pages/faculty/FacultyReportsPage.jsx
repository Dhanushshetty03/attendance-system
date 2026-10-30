import React, { useEffect, useState } from 'react';
import { FileText, FileDown, AlertTriangle, Users, BookOpen } from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { exportToCSV } from '../../utils/exportUtils';

export function FacultyReportsPage() {
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const dashRes = await api.getFacultyDashboard();
        if (dashRes.success && dashRes.data?.assignedClasses?.length > 0) {
          const classes = dashRes.data.assignedClasses;
          setAssignedClasses(classes);
          setSelectedSubjectId(classes[0].subjectId);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) return;

    async function loadReport() {
      try {
        setLoading(true);
        const res = await api.getFacultyReports({ subjectId: selectedSubjectId });
        if (res.success) {
          setReport(res.report);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [selectedSubjectId]);

  const handleExportCSV = () => {
    if (!report?.students?.length) return;
    const selectedCourse = assignedClasses.find((c) => c.subjectId === selectedSubjectId);
    const data = report.students.map((s) => ({
      'Roll No': s.rollNo || '',
      'USN': s.usn,
      'Student Name': s.name,
      'Classes Conducted': s.conducted,
      'Classes Attended': s.attended,
      'Classes Missed': s.absent,
      'Attendance %': `${s.percentage}%`,
      'Status': s.percentage >= 75 ? 'ELIGIBLE' : 'SHORTAGE',
    }));
    exportToCSV(data, `Class_Attendance_${selectedCourse?.subjectCode || 'Course'}.csv`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Course Attendance Analytics & Reports
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review aggregate attendance percentages and identify students at risk of attendance detention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {assignedClasses.map((cls) => (
              <option key={cls.assignmentId} value={cls.subjectId}>
                {cls.subjectCode} - {cls.subjectName}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
          >
            <FileDown className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton lines={6} />
      ) : report ? (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Sessions"
              value={report.totalSessions}
              variant="blue"
              icon={BookOpen}
              subtext="Conducted in term"
            />
            <StatCard
              title="Students Enrolled"
              value={report.totalStudentsEnrolled}
              variant="green"
              icon={Users}
              subtext="Active in roster"
            />
            <StatCard
              title="Class Average"
              value={`${report.averageAttendancePercentage}%`}
              variant={report.averageAttendancePercentage >= 75 ? 'green' : 'amber'}
              icon={FileText}
              subtext="Mean attendance rate"
            />
            <StatCard
              title="Shortage Students"
              value={report.lowAttendanceCount}
              variant={report.lowAttendanceCount === 0 ? 'green' : 'rose'}
              icon={AlertTriangle}
              subtext="Below 75% threshold"
            />
          </div>

          {/* Student Roster Report Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Student Cumulative Attendance Roster
                </h3>
                <p className="text-xs text-slate-500">
                  Sorted by Roll Number • Minimum 75% threshold required
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-16">Roll</th>
                    <th className="py-3 px-4">USN</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4 text-center">Conducted</th>
                    <th className="py-3 px-4 text-center">Attended</th>
                    <th className="py-3 px-4 text-center">Missed</th>
                    <th className="py-3 px-4 text-center">Percentage</th>
                    <th className="py-3 px-4 text-center">Eligibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {report.students.map((st) => (
                    <tr key={st.studentId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                        {st.rollNo || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {st.usn}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {st.name}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-400">
                        {st.conducted}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {st.attended}
                      </td>
                      <td className="py-3.5 px-4 text-center text-rose-600">
                        {st.absent}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-black text-sm ${
                            st.percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {st.percentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge
                          status={st.percentage >= 75 ? 'ELIGIBLE' : 'SHORTAGE'}
                          text={st.percentage >= 75 ? 'Eligible' : 'Shortage'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
