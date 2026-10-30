import React, { useEffect, useState } from 'react';
import { ClipboardList, AlertCircle, CheckCircle2, Clock, ExternalLink, Trash2 } from 'lucide-react';
import { StatusBadge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import api from '../../services/api';

export function CorrectionRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await api.getStudentCorrections();
      if (res.success) {
        setRequests(res.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleCancelRequest = async (id) => {
    if (!window.confirm('Are you sure you want to withdraw this correction request?')) return;
    try {
      setCancellingId(id);
      const res = await api.cancelCorrectionRequest(id);
      if (res.success) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      alert(err.message || 'Failed to withdraw correction request.');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return <LoadingSkeleton lines={6} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Attendance Correction Requests
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Track official correction requests submitted for absence reconciliations, medical excuses, and official duty (OD).
        </p>
      </div>

      {/* Requests List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No correction requests logged. To request a correction, visit your Attendance History page and click "Request Correction" beside an absent session.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Session Date</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Reason Given</th>
                  <th className="py-3 px-4 text-center">Current &rarr; Requested</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Review Remarks</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{req.subjectCode}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">{req.subjectName}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {new Date(req.sessionDate).toLocaleDateString()}
                      <span className="block text-[10px] text-slate-400">{req.timeSlot}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {req.facultyName}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-800 dark:text-slate-200">{req.reason}</p>
                      {req.proofDocUrl && (
                        <a
                          href={req.proofDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline mt-1 font-semibold"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Attached Document
                        </a>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      <span className="text-rose-600">{req.currentStatus}</span>
                      <span className="mx-1 text-slate-400">&rarr;</span>
                      <span className="text-emerald-600">{req.requestedStatus}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-[11px]">
                      {req.reviewRemarks ? (
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{req.reviewRemarks}</p>
                          <p className="text-[10px] text-slate-400">Reviewed by {req.reviewedBy || 'Admin'}</p>
                        </div>
                      ) : (
                        <span className="italic text-slate-400">Under Review</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {req.status === 'PENDING' ? (
                        <button
                          onClick={() => handleCancelRequest(req.id)}
                          disabled={cancellingId === req.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-200 dark:border-rose-900 disabled:opacity-50"
                          title="Withdraw this pending request"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{cancellingId === req.id ? 'Withdrawing...' : 'Withdraw'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">Locked</span>
                      )}
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
