const API_BASE = '/api';

class ApiService {
  getToken() {
    return localStorage.getItem('logisys_auth_token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('logisys_auth_token', token);
    } else {
      localStorage.removeItem('logisys_auth_token');
    }
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body === 'object' && !isFormData) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          this.setToken(null);
          localStorage.removeItem('logisys_user_info');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Upload endpoints
  uploadProofFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/upload/proof', {
      method: 'POST',
      body: formData,
    });
  }

  uploadAvatarFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/upload/avatar', {
      method: 'POST',
      body: formData,
    });
  }

  // Auth endpoints
  login(credentials) {
    return this.request('/auth/login', { method: 'POST', body: credentials });
  }

  getMe() {
    return this.request('/auth/me');
  }

  changePassword(data) {
    return this.request('/auth/change-password', { method: 'POST', body: data });
  }

  updateProfile(data) {
    return this.request('/auth/profile', { method: 'PUT', body: data });
  }

  // Student endpoints
  getStudentDashboard() {
    return this.request('/student/dashboard');
  }

  getStudentAttendance(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/student/attendance${query ? `?${query}` : ''}`);
  }

  getAttendanceCalculator(target = 75) {
    return this.request(`/student/calculator?target=${target}`);
  }

  getStudentTimetable() {
    return this.request('/student/timetable');
  }

  submitCorrectionRequest(data) {
    return this.request('/student/corrections', { method: 'POST', body: data });
  }

  getStudentCorrections() {
    return this.request('/student/corrections');
  }

  cancelCorrectionRequest(id) {
    return this.request(`/student/corrections/${id}`, { method: 'DELETE' });
  }

  // Faculty endpoints
  getFacultyDashboard() {
    return this.request('/faculty/dashboard');
  }

  getFacultyTimetable() {
    return this.request('/faculty/timetable');
  }

  getEnrolledStudents(subjectId, sectionId) {
    return this.request(`/faculty/students?subjectId=${subjectId}&sectionId=${sectionId}`);
  }

  markAttendance(data) {
    return this.request('/faculty/attendance', { method: 'POST', body: data });
  }

  getSessionAttendance(sessionId) {
    return this.request(`/faculty/sessions/${sessionId}`);
  }

  updateSessionAttendance(sessionId, data) {
    return this.request(`/faculty/sessions/${sessionId}`, { method: 'PUT', body: data });
  }

  deleteClassSession(sessionId, reason) {
    return this.request(`/faculty/sessions/${sessionId}`, {
      method: 'DELETE',
      body: { reason },
    });
  }

  getFacultyReports(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/faculty/reports${query ? `?${query}` : ''}`);
  }

  // Admin endpoints
  getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  getAdminStudents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/admin/students${query ? `?${query}` : ''}`);
  }

  getAdminStudent(id) {
    return this.request(`/admin/students/${id}`);
  }

  createStudent(data) {
    return this.request('/admin/students', { method: 'POST', body: data });
  }

  updateStudent(id, data) {
    return this.request(`/admin/students/${id}`, { method: 'PUT', body: data });
  }

  deleteStudent(id) {
    return this.request(`/admin/students/${id}`, { method: 'DELETE' });
  }

  bulkImportStudents(students) {
    return this.request('/admin/students/bulk-import', { method: 'POST', body: { students } });
  }

  getAdminFaculty() {
    return this.request('/admin/faculty');
  }

  createFaculty(data) {
    return this.request('/admin/faculty', { method: 'POST', body: data });
  }

  updateFaculty(id, data) {
    return this.request(`/admin/faculty/${id}`, { method: 'PUT', body: data });
  }

  deleteFaculty(id) {
    return this.request(`/admin/faculty/${id}`, { method: 'DELETE' });
  }

  createDepartment(data) {
    return this.request('/admin/departments', { method: 'POST', body: data });
  }

  updateDepartment(id, data) {
    return this.request(`/admin/departments/${id}`, { method: 'PUT', body: data });
  }

  deleteDepartment(id) {
    return this.request(`/admin/departments/${id}`, { method: 'DELETE' });
  }

  createSubject(data) {
    return this.request('/admin/subjects', { method: 'POST', body: data });
  }

  updateSubject(id, data) {
    return this.request(`/admin/subjects/${id}`, { method: 'PUT', body: data });
  }

  deleteSubject(id) {
    return this.request(`/admin/subjects/${id}`, { method: 'DELETE' });
  }

  createSection(data) {
    return this.request('/admin/sections', { method: 'POST', body: data });
  }

  assignFaculty(data) {
    return this.request('/admin/assignments', { method: 'POST', body: data });
  }

  removeFacultyAssignment(id) {
    return this.request(`/admin/assignments/${id}`, { method: 'DELETE' });
  }

  getTimetables(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/admin/timetables${query ? `?${query}` : ''}`);
  }

  createTimetableEntry(data) {
    return this.request('/admin/timetables', { method: 'POST', body: data });
  }

  deleteTimetableEntry(id) {
    return this.request(`/admin/timetables/${id}`, { method: 'DELETE' });
  }

  getAdminCorrections(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/admin/corrections${query ? `?${query}` : ''}`);
  }

  reviewCorrection(id, data) {
    return this.request(`/admin/corrections/${id}/review`, { method: 'PUT', body: data });
  }

  getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/admin/audit-logs${query ? `?${query}` : ''}`);
  }

  getSystemSettings() {
    return this.request('/admin/settings');
  }

  updateSystemSettings(data) {
    return this.request('/admin/settings', { method: 'PUT', body: data });
  }

  getAcademicResources() {
    return this.request('/admin/academic-resources');
  }

  // Reports
  getStudentReport(studentId = '') {
    return this.request(`/reports/student/${studentId}`);
  }

  getClassMatrix(subjectId, sectionId) {
    return this.request(`/reports/class-matrix?subjectId=${subjectId}&sectionId=${sectionId}`);
  }

  getDepartmentSummary() {
    return this.request('/reports/department-summary');
  }

  // Notifications
  getNotifications() {
    return this.request('/notifications');
  }

  markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  markAllNotificationsRead() {
    return this.request('/notifications/read-all', { method: 'PUT' });
  }

  broadcastAnnouncement(data) {
    return this.request('/notifications/broadcast', { method: 'POST', body: data });
  }
}

export const api = new ApiService();
export default api;
