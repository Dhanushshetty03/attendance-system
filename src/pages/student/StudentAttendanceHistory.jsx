import React, { useState, useEffect } from 'react';
import { Calendar, Filter, FileDown, Search, AlertCircle, HelpCircle, UploadCloud, Paperclip, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Modal } from '../../components/common/Modal';
import api from '../../services/api';
import { exportToCSV } from '../../utils/exportUtils';

export function StudentAttendanceHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Correction Request Modal state
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [correctionSuccess, setCorrectionSuccess] = useState('');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = {};
      if (subjectFilter !== 'ALL') params.subjectId = subjectFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.getStudentAttendance(params);
      if (res.success) {
        setRecords(res.records || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [subjectFilter, statusFilter]);

  const handleExportCSV = () => {
    if (!filteredRecords.length) return;
    const csvData = filteredRecords.map((r) => ({
      Date: new Date(r.date).toLocaleDateString(),
      Time: r.timeSlot,
      'Subject Code': r.subjectCode,
      'Subject Name': r.subjectName,
      Faculty: r.facultyName,
      'Topic Covered': r.topicCovered,
      Status: r.status,
      Remarks: r.remarks || 'None',
    }));
    exportToCSV(csvData, 'Attendance_History_Logs.csv');
  };

  const handleOpenCorrection = (record) => {
    setSelectedRecordForCorrection(record);
    setCorrectionReason('');
    setProofUrl('');
    setProofFile(null);
    setUploadError('');
    setCorrectionSuccess('');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds maximum size limit of 5MB.');
      return;
    }

    try {
      setUploadingFile(true);
      setUploadError('');
      const res = await api.uploadProofFile(file);
      if (res.success) {
        setProofUrl(res.fileUrl);
        setProofFile(file);
      }
    } catch (err) {
      setUploadError(err.message || 'Proof document upload failed.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmitCorrection = async (e) => {
    e.preventDefault();
    if (!selectedRecordForCorrection) return;

    try {
      setSubmittingCorrection(true);
      const payload = {
        sessionId: selectedRecordForCorrection.sessionId,
        requestedStatus: 'PRESENT',
        reason: correctionReason,
        proofDocUrl: proofUrl || undefined,
      };

      const res = await api.submitCorrectionRequest(payload);
      if (res.success) {
        setCorrectionSuccess('Correction request successfully submitted to the Administrator.');
        setTimeout(() => {
          setSelectedRecordForCorrection(null);
          setCorrectionSuccess('');
        }, 1500);
      }
    } catch (err) {
      alert(err.message || 'Failed to submit correction request.');
    } finally {
      setSubmittingCorrection(false);
    }
  };

  // Distinct subjects for filter dropdown
  const uniqueSubjects = Array.from(
    new Map(records.map((r) => [r.subjectId, { id: r.subjectId, code: r.subjectCode, name: r.subjectName }])).values()
  );

  const filteredRecords = records.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.subjectCode.toLowerCase().includes(term) ||
      r.subjectName.toLowerCase().includes(term) ||
      r.topicCovered.toLowerCase().includes(term) ||
      r.facultyName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Detailed Attendance History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete date-wise log of class sessions, presence status, and topic coverage.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0"
        >
          <FileDown className="w-4 h-4" />
          <span>Export History (CSV)</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Subject Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Subject:</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Subjects</option>
              {uniqueSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present Only</option>
              <option value="ABSENT">Absent Only</option>
              <option value="LEAVE">Authorized Leave Only</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search topic or faculty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton lines={5} />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No attendance records match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Date & Slot</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Topic Covered</th>
                  <th className="py-3 px-4">Faculty</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4 text-right">Discrepancy?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {new Date(r.date).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-slate-400">{r.timeSlot}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white">{r.subjectCode}</span>
                      <p className="text-[10px] text-slate-500 truncate max-w-xs">{r.subjectName}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {r.topicCovered}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      {r.facultyName}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">
                      {r.remarks || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {r.status === 'ABSENT' ? (
                        <button
                          onClick={() => handleOpenCorrection(r)}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200 dark:border-blue-800 transition-colors"
                        >
                          Request Correction
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Verified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Correction Modal */}
      <Modal
        isOpen={!!selectedRecordForCorrection}
        onClose={() => setSelectedRecordForCorrection(null)}
        title="Submit Attendance Correction Request"
      >
        {selectedRecordForCorrection && (
          <form onSubmit={handleSubmitCorrection} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">Subject:</span>
                <span className="font-semibold">{selectedRecordForCorrection.subjectCode} - {selectedRecordForCorrection.subjectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">Session Date:</span>
                <span>{new Date(selectedRecordForCorrection.date).toLocaleDateString()} ({selectedRecordForCorrection.timeSlot})</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">Recorded Status:</span>
                <span className="text-rose-600 font-bold">ABSENT</span>
              </div>
            </div>

            {correctionSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold">
                {correctionSuccess}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Correction Request <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="State clearly why you were absent or provide On-Duty / Medical details..."
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Supporting Proof Document (Medical Certificate / OD Approval)
              </label>

              {/* Physical file upload */}
              <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 rounded-lg shrink-0">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {proofFile ? proofFile.name : 'Upload Certificate / Document'}
                      </p>
                      <p className="text-[10px] text-slate-500">PDF, JPG, PNG up to 5MB</p>
                    </div>
                  </div>

                  <label className="cursor-pointer px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shrink-0">
                    <span>{uploadingFile ? 'Uploading...' : proofFile ? 'Change' : 'Browse'}</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      onChange={handleFileChange}
                      disabled={uploadingFile}
                      className="hidden"
                    />
                  </label>
                </div>

                {uploadError && (
                  <p className="text-[11px] text-rose-500 font-medium mt-2">{uploadError}</p>
                )}

                {proofUrl && (
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Proof attached: {proofUrl}</span>
                  </div>
                )}
              </div>

              {/* Or external URL */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Or paste external cloud drive link:
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedRecordForCorrection(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingCorrection}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {submittingCorrection ? 'Submitting...' : 'Submit to Administrator'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
