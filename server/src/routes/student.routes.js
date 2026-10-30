import { Router } from 'express';
import {
  getDashboard,
  getAttendanceHistory,
  calculateAttendanceProjection,
  getTimetable,
  submitCorrectionRequest,
  getCorrectionRequests,
  deleteCorrectionRequest,
} from '../controllers/student.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize(['STUDENT', 'ADMIN']));

router.get('/dashboard', getDashboard);
router.get('/attendance', getAttendanceHistory);
router.get('/calculator', calculateAttendanceProjection);
router.get('/timetable', getTimetable);
router.post('/corrections', submitCorrectionRequest);
router.get('/corrections', getCorrectionRequests);
router.delete('/corrections/:id', deleteCorrectionRequest);

export default router;
