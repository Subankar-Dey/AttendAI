import express from 'express';
import { markAttendance, getAttendance, getAbsentees, getLowAttendance, getStudentAttendance, getAttendanceLogs, getMyAttendance } from '../controllers/attendanceController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(authenticate);

router.post('/mark', requireRole('admin', 'staff'), markAttendance);
router.get('/my', getMyAttendance);
router.get('/', getAttendance);
router.get('/absent', getAbsentees);
router.get('/low-attendance', getLowAttendance);
router.get('/logs', getAttendanceLogs);
router.get('/student/:studentId', getStudentAttendance);

export default router;