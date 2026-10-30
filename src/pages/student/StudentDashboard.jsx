import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileDown,
  Calculator,
  Calendar,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { exportToCSV, exportStudentAttendancePDF } from '../../utils/exportUtils';

export function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const res = await api.getStudentDashboard();
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const handleDownloadPDF = async () => {
    try {
      setExporting(true);
      const res = await api.getStudentReport();
      if (res.success && res.report) {
        exportStudentAttendancePDF(res.report);
      }
    } catch (err) {
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!data?.subjectWise) return;
    const csvRows = data.subjectWise.map((s) => ({
      'Subject Code': s.code,
      'Subject Name': s.name,
      Faculty: s.faculty,
      Conducted: s.conducted,
      Attended: s.attended,
      Missed: s.missed,
      'Attendance %': `${s.percentage}%`,
      Status: s.status,
    }));
    exportToCSV(csvRows, `Student_Attendance_${data.student.usn}.csv`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-2xl">
        <p className="font-semibold">{error || 'Unable to retrieve student profile'}</p>
      </div>
    );
  }

  const { student, summary, subjectWise, attendanceTrend, todayClasses, recentActivity } = data;

  // Data for Subject comparison chart
  const barChartData = subjectWise.map((s) => ({
    name: s.code,
    fullName: s.name,
    percentage: s.percentage,
    attended: s.attended,
    conducted: s.conducted,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Student Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Welcome, {student.name}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
              {student.usn}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {student.department} • Semester {student.semester} - Section {student.section}
          </p>
        </div>

        {/* Quick Report Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{exporting ? 'Generating...' : 'Official PDF Statement'}</span>
          </button>
        </div>
      </div>

      {/* Low Attendance Warning Alert Banner (if below threshold) */}
      {summary.hasLowAttendanceWarning && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Attendance Shortage Alert
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                You have {summary.lowAttendanceSubjectsCount} subject(s) below the mandatory 75% attendance threshold. Use the Attendance Calculator to plan required classes.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/student/calculator')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors shadow-xs"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Open Calculator</span>
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${summary.overallPercentage}%`}
          variant={summary.overallPercentage >= 75 ? 'green' : 'rose'}
          icon={CalendarCheck}
          subtext={`Min threshold: ${data.threshold}%`}
        />
        <StatCard
          title="Total Conducted"
          value={summary.totalConducted}
          variant="blue"
          icon={Clock}
          subtext="Sessions to date"
        />
        <StatCard
          title="Classes Attended"
          value={summary.totalAttended}
          variant="green"
          icon={CheckCircle2}
          subtext="Present records"
        />
        <StatCard
          title="Classes Missed"
          value={summary.totalMissed}
          variant="rose"
          icon={XCircle}
          subtext="Absent records"
        />
        <StatCard
          title="Shortage Subjects"
          value={summary.lowAttendanceSubjectsCount}
          variant={summary.lowAttendanceSubjectsCount === 0 ? 'green' : 'amber'}
          icon={AlertTriangle}
          subtext="Below 75% target"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Progression Line Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Attendance Trajectory (%)
              </h3>
              <p className="text-xs text-slate-500">Historical trend progression over time</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Current: {summary.overallPercentage}%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Attendance']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine y={75} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: '75% Target', position: 'insideTopRight', fill: '#f43f5e', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#2563eb' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject-wise Bar Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Subject Comparison
              </h3>
              <p className="text-xs text-slate-500">Attendance rate across enrolled courses</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val, name, item) => [
                    `${val}% (${item.payload.attended}/${item.payload.conducted})`,
                    item.payload.fullName,
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <ReferenceLine y={75} stroke="#f43f5e" strokeDasharray="3 3" />
                <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Subject-wise Attendance Detailed Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Subject-wise Attendance Status
            </h3>
            <p className="text-xs text-slate-500">
              Official Logisys attendance report as of {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Faculty</th>
                <th className="py-3 px-4 text-center">Attended</th>
                <th className="py-3 px-4 text-center">Conducted</th>
                <th className="py-3 px-4 text-center">Attendance %</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Projection / Advice</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {subjectWise.map((sub) => (
                <tr key={sub.subjectId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">{sub.code}</div>
                    <div className="text-slate-500 text-[11px] truncate max-w-xs">{sub.name}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                    {sub.faculty}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    {sub.attended}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-400">
                    {sub.conducted}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`font-extrabold text-sm ${
                        sub.percentage >= 75
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {sub.percentage}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">
                      {sub.advice}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => navigate(`/student/calculator?subject=${sub.code}`)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <span>Simulate</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Today's Timetable & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Today's Class Schedule
              </h3>
            </div>
            <button
              onClick={() => navigate('/student/timetable')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Full Timetable
            </button>
          </div>

          <div className="space-y-2.5">
            {todayClasses.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No classes scheduled for today.
              </p>
            ) : (
              todayClasses.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {c.subjectCode}
                      </span>
                      <span className="text-[10px] text-slate-400">Room {c.roomNumber}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate max-w-xs">
                      {c.subjectName} • {c.faculty}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {c.startTime} - {c.endTime}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Attendance Activity */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Attendance Log
              </h3>
            </div>
            <button
              onClick={() => navigate('/student/attendance')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              View Full History
            </button>
          </div>

          <div className="space-y-2.5">
            {recentActivity.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {rec.subjectCode}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(rec.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate max-w-xs">{rec.topic}</p>
                </div>
                <div>
                  <StatusBadge status={rec.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
