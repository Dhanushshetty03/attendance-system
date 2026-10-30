import React, { useEffect, useState } from 'react';
import { ShieldAlert, Search, FileDown, Clock, Filter } from 'lucide-react';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { exportToCSV } from '../../utils/exportUtils';

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({ action: actionFilter, limit: 100 });
      if (res.success) {
        setLogs(res.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const handleExportCSV = () => {
    if (!logs.length) return;
    const csvData = filteredLogs.map((l) => ({
      Timestamp: new Date(l.createdAt).toLocaleString(),
      Action: l.action,
      Entity: l.entity,
      Details: l.details,
      'Performed By': l.userName,
      'User Role': l.userRole,
      'IP Address': l.ipAddress || '127.0.0.1',
    }));
    exportToCSV(csvData, 'Security_Audit_Trail.csv');
  };

  const filteredLogs = logs.filter((l) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.action.toLowerCase().includes(term) ||
      (l.details && l.details.toLowerCase().includes(term)) ||
      (l.userName && l.userName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Institutional Security & Audit Logs
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immutable system audit trail tracking logins, attendance marking, administrative adjustments, and IP origins.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0"
        >
          <FileDown className="w-4 h-4" />
          <span>Export Audit Trail (CSV)</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">Action Type:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Recorded Actions</option>
            <option value="ATTENDANCE_SUBMITTED">Attendance Submitted</option>
            <option value="ATTENDANCE_MODIFIED">Attendance Modified</option>
            <option value="CORRECTION_APPROVED">Correction Approved</option>
            <option value="CORRECTION_REJECTED">Correction Rejected</option>
            <option value="STUDENT_CREATED">Student Enrolled</option>
            <option value="USER_LOGIN">User Logins</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, details, user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton lines={6} />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No audit logs recorded for this category.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Origin User</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      {l.entity}
                    </td>
                    <td className="py-3 px-4 max-w-sm truncate text-slate-800 dark:text-slate-200">
                      {l.details}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 dark:text-white">{l.userName}</span>
                      <span className="block text-[10px] text-slate-400">({l.userRole})</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {l.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
