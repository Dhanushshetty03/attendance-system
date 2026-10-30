import { Router } from 'express';
import {
  getDashboard,
  getFacultyTimetable,
  getEnrolledStudents,
  markAttendance,
  getSessionAttendance,
  updateSessionAttendance,
  deleteClassSession,
  getFacultyReports,
} from '../controllers/faculty.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize(['FACULTY', 'ADMIN']));

router.get('/dashboard', getDashboard);
router.get('/timetable', getFacultyTimetable);
router.get('/students', getEnrolledStudents);
router.post('/attendance', markAttendance);
router.get('/sessions/:sessionId', getSessionAttendance);
router.put('/sessions/:sessionId', updateSessionAttendance);
router.delete('/sessions/:sessionId', deleteClassSession);
router.get('/reports', getFacultyReports);

export default router;
