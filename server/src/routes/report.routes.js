import { Router } from 'express';
import {
  getStudentAttendanceReport,
  getClassMatrixReport,
  exportStudentAttendanceCSV,
  exportClassMatrixCSV,
  getDepartmentSummaryReport,
} from '../controllers/report.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Student report (JSON & CSV)
router.get('/student/:studentId?', getStudentAttendanceReport);
router.get('/student/:studentId/csv', exportStudentAttendanceCSV);

// Class attendance matrix report (JSON & CSV)
router.get('/class-matrix', getClassMatrixReport);
router.get('/class-matrix/csv', exportClassMatrixCSV);

// Campus / Department summary report (Faculty & Admin)
router.get('/department-summary', authorize(['FACULTY', 'ADMIN']), getDepartmentSummaryReport);

export default router;
