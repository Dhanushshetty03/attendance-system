import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  CalendarCheck,
  AlertTriangle,
  ClipboardList,
  PlusCircle,
  Database,
  RefreshCw,
} from 'lucide-react';
import {
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
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import api from '../../services/api';

// Color mapping per table for visual distinction
const TABLE_COLORS = {
  User:                        { bg: 'bg-blue-50 dark:bg-blue-950/40',     badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',         dot: 'bg-blue-500' },
  StudentProfile:              { bg: 'bg-indigo-50 dark:bg-indigo-950/40', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300', dot: 'bg-indigo-500' },
  FacultyProfile:              { bg: 'bg-violet-50 dark:bg-violet-950/40', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300', dot: 'bg-violet-500' },
  Department:                  { bg: 'bg-purple-50 dark:bg-purple-950/40', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300', dot: 'bg-purple-500' },
  Subject:                     { bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/40', badge: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-300', dot: 'bg-fuchsia-500' },
  Section:                     { bg: 'bg-pink-50 dark:bg-pink-950/40',     badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',         dot: 'bg-pink-500' },
  AcademicTerm:                { bg: 'bg-rose-50 dark:bg-rose-950/40',     badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',         dot: 'bg-rose-500' },
  Enrollment:                  { bg: 'bg-orange-50 dark:bg-orange-950/40', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300', dot: 'bg-orange-500' },
  FacultyAssignment:           { bg: 'bg-amber-50 dark:bg-amber-950/40',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',     dot: 'bg-amber-500' },
  Timetable:                   { bg: 'bg-yellow-50 dark:bg-yellow-950/40', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300', dot: 'bg-yellow-500' },
  ClassSession:                { bg: 'bg-lime-50 dark:bg-lime-950/40',     badge: 'bg-lime-100 text-lime-700 dark:bg-lime-900/50 dark:text-lime-300',         dot: 'bg-lime-500' },
  AttendanceRecord:            { bg: 'bg-green-50 dark:bg-green-950/40',   badge: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',     dot: 'bg-green-500' },
  AttendanceCorrectionRequest: { bg: 'bg-teal-50 dark:bg-teal-950/40',    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',         dot: 'bg-teal-500' },
  Notification:                { bg: 'bg-cyan-50 dark:bg-cyan-950/40',     badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',         dot: 'bg-cyan-500' },
  AuditLog:                    { bg: 'bg-sky-50 dark:bg-sky-950/40',       badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',             dot: 'bg-sky-500' },
  SystemSetting:               { bg: 'bg-slate-50 dark:bg-slate-800/60',   badge: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',        dot: 'bg-slate-500' },
};

export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dbRefreshing, setDbRefreshing] = useState(false);

  const navigate = useNavigate();

  async function loadAdminDash() {
    try {
      setLoading(true);
      const res = await api.getAdminDashboard();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load administrator dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function refreshDb() {
    setDbRefreshing(true);
    try {
      const res = await api.getAdminDashboard();
      if (res.success) setData(res.data);
    } finally {
      setDbRefreshing(false);
    }
  }

  useEffect(() => {
    loadAdminDash();
  }, []);

  if (loading) {
    return <LoadingSkeleton lines={6} />;
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-2xl">
        <p className="font-semibold">{error || 'Unable to load administrative overview'}</p>
      </div>
    );
  }

  const { metrics, departmentStats, recentAuditLogs, databaseTables } = data;
  const totalDbRecords = databaseTables?.reduce((sum, t) => sum + t.records, 0) ?? 0;
  const maxRecords = databaseTables ? Math.max(...databaseTables.map((t) => t.records)) : 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Chief Academic Administrator Portal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Institutional overview, department comparisons, student admissions, and correction adjudications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/admin/corrections')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Review Corrections ({metrics.pendingCorrectionsCount})</span>
          </button>
          <button
            onClick={() => navigate('/admin/students')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Enroll Student</span>
          </button>
        </div>
      </div>

      {/* Main KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={metrics.totalStudents}
          variant="blue"
          icon={Users}
          subtext="Enrolled across branches"
        />
        <StatCard
          title="Faculty Members"
          value={metrics.totalFaculty}
          variant="purple"
          icon={UserCheck}
          subtext="Active instructors"
        />
        <StatCard
          title="Campus Average %"
          value={`${metrics.averageCampusAttendance}%`}
          variant={metrics.averageCampusAttendance >= 75 ? 'green' : 'amber'}
          icon={CalendarCheck}
          subtext="Mean institutional attendance"
        />
        <StatCard
          title="Shortage Students"
          value={metrics.lowAttendanceCount}
          variant={metrics.lowAttendanceCount === 0 ? 'green' : 'rose'}
          icon={AlertTriangle}
          subtext="Below 75% threshold"
        />
      </div>

      {/* Department-wise Attendance Comparison Chart + Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Department-Level Attendance Rates
              </h3>
              <p className="text-xs text-slate-500">
                Comparison across academic branches
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val, name, item) => [`${val}%`, item.payload.name]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <ReferenceLine y={75} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: '75% Threshold', fill: '#f43f5e', fontSize: 10 }} />
                <Bar dataKey="attendancePercentage" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Audit Trail Feed */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Security &amp; Audit Logs
              </h3>
              <button
                onClick={() => navigate('/admin/audit-logs')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Full Audit Trail
              </button>
            </div>

            <div className="space-y-3">
              {recentAuditLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 truncate">
                    {log.details}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    By: {log.userName} ({log.userRole})
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block text-center">
              All attendance additions and edits are immutable and audited with IP tracking.
            </span>
          </div>
        </div>
      </div>

      {/* =============================================
          DATABASE OVERVIEW — Live Table Record Counts
          ============================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-500/20">
              <Database className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">SQLite Database Overview</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Live record counts from{' '}
                <span className="font-mono text-green-400">server/prisma/dev.db</span>{' '}
                — all data is fully persisted
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">Total Records</p>
              <p className="text-xl font-bold text-white">{totalDbRecords.toLocaleString()}</p>
            </div>
            <button
              onClick={refreshDb}
              disabled={dbRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${dbRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span>📦 <strong className="text-slate-700 dark:text-slate-200">16 Tables</strong> in schema</span>
          <span>📊 <strong className="text-slate-700 dark:text-slate-200">{totalDbRecords.toLocaleString()}</strong> total rows stored</span>
          <span>🗄️ ORM: <strong className="text-slate-700 dark:text-slate-200 font-mono">Prisma v5 + SQLite</strong></span>
          <span>📁 File: <strong className="text-slate-700 dark:text-slate-200 font-mono">server/prisma/dev.db</strong></span>
        </div>

        {/* Table grid */}
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {databaseTables?.map((item) => {
              const color = TABLE_COLORS[item.table] || TABLE_COLORS.SystemSetting;
              const barWidth = maxRecords > 0 ? Math.max(4, (item.records / maxRecords) * 100) : 4;
              return (
                <div
                  key={item.table}
                  className={`${color.bg} rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/50 flex flex-col gap-2 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full ${color.dot} flex-shrink-0`} />
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 font-mono truncate">
                        {item.table}
                      </span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ${color.badge}`}>
                      {item.records.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="mt-auto pt-1">
                    <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color.dot} rounded-full transition-all duration-700`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer note */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
            🔒 All data is stored in a relational SQLite database via <strong>Prisma ORM</strong>.
            Browse tables interactively at{' '}
            <span className="font-mono text-blue-600 dark:text-blue-400">http://localhost:5555</span>{' '}
            (Prisma Studio).
          </p>
        </div>
      </div>
    </div>
  );
}
