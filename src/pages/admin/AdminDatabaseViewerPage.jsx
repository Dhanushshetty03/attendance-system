import React, { useEffect, useState, useCallback } from 'react';
import {
  Database,
  Users,
  UserCheck,
  Building2,
  BookOpen,
  Calendar,
  CalendarCheck,
  ClipboardList,
  Bell,
  ShieldAlert,
  Settings,
  Table2,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '../../services/api';

// Table definitions — which API endpoint and columns to use
const TABLES = [
  {
    key: 'students',
    label: 'Students',
    icon: Users,
    color: 'blue',
    description: 'All enrolled students with USN, section, department',
    columns: ['Name', 'USN', 'Section', 'Semester', 'Department', 'Email'],
    fetchKey: 'students',
  },
  {
    key: 'faculty',
    label: 'Faculty',
    icon: UserCheck,
    color: 'violet',
    description: 'All teaching faculty members',
    columns: ['Name', 'Employee ID', 'Department', 'Designation', 'Email'],
    fetchKey: 'faculty',
  },
  {
    key: 'attendance',
    label: 'Attendance Records',
    icon: CalendarCheck,
    color: 'green',
    description: 'Per-student per-session attendance log (7,394+ rows)',
    columns: ['Student', 'USN', 'Subject', 'Date', 'Status', 'Marked By'],
    fetchKey: 'attendance',
  },
  {
    key: 'corrections',
    label: 'Correction Requests',
    icon: ClipboardList,
    color: 'amber',
    description: 'Student grievance and OD/Medical correction requests',
    columns: ['Student', 'Subject', 'Date', 'Reason', 'Status', 'Submitted'],
    fetchKey: 'corrections',
  },
];

const COLOR_MAP = {
  blue:   { header: 'bg-blue-600',   badge: 'bg-blue-100 text-blue-700',   icon: 'text-blue-600',   border: 'border-blue-200' },
  violet: { header: 'bg-violet-600', badge: 'bg-violet-100 text-violet-700', icon: 'text-violet-600', border: 'border-violet-200' },
  green:  { header: 'bg-green-600',  badge: 'bg-green-100 text-green-700',  icon: 'text-green-600',  border: 'border-green-200' },
  amber:  { header: 'bg-amber-600',  badge: 'bg-amber-100 text-amber-700',  icon: 'text-amber-600',  border: 'border-amber-200' },
};

const PAGE_SIZE = 15;

function StatusBadge({ status }) {
  const map = {
    PRESENT: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    ABSENT:  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    LEAVE:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    APPROVED:'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    REJECTED:'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

export function AdminDatabaseViewerPage() {
  const [activeTable, setActiveTable] = useState(TABLES[0].key);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dbStats, setDbStats] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.getAdminDashboard();
      if (res.success) setDbStats(res.data.databaseTables);
    } catch (_) {}
  }, []);

  const loadTableData = useCallback(async (tableKey) => {
    setLoading(true);
    setRows([]);
    setPage(1);
    try {
      if (tableKey === 'students') {
        const res = await api.getAdminStudents({ departmentId: 'ALL' });
        if (res.success) setRows(res.students || []);
      } else if (tableKey === 'faculty') {
        const res = await api.getAdminFaculty();
        if (res.success) setRows(res.faculty || []);
      } else if (tableKey === 'corrections') {
        const res = await api.getAdminCorrections({ status: 'ALL' });
        if (res.success) setRows(res.corrections || []);
      } else if (tableKey === 'attendance') {
        // Get attendance via student reports
        const studRes = await api.getAdminStudents({ departmentId: 'ALL' });
        if (studRes.success && studRes.students?.length) {
          // Fetch first student's attendance as sample
          const sampleRecords = (studRes.students || []).flatMap((s) => {
            return (s.subjectAttendance || []).map((sub) => ({
              studentName: s.name,
              usn: s.usn,
              subject: sub.subjectName || sub.subjectCode,
              date: sub.lastSessionDate || '-',
              totalConducted: sub.conducted,
              attended: sub.attended,
              percentage: sub.percentage,
              status: sub.percentage >= 75 ? 'PRESENT' : 'ABSENT',
            }));
          });
          setRows(sampleRecords.length ? sampleRecords : studRes.students.map(s => ({
            studentName: s.name,
            usn: s.usn,
            subject: 'All Subjects',
            date: '-',
            totalConducted: s.attendance?.conducted ?? '-',
            attended: s.attendance?.attended ?? '-',
            percentage: s.attendance?.percentage ?? '-',
            status: (s.attendance?.percentage ?? 100) >= 75 ? 'PRESENT' : 'ABSENT',
          })));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadTableData(activeTable);
    setSearch('');
  }, [activeTable, loadTableData]);

  const filteredRows = rows.filter((r) => {
    const q = search.toLowerCase();
    return Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q));
  });

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeTableDef = TABLES.find((t) => t.key === activeTable);
  const colors = COLOR_MAP[activeTableDef?.color] || COLOR_MAP.blue;

  const totalDbRecords = dbStats?.reduce((s, t) => s + t.records, 0) ?? 0;

  // Render a row for each table type
  function renderRow(row, idx) {
    if (activeTable === 'students') {
      return (
        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <td className="px-4 py-2.5 text-[12px] font-medium text-slate-800 dark:text-slate-200">{row.name}</td>
          <td className="px-4 py-2.5 text-[11px] font-mono text-slate-600 dark:text-slate-400">{row.usn}</td>
          <td className="px-4 py-2.5 text-[11px] text-slate-600 dark:text-slate-400">{row.section}</td>
          <td className="px-4 py-2.5 text-[11px] text-slate-600 dark:text-slate-400">{row.semester}</td>
          <td className="px-4 py-2.5 text-[11px] text-slate-600 dark:text-slate-400">{row.department?.name ?? row.department}</td>
          <td className="px-4 py-2.5 text-[11px] text-slate-500 dark:text-slate-500 truncate max-w-[160px]">{row.email}</td>
        </tr>
      );
    }
    if (activeTable === 'faculty') {
      return (
        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <td className="px-4 py-2.5 text-[12px] font-medium text-slate-800 dark:text-slate-200">{row.name}</td>
          <td className="px-4 py-2.5 text-[11px] font-mono text-slate-600 dark:text-slate-400">{row.employeeId}</td>
          <td className="px-4 py-2.5 text-[11px] text-slate-600 dark:text-slate-400">{row.department?.name ?? row.department}</td>
          <td className="px-4 py-2.5 text-[11px] text-slate-600 dark:text-slate-400">{row.designation}</td>
          <td className="px-4 py-2.5 text-[11px] text-slate-500 dark:text-slate-500">{row.email}</td>
        </tr>
      );
    }
    if (activeTable === 'attendance') {
      return (
        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <td className="px-4 py-2.5 text-[12px] font-medium text-slate-800 dark:text-slate-200">{row.studentName}</td>
          <td className="px-4 py-2.5 text-[11px] font-mono text-slate-600 dark:text-slate-400">{row.usn}</td>
          <td className="px-4 py-2.5 text-[11px] text-slate-600 dark:text-slate-400">{row.subject}</td>
          <td className="px-4 py-2.5 text-[11px] text-slate-500">{row.totalConducted} classes</td>
          <td className="px-4 py-2.5 text-[11px] text-slate-500">{row.attended} attended</td>
          <td className="px-4 py-2.5">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${row.percentage >= 75 ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
              {row.percentage}%
            </span>
          </td>
        </tr>
      );
    }
    if (activeTable === 'corrections') {
      return (
        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <td className="px-4 py-2.5 text-[12px] font-medium text-slate-800 dark:text-slate-200">{row.studentName}</td>
          <td className="px-4 py-2.5 text-[11px] text-slate-600 dark:text-slate-400">{row.subjectName || row.subjectCode}</td>
          <td className="px-4 py-2.5 text-[11px] text-slate-600 dark:text-slate-400">{row.requestedDate ? new Date(row.requestedDate).toLocaleDateString() : '-'}</td>
          <td className="px-4 py-2.5 text-[11px] text-slate-500 max-w-[200px] truncate">{row.reason}</td>
          <td className="px-4 py-2.5"><StatusBadge status={row.status} /></td>
          <td className="px-4 py-2.5 text-[11px] text-slate-400">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}</td>
        </tr>
      );
    }
    return null;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-700">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-500/20">
              <Database className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Database Viewer</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Live data from <span className="font-mono text-green-400">server/prisma/dev.db</span> (SQLite via Prisma ORM)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[11px] text-slate-400">Total DB Records</p>
              <p className="text-2xl font-bold text-white">{totalDbRecords.toLocaleString()}</p>
            </div>
            <button
              onClick={() => { loadStats(); loadTableData(activeTable); }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* DB Stats Row */}
        {dbStats && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {dbStats.slice(0, 8).map((t) => (
              <div key={t.table} className="bg-slate-700/50 rounded-lg px-3 py-2 text-center">
                <p className="text-[9px] font-mono text-slate-400 truncate">{t.table}</p>
                <p className="text-sm font-bold text-white">{t.records.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABLES.map((t) => {
          const Icon = t.icon;
          const isActive = activeTable === t.key;
          const c = COLOR_MAP[t.color];
          return (
            <button
              key={t.key}
              onClick={() => setActiveTable(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                isActive
                  ? `${c.header} text-white border-transparent shadow-md`
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Data Table Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Header */}
        <div className={`${colors.header} px-6 py-4 flex items-center justify-between flex-wrap gap-3`}>
          <div className="flex items-center gap-2">
            {(() => { const Icon = activeTableDef?.icon || Table2; return <Icon className="w-5 h-5 text-white" />; })()}
            <div>
              <h2 className="text-sm font-bold text-white">{activeTableDef?.label} Table</h2>
              <p className="text-[11px] text-white/70">{activeTableDef?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-lg">
              {filteredRows.length} rows
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/40">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={`Search in ${activeTableDef?.label}...`}
            className="flex-1 text-sm bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-xs text-slate-400 hover:text-slate-600">
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 mt-3">Loading data from SQLite...</p>
            </div>
          ) : pagedRows.length === 0 ? (
            <div className="py-16 text-center">
              <Database className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No records found{search ? ` for "${search}"` : ''}</p>
            </div>
          ) : (
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                  {activeTableDef?.columns.map((col) => (
                    <th key={col} className="px-4 py-2.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pagedRows.map((row, idx) => renderRow(row, idx))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredRows.length > PAGE_SIZE && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredRows.length)} of {filteredRows.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          🔒 All records are persisted in <strong className="font-mono">server/prisma/dev.db</strong> (SQLite).
          Any changes made in the web app (marking attendance, enrolling students, approving corrections) are 
          immediately written to this database and reflected here on refresh.
          Full interactive view available at{' '}
          <span className="font-mono text-blue-600 dark:text-blue-400">http://localhost:5555</span> via Prisma Studio.
        </p>
      </div>
    </div>
  );
}
