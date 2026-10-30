import React, { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle2, XCircle, Search, ExternalLink, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Modal } from '../../components/common/Modal';
import api from '../../services/api';

export function AdminCorrectionsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Review modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('APPROVED');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminCorrections({ status: statusFilter });
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
  }, [statusFilter]);

  const handleOpenReview = (req) => {
    setSelectedRequest(req);
    setReviewDecision('APPROVED');
    setReviewRemarks('');
    setReviewSuccess('');
  };

  const handleExecuteReview = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    if (!reviewRemarks.trim()) {
      alert('Review remarks are mandatory.');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await api.reviewCorrection(selectedRequest.id, {
        status: reviewDecision,
        reviewRemarks,
      });

      if (res.success) {
        setReviewSuccess(`Request ${reviewDecision.toLowerCase()} successfully.`);
        setTimeout(() => {
          setSelectedRequest(null);
          loadRequests();
        }, 1200);
      }
    } catch (err) {
      alert(err.message || 'Failed to review request');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Attendance Correction Requests & Adjudication
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review student grievances, medical certificates, and official duty (OD) reconciliations.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Requests</option>
            <option value="PENDING">Pending Action Only</option>
            <option value="APPROVED">Approved Requests</option>
            <option value="REJECTED">Rejected Requests</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton lines={6} />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No correction requests found for the selected status.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Subject & Session</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Student Grievance / Reason</th>
                  <th className="py-3 px-4 text-center">Change Requested</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{r.studentName}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{r.usn} ({r.department})</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      <div>{r.subjectCode} - {r.subjectName}</div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(r.sessionDate).toLocaleDateString()} • {r.timeSlot}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      {r.facultyName}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-700 dark:text-slate-300">{r.reason}</p>
                      {r.proofDocUrl && (
                        <a
                          href={r.proofDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:underline mt-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Proof Document
                        </a>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      <span className="text-rose-600">{r.currentStatus}</span>
                      <span className="mx-1 text-slate-400">&rarr;</span>
                      <span className="text-emerald-600">{r.requestedStatus}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.status === 'PENDING' ? (
                        <button
                          onClick={() => handleOpenReview(r)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"
                        >
                          Adjudicate
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">
                          Reviewed by {r.reviewedBy || 'Admin'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Review & Adjudicate Attendance Correction"
      >
        {selectedRequest && (
          <form onSubmit={handleExecuteReview} className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-bold text-slate-600 dark:text-slate-400">Student:</span>
                <span className="font-bold">{selectedRequest.studentName} ({selectedRequest.usn})</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-600 dark:text-slate-400">Course & Date:</span>
                <span>{selectedRequest.subjectCode} on {new Date(selectedRequest.sessionDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-600 dark:text-slate-400">Reason Given:</span>
                <span className="text-right max-w-xs">{selectedRequest.reason}</span>
              </div>
            </div>

            {reviewSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl">
                {reviewSuccess}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Decision
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewDecision('APPROVED')}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    reviewDecision === 'APPROVED'
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Update Roster</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewDecision('REJECTED')}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    reviewDecision === 'REJECTED'
                      ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Request</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Official Review Remarks <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Medical certificate verified with proctor office. Approved."
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReview}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submittingReview ? 'Processing...' : 'Confirm Decision'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
