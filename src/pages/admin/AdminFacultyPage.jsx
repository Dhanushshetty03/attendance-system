import React, { useEffect, useState } from 'react';
import { UserCheck, PlusCircle, Search, Mail, Phone, BookOpen } from 'lucide-react';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Modal } from '../../components/common/Modal';
import api from '../../services/api';

export function AdminFacultyPage() {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Add Faculty Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeId: '',
    departmentId: '',
    designation: 'Assistant Professor',
    qualification: 'Ph.D.',
    contactNo: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [resFaculty, resAcademic] = await Promise.all([
        api.getAdminFaculty(),
        api.getAcademicResources(),
      ]);

      if (resFaculty.success) setFaculty(resFaculty.faculty || []);
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
  }, []);

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      const res = await api.createFaculty(formData);
      if (res.success) {
        setShowModal(false);
        setFormData({
          name: '',
          email: '',
          employeeId: '',
          departmentId: departments[0]?.id || '',
          designation: 'Assistant Professor',
          qualification: 'Ph.D.',
          contactNo: '',
        });
        loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to create faculty account');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFaculty = faculty.filter((f) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return f.name.toLowerCase().includes(term) || f.employeeId.toLowerCase().includes(term) || f.department.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Faculty & Academic Staff Directory
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage professorial appointments, teaching assignments, and department affiliations.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Faculty Member</span>
        </button>
      </div>

      {/* Faculty Cards Grid */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80 mb-4">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search faculty by name, employee ID, dept..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <LoadingSkeleton lines={6} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFaculty.map((f) => (
              <div
                key={f.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between space-y-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{f.name}</h3>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{f.designation}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold">
                      {f.employeeId}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-2">{f.department}</p>
                  <p className="text-[11px] text-slate-400">{f.qualification}</p>

                  <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{f.email}</span>
                    </div>
                    {f.contactNo && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{f.contactNo}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Teaching Assignments ({f.assignments?.length || 0}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {f.assignments?.map((a) => (
                      <span
                        key={a.id}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      >
                        {a.subjectCode} (Sec {a.sectionName})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Faculty Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Faculty Member"
      >
        <form onSubmit={handleCreateFaculty} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Faculty Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Ramesh Rao"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Official Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="faculty.name@logisys.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Employee ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FAC-CSE-033"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Department <span className="text-rose-500">*</span>
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

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            * Note: New faculty accounts are provisioned with default password <code>Faculty@123</code>.
          </p>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Faculty'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
