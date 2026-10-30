import { Router } from 'express';
import {
  getDashboard,
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkImportStudents,
  getFacultyList,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createSubject,
  updateSubject,
  deleteSubject,
  createSection,
  assignFaculty,
  removeFacultyAssignment,
  getTimetables,
  createTimetableEntry,
  deleteTimetableEntry,
  getCorrectionRequests,
  reviewCorrectionRequest,
  getAuditLogs,
  getSystemSettings,
  updateSystemSettings,
  getAcademicResources,
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN']));

// Dashboard
router.get('/dashboard', getDashboard);

// Students CRUD & Bulk Import
router.get('/students', getStudents);
router.get('/students/:id', getStudentById);
router.post('/students', createStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);
router.post('/students/bulk-import', bulkImportStudents);

// Faculty CRUD
router.get('/faculty', getFacultyList);
router.post('/faculty', createFaculty);
router.put('/faculty/:id', updateFaculty);
router.delete('/faculty/:id', deleteFaculty);

// Academic Structure: Departments & Subjects
router.get('/academic-resources', getAcademicResources);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

// Sections & Faculty Assignments
router.post('/sections', createSection);
router.post('/assignments', assignFaculty);
router.delete('/assignments/:id', removeFacultyAssignment);

// Timetables
router.get('/timetables', getTimetables);
router.post('/timetables', createTimetableEntry);
router.delete('/timetables/:id', deleteTimetableEntry);

// Attendance Corrections Review
router.get('/corrections', getCorrectionRequests);
router.put('/corrections/:id/review', reviewCorrectionRequest);

// Audit & Settings
router.get('/audit-logs', getAuditLogs);
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

export default router;
