import React, { useEffect, useState } from 'react';
import { Users, Search, PlusCircle, FileDown, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { StatusBadge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Modal } from '../../components/common/Modal';
import api from '../../services/api';
import { exportStudentAttendancePDF } from '../../utils/exportUtils';

export function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [departments, setDepartments] = useState([]);

  // Create Student Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    usn: '',
    departmentId: '',
    semester: 5,
    section: '5A',
    rollNo: '',
    contactNo: '',
    guardianName: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [resStudents, resAcademic] = await Promise.all([
        api.getAdminStudents({ departmentId: departmentFilter }),
        api.getAcademicResources(),
      ]);

      if (resStudents.success) setStudents(resStudents.students || []);
      if (resAcademic.success) {
        setDepartments(resAcademic.departments || []);
        if (resAcademic.departments?.length > 0 && !formData.departmentId) {
          setFormData((prev) => ({ ...prev, departmentId: resAcademic.departments[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [departmentFilter]);

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setCreateError('');
      const res = await api.createStudent(formData);
      if (res.success) {
        setShowCreateModal(false);
        setFormData({
          name: '',
          email: '',
          usn: '',
          departmentId: departments[0]?.id || '',
          semester: 5,
          section: '5A',
          rollNo: '',
          contactNo: '',
          guardianName: '',
        });
        loadData();
      }
    } catch (err) {
      setCreateError(err.message || 'Failed to create student account');
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadStudentReport = async (studentId) => {
    try {
      const res = await api.getStudentReport(studentId);
      if (res.success && res.report) {
        exportStudentAttendancePDF(res.report);
      }
    } catch (err) {
      alert(err.message || 'Failed to generate PDF');
    }
  };

  const filteredStudents = students.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return s.name.toLowerCase().includes(term) || s.usn.toLowerCase().includes(term) || s.email.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Student Directory & Enrollment
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage university student registrations, semester course enrollments, and print official attendance statements.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Enroll New Student</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">Department:</span>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name, USN, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton lines={6} />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No students found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">USN / Reg No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Branch & Sem</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-center">Cumulative Attendance</th>
                  <th className="py-3 px-4 text-center">Eligibility</th>
                  <th className="py-3 px-4 text-right">Official Statement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {s.usn}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      <div>{s.name}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{s.email}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {s.departmentCode} • Sem {s.semester} (Sec {s.section})
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {s.contactNo || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-black text-sm ${
                          s.stats?.percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {s.stats?.percentage || 0}%
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {s.stats?.attended || 0} / {s.stats?.conducted || 0} classes
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge
                        status={s.stats?.percentage >= 75 ? 'ELIGIBLE' : 'SHORTAGE'}
                        text={s.stats?.percentage >= 75 ? 'Eligible' : 'Shortage'}
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDownloadStudentReport(s.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900 transition-colors"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>PDF Statement</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enroll Student Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Enroll New University Student"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          {createError && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold">
              {createError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Student Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                USN / Registration No <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 1MS21CS150"
                value={formData.usn}
                onChange={(e) => setFormData({ ...formData, usn: e.target.value.toUpperCase() })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Institutional Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="student.name@logisys.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Academic Department <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Semester
              </label>
              <input
                type="number"
                min="1"
                max="8"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Section
              </label>
              <input
                type="text"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Roll No
              </label>
              <input
                type="text"
                placeholder="e.g. 21CS150"
                value={formData.rollNo}
                onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            * Note: New students are automatically assigned default credentials (<code>Student@123</code>) and enrolled into active semester courses.
          </p>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Enrolling...' : 'Confirm Enrollment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
